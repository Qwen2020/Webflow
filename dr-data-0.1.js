/**
 * Data Dr - Data Rendering Library
 * Version: 1.0.0
 *
 * Renders external JSON data into HTML elements using data attributes.
 *
 * Usage:
 * <script src="data-dr.js"></script>
 *
 * Attributes:
 * - data-dr-source="URL" - Define a data source
 * - data-dr-source-id="name" - Name the source for reference
 * - data-dr-bind="sourceId:path.to.field" - Bind text content
 * - data-dr-loop="sourceId:path.to.array" - Loop over array
 * - data-dr-if="sourceId:path.to.field" - Conditional show (truthy)
 * - data-dr-if-not="sourceId:path.to.field" - Conditional show (falsy)
 * - data-dr-format="format-type" - Format the value
 * - data-dr-error="hide|empty|placeholder:text" - Error handling
 * - data-dr-attr-{name}="sourceId:path" - Bind to HTML attribute
 */

(function() {
  'use strict';

  // ============================================================================
  // CONFIGURATION
  // ============================================================================

  const CONFIG = {
    debug: false,
    signature: '<!-- Data Dr (https://datadr.io) -->',
  };

  // Tier limits (for future license validation)
  const TIER_LIMITS = {
    free: { maxSources: 2, maxBindings: 15, maxLoopItems: 25 },
    pro: { maxSources: 10, maxBindings: 100, maxLoopItems: 500 },
    agency: { maxSources: Infinity, maxBindings: Infinity, maxLoopItems: Infinity }
  };

  // ============================================================================
  // STATE
  // ============================================================================

  const state = {
    sources: {},      // sourceId -> { url, element }
    data: {},         // sourceId -> fetched data
    tier: 'free',
    stats: { sources: 0, bindings: 0, loopItems: 0 }
  };

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  function log(...args) {
    if (CONFIG.debug) console.log('[Data Dr]', ...args);
  }

  function error(...args) {
    console.error('[Data Dr]', ...args);
  }

  /**
   * Parse binding path: "sourceId:path.to.field" or ".relativePath"
   */
  function parseBindingPath(path) {
    if (path.startsWith('.')) {
      return { sourceId: null, fieldPath: path.substring(1) };
    }
    const colonIndex = path.indexOf(':');
    if (colonIndex > -1) {
      return {
        sourceId: path.substring(0, colonIndex),
        fieldPath: path.substring(colonIndex + 1)
      };
    }
    return { sourceId: null, fieldPath: path };
  }

  /**
   * Resolve a path like "items[0].name" from data object
   */
  function resolvePath(data, path) {
    if (!path || path === '') return data;
    if (data === null || data === undefined) return undefined;

    const segments = [];
    const regex = /([^.\[\]]+)|\[(\d+)\]/g;
    let match;

    while ((match = regex.exec(path)) !== null) {
      if (match[1] !== undefined) {
        segments.push({ type: 'prop', key: match[1] });
      } else if (match[2] !== undefined) {
        segments.push({ type: 'index', key: parseInt(match[2], 10) });
      }
    }

    let current = data;
    for (const segment of segments) {
      if (current === null || current === undefined) return undefined;
      current = current[segment.key];
    }

    return current;
  }

  /**
   * Check if value is truthy for conditionals
   */
  function isTruthy(value) {
    if (value === null || value === undefined) return false;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') return value.length > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return Boolean(value);
  }

  /**
   * Parse error handling config: "hide", "placeholder:N/A", etc.
   */
  function parseErrorConfig(value) {
    if (!value) return { type: 'empty' };
    const colonIndex = value.indexOf(':');
    if (colonIndex > -1) {
      return { type: value.substring(0, colonIndex), value: value.substring(colonIndex + 1) };
    }
    return { type: value };
  }

  // ============================================================================
  // FORMATTERS
  // ============================================================================

  const formatters = {
    'number-short': (val) => {
      const num = parseFloat(val);
      if (isNaN(num)) return val;
      const abs = Math.abs(num);
      if (abs >= 1e12) return (num / 1e12).toFixed(1).replace(/\.0$/, '') + 'T';
      if (abs >= 1e9) return (num / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
      if (abs >= 1e6) return (num / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
      if (abs >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
      return num.toString();
    },

    'number-compact': (val) => {
      const num = parseFloat(val);
      return isNaN(num) ? val : num.toLocaleString('en-US');
    },

    'decimal': (val, places = '2') => {
      const num = parseFloat(val);
      return isNaN(num) ? val : num.toFixed(parseInt(places, 10));
    },

    'currency': (val, code = 'USD') => {
      const num = parseFloat(val);
      if (isNaN(num)) return val;
      try {
        return num.toLocaleString('en-US', { style: 'currency', currency: code.toUpperCase() });
      } catch {
        return code + ' ' + num.toFixed(2);
      }
    },

    'percent': (val) => {
      const num = parseFloat(val);
      return isNaN(num) ? val : (num * 100).toFixed(1) + '%';
    },

    'uppercase': (val) => String(val).toUpperCase(),
    'lowercase': (val) => String(val).toLowerCase(),
    'capitalize': (val) => {
      const str = String(val);
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }
  };

  /**
   * Apply format to value
   */
  function applyFormat(value, formatStr) {
    if (!formatStr) return value;

    const [formatType, ...args] = formatStr.split(':');
    const formatter = formatters[formatType];

    if (formatter) {
      return formatter(value, ...args);
    }

    return value;
  }

  // ============================================================================
  // SOURCE MANAGEMENT
  // ============================================================================

  /**
   * Discover all data sources on the page
   * Supports both:
   * 1. Elements with data-dr-source attribute
   * 2. Global DataDrConfig.sources object
   */
  function discoverSources() {
    // Method 1: Check for global config
    if (window.DataDrConfig && window.DataDrConfig.sources) {
      const configSources = window.DataDrConfig.sources;
      Object.keys(configSources).forEach((id) => {
        const url = configSources[id];
        if (url && !state.sources[id]) {
          state.sources[id] = { url, element: null };
          state.stats.sources++;
          log('Config source:', id, url);
        }
      });
    }

    // Method 2: Elements with data-dr-source
    const elements = document.querySelectorAll('[data-dr-source]');

    elements.forEach((el) => {
      const url = el.getAttribute('data-dr-source');
      const id = el.getAttribute('data-dr-source-id') || generateSourceId(url);

      if (url && !state.sources[id]) {
        state.sources[id] = { url, element: el };
        state.stats.sources++;
        log('Element source:', id, url);
      }
    });

    return Object.keys(state.sources);
  }

  /**
   * Generate source ID from URL
   */
  function generateSourceId(url) {
    try {
      const parsed = new URL(url);
      const parts = parsed.pathname.split('/').filter(Boolean);
      return parts[parts.length - 1] || 'source';
    } catch {
      return 'source-' + Math.random().toString(36).substr(2, 6);
    }
  }

  /**
   * Fetch a single source
   */
  async function fetchSource(sourceId) {
    const source = state.sources[sourceId];
    if (!source) {
      error('Source not found:', sourceId);
      return null;
    }

    try {
      log('Fetching:', sourceId, source.url);
      const response = await fetch(source.url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      state.data[sourceId] = data;
      log('Loaded:', sourceId, data);
      return data;
    } catch (err) {
      error('Fetch failed for', sourceId, err.message);
      return null;
    }
  }

  /**
   * Fetch all sources
   */
  async function fetchAllSources() {
    const sourceIds = Object.keys(state.sources);
    await Promise.all(sourceIds.map(fetchSource));
  }

  // ============================================================================
  // RENDERERS
  // ============================================================================

  /**
   * Process conditionals (data-dr-if, data-dr-if-not)
   */
  function processConditionals() {
    // data-dr-if (show if truthy)
    document.querySelectorAll('[data-dr-if]').forEach((el) => {
      const path = el.getAttribute('data-dr-if');
      const { sourceId, fieldPath } = parseBindingPath(path);
      const data = sourceId ? state.data[sourceId] : null;

      if (data) {
        const value = resolvePath(data, fieldPath);
        if (!isTruthy(value)) {
          el.style.display = 'none';
        }
      }
    });

    // data-dr-if-not (show if falsy)
    document.querySelectorAll('[data-dr-if-not]').forEach((el) => {
      const path = el.getAttribute('data-dr-if-not');
      const { sourceId, fieldPath } = parseBindingPath(path);
      const data = sourceId ? state.data[sourceId] : null;

      if (data) {
        const value = resolvePath(data, fieldPath);
        if (isTruthy(value)) {
          el.style.display = 'none';
        }
      }
    });
  }

  /**
   * Process loops (data-dr-loop)
   */
  function processLoops() {
    const loopElements = document.querySelectorAll('[data-dr-loop]');

    loopElements.forEach((template) => {
      const path = template.getAttribute('data-dr-loop');
      const { sourceId, fieldPath } = parseBindingPath(path);
      const data = sourceId ? state.data[sourceId] : null;

      if (!data) {
        log('No data for loop:', path);
        return;
      }

      const items = resolvePath(data, fieldPath);

      if (!Array.isArray(items)) {
        log('Loop target is not an array:', path, items);
        return;
      }

      // Get parent and hide template
      const parent = template.parentNode;
      template.style.display = 'none';
      template.setAttribute('data-dr-template', 'true');

      // Limit items based on tier
      const limit = TIER_LIMITS[state.tier].maxLoopItems;
      const limitedItems = items.slice(0, limit);

      if (items.length > limit) {
        log(`Loop limited to ${limit} items (${state.tier} tier)`);
      }

      // Clone and populate for each item
      limitedItems.forEach((item, index) => {
        const clone = template.cloneNode(true);
        clone.removeAttribute('data-dr-loop');
        clone.removeAttribute('data-dr-template');
        clone.style.display = '';
        clone.setAttribute('data-dr-loop-index', index);

        // Process bindings within clone using item data
        processElementBindings(clone, item, sourceId);

        // Process nested loops
        clone.querySelectorAll('[data-dr-loop]').forEach((nestedLoop) => {
          const nestedPath = nestedLoop.getAttribute('data-dr-loop');
          if (nestedPath.startsWith('.')) {
            // Relative path - resolve from current item
            const nestedFieldPath = nestedPath.substring(1);
            const nestedItems = resolvePath(item, nestedFieldPath);

            if (Array.isArray(nestedItems)) {
              const nestedParent = nestedLoop.parentNode;
              nestedLoop.style.display = 'none';
              nestedLoop.setAttribute('data-dr-template', 'true');

              nestedItems.slice(0, limit).forEach((nestedItem, nestedIndex) => {
                const nestedClone = nestedLoop.cloneNode(true);
                nestedClone.removeAttribute('data-dr-loop');
                nestedClone.removeAttribute('data-dr-template');
                nestedClone.style.display = '';
                nestedClone.setAttribute('data-dr-loop-index', nestedIndex);

                processElementBindings(nestedClone, nestedItem, sourceId);
                nestedParent.insertBefore(nestedClone, nestedLoop);
              });
            }
          }
        });

        parent.insertBefore(clone, template);
        state.stats.loopItems++;
      });
    });
  }

  /**
   * Process bindings within an element (and children)
   */
  function processElementBindings(element, contextData, contextSourceId) {
    // Process data-dr-bind on this element
    if (element.hasAttribute('data-dr-bind')) {
      const path = element.getAttribute('data-dr-bind');
      const format = element.getAttribute('data-dr-format');
      const errorConfig = parseErrorConfig(element.getAttribute('data-dr-error'));

      let value;
      if (path.startsWith('.')) {
        // Relative path - use context data
        value = resolvePath(contextData, path.substring(1));
      } else {
        // Absolute path
        const { sourceId, fieldPath } = parseBindingPath(path);
        const data = sourceId ? state.data[sourceId] : contextData;
        value = resolvePath(data, fieldPath);
      }

      if (value !== undefined && value !== null) {
        element.textContent = applyFormat(value, format);
        state.stats.bindings++;
      } else {
        handleMissingData(element, errorConfig);
      }
    }

    // Process data-dr-attr-* attributes
    Array.from(element.attributes).forEach((attr) => {
      if (attr.name.startsWith('data-dr-attr-')) {
        const targetAttr = attr.name.replace('data-dr-attr-', '');
        const path = attr.value;

        let value;
        if (path.startsWith('.')) {
          value = resolvePath(contextData, path.substring(1));
        } else {
          const { sourceId, fieldPath } = parseBindingPath(path);
          const data = sourceId ? state.data[sourceId] : contextData;
          value = resolvePath(data, fieldPath);
        }

        if (value !== undefined && value !== null) {
          element.setAttribute(targetAttr, value);
        }
      }
    });

    // Process child elements
    element.querySelectorAll('[data-dr-bind]').forEach((child) => {
      if (!child.closest('[data-dr-loop]:not([data-dr-template])')) {
        const path = child.getAttribute('data-dr-bind');
        const format = child.getAttribute('data-dr-format');
        const errorConfig = parseErrorConfig(child.getAttribute('data-dr-error'));

        let value;
        if (path.startsWith('.')) {
          value = resolvePath(contextData, path.substring(1));
        } else {
          const { sourceId, fieldPath } = parseBindingPath(path);
          const data = sourceId ? state.data[sourceId] : contextData;
          value = resolvePath(data, fieldPath);
        }

        if (value !== undefined && value !== null) {
          child.textContent = applyFormat(value, format);
          state.stats.bindings++;
        } else {
          handleMissingData(child, errorConfig);
        }
      }
    });
  }

  /**
   * Process top-level bindings (not in loops)
   */
  function processBindings() {
    document.querySelectorAll('[data-dr-bind]').forEach((el) => {
      // Skip if inside a loop template or already processed
      if (el.closest('[data-dr-template]') || el.closest('[data-dr-loop-index]')) {
        return;
      }

      const path = el.getAttribute('data-dr-bind');
      const format = el.getAttribute('data-dr-format');
      const errorConfig = parseErrorConfig(el.getAttribute('data-dr-error'));

      const { sourceId, fieldPath } = parseBindingPath(path);
      const data = sourceId ? state.data[sourceId] : null;

      if (!data) {
        handleMissingData(el, errorConfig);
        return;
      }

      const value = resolvePath(data, fieldPath);

      if (value !== undefined && value !== null) {
        el.textContent = applyFormat(value, format);
        state.stats.bindings++;
      } else {
        handleMissingData(el, errorConfig);
      }
    });

    // Process attribute bindings
    document.querySelectorAll('*').forEach((el) => {
      Array.from(el.attributes).forEach((attr) => {
        if (attr.name.startsWith('data-dr-attr-')) {
          if (el.closest('[data-dr-template]')) return;

          const targetAttr = attr.name.replace('data-dr-attr-', '');
          const path = attr.value;
          const { sourceId, fieldPath } = parseBindingPath(path);
          const data = sourceId ? state.data[sourceId] : null;

          if (data) {
            const value = resolvePath(data, fieldPath);
            if (value !== undefined && value !== null) {
              el.setAttribute(targetAttr, value);
            }
          }
        }
      });
    });
  }

  /**
   * Handle missing data based on error config
   */
  function handleMissingData(element, config) {
    switch (config.type) {
      case 'hide':
        element.style.display = 'none';
        break;
      case 'placeholder':
        element.textContent = config.value || '';
        break;
      case 'default':
        element.textContent = config.value || '';
        break;
      case 'empty':
      default:
        element.textContent = '';
        break;
    }
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  /**
   * Add signature comment to page
   */
  function addSignature() {
    if (TIER_LIMITS[state.tier].maxSources === Infinity) {
      return; // Agency tier - no signature
    }
    document.body.insertAdjacentHTML('beforeend', CONFIG.signature);
  }

  /**
   * Main initialization
   */
  async function init() {
    log('Initializing...');

    // Discover sources
    const sourceIds = discoverSources();
    log('Found sources:', sourceIds);

    if (sourceIds.length === 0) {
      log('No data sources found');
      return;
    }

    // Fetch all data
    await fetchAllSources();

    // Process in order: conditionals -> loops -> bindings
    processConditionals();
    processLoops();
    processBindings();

    // Add signature
    addSignature();

    log('Rendering complete. Stats:', state.stats);
  }

  /**
   * Manual refresh
   */
  async function refresh(sourceId) {
    if (sourceId) {
      await fetchSource(sourceId);
    } else {
      await fetchAllSources();
    }
    processConditionals();
    processLoops();
    processBindings();
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  window.DataDr = {
    init,
    refresh,
    getData: (sourceId) => state.data[sourceId],
    getSources: () => Object.keys(state.sources),
    getStats: () => ({ ...state.stats }),
    setDebug: (enabled) => { CONFIG.debug = enabled; },
  };

  // Auto-initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
