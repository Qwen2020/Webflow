<script>
// Global array for direct rendering endpoints
// (Populate these endpoints as needed)
const renderEndpoints = [
    'https://coinglass-backend-production.up.railway.app/api/mv/',
    'https://coinglass-backend-production.up.railway.app/api/gls/gainers-losers' // index 0: for data-api-render
];

class TableManager {
    constructor(tableElement) {
        this.tableElement = tableElement;
        this.templateRow = null; // Property to store the cloned template row
        this.initializeTemplateRow();
        this.apiUrl = tableElement.getAttribute('data-api-table');
        this.itemsPerPage = parseInt(this.tableElement.getAttribute('data-api-table-item-limit'), 10) || 10;
        this.currentPage = 1; // Start from the first page
        this.totalItems = 0; // Assuming this will be fetched or set somehow
        this.allData = []; // Property to store all fetched data

        const hideAttribute = tableElement.getAttribute('data-api-table-hide');
        if (hideAttribute) {
            this.exclusionCriteria = this.parseExclusionCriteria(hideAttribute);
        } else {
            this.exclusionCriteria = {};
        }

        this.setupPaginationControls();
    }

    // Parse exclusion criteria from attribute value.
    parseExclusionCriteria(attributeValue) {
        const criteria = {};
        const regex = /(\w+)=\[(.*?)\]/g;
        let match;
        while ((match = regex.exec(attributeValue)) !== null) {
            const key = match[1];
            const values = match[2].split(',').map(value => value.trim());
            criteria[key] = values;
        }
        return criteria;
    }

    // Filter data based on exclusion criteria.
    filterData(data, criteria) {
        return data.filter(item => {
            for (const key in criteria) {
                if (criteria[key].includes(item[key])) {
                    return false;
                }
            }
            return true;
        });
    }

    formatDate(date, format) {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        let result = format.replace("YYYY", year.toString())
            .replace("MM", month)
            .replace("DD", day);
        result = result.replace("HH", hours)
            .replace("mm", minutes)
            .replace("ss", seconds);
        return result;
    }

    initializeTemplateRow() {
        const tbody = this.tableElement.querySelector('tbody');
        if (!this.templateRow) {
            const templateRow = tbody.querySelector('tr');
            if (templateRow) {
                console.log('Template row found:', templateRow);
                this.templateRow = templateRow.cloneNode(true);
            } else {
                console.error('Template row not found in the table.');
            }
        }
    }

    updateApiUrlAndRefetch(newUrl) {
        this.apiUrl = newUrl;
        this.currentPage = 1;
        this.initializeTemplateRow();
        this.clearTableContent();
        this.updatePaginationControls(1);
        this.fetchDataAndPopulate();
    }

    clearTableContent() {
        const tbody = this.tableElement.querySelector('tbody');
        tbody.innerHTML = '';
    }

    setupPaginationControls() {
        this.nextButton = this.tableElement.querySelector('[data-api-table-pagination="next"]');
        this.prevButton = this.tableElement.querySelector('[data-api-table-pagination="previous"]');
        this.paginationNumbersContainer = this.tableElement.querySelector('[data-api-table-pagination="numbers"]');
        this.nextButton.addEventListener('click', async () => {
            if (this.currentPage < Math.ceil(this.totalItems / this.itemsPerPage)) {
                this.currentPage++;
                this.populateTable();
            }
        });
        this.prevButton.addEventListener('click', async () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.populateTable();
            }
        });
        this.updatePaginationControls();
    }

    createPaginationNumbers(totalPages) {
        this.paginationNumbersContainer.innerHTML = '';
        const fragment = document.createDocumentFragment();
        const addPageNumber = (page) => {
            const pageNumber = document.createElement('span');
            pageNumber.classList.add('pagination_number');
            if (page === this.currentPage) {
                pageNumber.classList.add('is--active');
            }
            pageNumber.textContent = page;
            pageNumber.addEventListener('click', async () => {
                this.currentPage = page;
                this.populateTable();
            });
            fragment.appendChild(pageNumber);
        };
        const addEllipsis = () => {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.classList.add('pagination_dots');
            fragment.appendChild(ellipsis);
        };
        if (totalPages <= 6) {
            for (let i = 1; i <= totalPages; i++) {
                addPageNumber(i);
            }
        } else {
            addPageNumber(1);
            if (this.currentPage > 4) {
                addEllipsis();
            }
            const startPage = Math.max(2, this.currentPage - 1);
            const endPage = Math.min(totalPages - 1, this.currentPage + 1);
            for (let i = startPage; i <= endPage; i++) {
                addPageNumber(i);
            }
            if (this.currentPage < totalPages - 3) {
                addEllipsis();
            }
            addPageNumber(totalPages);
        }
        this.paginationNumbersContainer.appendChild(fragment);
    }

    async fetchDataAndPopulate() {
        try {
            const response = await fetch(this.apiUrl);
            if (!response.ok) throw new Error('Network response was not ok.');
            let data = await response.json();
            console.log('Raw API response:', data);
            const dataPath = this.tableElement.getAttribute('data-api-table-data-path');
            if (dataPath) {
                const keys = dataPath.split('.');
                let nestedData = data;
                keys.forEach(key => {
                    if (nestedData && key in nestedData) {
                        nestedData = nestedData[key];
                    } else {
                        nestedData = null;
                    }
                });
                console.log('Extracted nested data for path', dataPath, ':', nestedData);
                if (Array.isArray(nestedData)) {
                    data = nestedData;
                }
            }
            if (this.exclusionCriteria) {
                this.allData = this.filterData(data, this.exclusionCriteria);
            } else {
                this.allData = data;
            }
            console.log('Data to be rendered:', this.allData);
            this.totalItems = this.allData.length;
            const totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
            this.updatePaginationControls(totalPages);
            this.populateTable();
        } catch (error) {
            console.error('Failed to fetch and populate data:', error);
        }
    }

    populateTable() {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageData = this.allData.slice(startIndex, endIndex);
        const fragment = document.createDocumentFragment();
        pageData.forEach((item, index) => {
            const row = this.templateRow.cloneNode(true);
            row.querySelectorAll('[data-api-table-row-index]').forEach(element => {
                element.textContent = startIndex + index + 1;
            });
            row.querySelectorAll('[data-api-table-text]').forEach(element => {
                const attr = element.getAttribute('data-api-table-text');
                if (item[attr] !== undefined) {
                    let content = item[attr] === null ? "N/A" : item[attr];
                    // Use our helper to apply formatting (including negative classes)
                    content = applyElementFormatting(element, content);
                    element.textContent = content;
                }
            });
            row.querySelectorAll('[data-api-table-image-source]').forEach(element => {
                const imageAttr = element.getAttribute('data-api-table-image-source');
                if (item[imageAttr] !== undefined) {
                    element.src = item[imageAttr];
                }
            });
            row.querySelectorAll('[data-api-table-chart]').forEach(element => {
                const chartAttr = element.getAttribute('data-api-table-chart');
                if (item[chartAttr] !== undefined) {
                    const chartData = item[chartAttr];
                    element.src = `data:image/png;base64,${chartData}`;
                }
            });
            fragment.appendChild(row);
        });
        const tbody = this.tableElement.querySelector('tbody');
        const currentHeight = tbody.offsetHeight;
        tbody.style.height = `${currentHeight}px`;
        tbody.innerHTML = '';
        tbody.appendChild(fragment);
        tbody.style.height = 'auto';
        this.updatePaginationControls(Math.ceil(this.totalItems / this.itemsPerPage));
    }

    updatePaginationControls(totalPages) {
        this.prevButton.style.display = this.currentPage > 1 ? 'flex' : 'none';
        this.nextButton.style.display = this.currentPage < totalPages ? 'flex' : 'none';
        this.createPaginationNumbers(totalPages);
    }

    formatNumber(num) {
        const absNum = Math.abs(num);
        let formattedNum;
        if (absNum >= 1e12) {
            formattedNum = (absNum / 1e12).toFixed(2) + 'T';
        } else if (absNum >= 1e9) {
            formattedNum = (absNum / 1e9).toFixed(2) + 'B';
        } else if (absNum >= 1e6) {
            formattedNum = (absNum / 1e6).toFixed(2) + 'M';
        } else {
            formattedNum = absNum.toString();
        }
        return num < 0 ? '-' + formattedNum : formattedNum;
    }
}

class RenderManager {
    constructor(renderElement, endpointUrl) {
        this.renderElement = renderElement;
        this.endpointUrl = endpointUrl;
        // Dot-path to target data is stored in the attribute's value.
        this.dotPath = renderElement.getAttribute('data-api-render') || '';
    }

    async fetchAndRender() {
        try {
            const response = await fetch(this.endpointUrl);
            if (!response.ok) throw new Error('Network response was not ok.');
            let data = await response.json();
            let value = this.dotPath ? this.extractValue(data, this.dotPath) : data;
            value = this.applyFormatting(value);
            this.renderElement.innerText = value;
        } catch (error) {
            console.error('Failed to fetch and render data:', error);
        }
    }

    // Extract nested value using dot notation (supports array indices)
    extractValue(obj, path) {
        const parts = path.split('.');
        let value = obj;
        for (const part of parts) {
            const arrayRegex = /(\w+)(?:\[(\d+)\])?/;
            const match = arrayRegex.exec(part);
            if (match) {
                const prop = match[1];
                const index = match[2];
                value = value[prop];
                if (index !== undefined && Array.isArray(value)) {
                    value = value[parseInt(index, 10)];
                }
            } else {
                value = undefined;
                break;
            }
        }
        return value;
    }

    applyFormatting(rawValue) {
        // Use the same helper for formatting (which now applies negative classes)
        return applyElementFormatting(this.renderElement, rawValue);
    }
}

// Helper function for element formatting.
// Applies type-based formatting (timestamp, number, time) first, then prepend/append,
// and finally adds negative classes if the original raw value is a negative number.
function applyElementFormatting(element, rawValue) {
    let value = rawValue;
    // Determine negativity from the raw value (if numeric)
    const numericValue = parseFloat(rawValue);
    const isNegative = !isNaN(numericValue) && numericValue < 0;
    
    // Type-based formatting:
    if (element.hasAttribute('data-timestamp')) {
        const format = element.getAttribute('data-timestamp');
        const timestamp = parseInt(value, 10);
        const date = new Date(timestamp);
        value = !isNaN(date.getTime()) ? formatDate(date, format) : "Invalid Date";
    }
    if (element.hasAttribute('data-format-number')) {
        let num = parseFloat(value);
        if (!isNaN(num)) {
            value = formatNumber(num);
        }
    }
    if (element.hasAttribute('data-format-time')) {
        const format = element.getAttribute('data-format-time');
        const date = new Date(value);
        value = formatDate(date, format);
    }
    // Text modifications:
    if (element.hasAttribute('data-prepend')) {
        value = element.getAttribute('data-prepend') + value;
    }
    if (element.hasAttribute('data-append')) {
        value = value + element.getAttribute('data-append');
    }
    // Apply negative classes if the raw value is negative.
    if (isNegative) {
        if (element.hasAttribute('data-negative-class')) {
            element.classList.add(element.getAttribute('data-negative-class'));
        }
        if (element.hasAttribute('data-negative-parent-class') && element.parentNode) {
            element.parentNode.classList.add(element.getAttribute('data-negative-parent-class'));
        }
    } else {
        if (element.hasAttribute('data-negative-class')) {
            element.classList.remove(element.getAttribute('data-negative-class'));
        }
        if (element.hasAttribute('data-negative-parent-class') && element.parentNode) {
            element.parentNode.classList.remove(element.getAttribute('data-negative-parent-class'));
        }
    }
    return value;
}

// Helper function to format numbers.
function formatNumber(num) {
    const absNum = Math.abs(num);
    let formattedNum;
    if (absNum >= 1e12) {
        formattedNum = (absNum / 1e12).toFixed(2) + 'T';
    } else if (absNum >= 1e9) {
        formattedNum = (absNum / 1e9).toFixed(2) + 'B';
    } else if (absNum >= 1e6) {
        formattedNum = (absNum / 1e6).toFixed(2) + 'M';
    } else {
        formattedNum = absNum.toString();
    }
    return num < 0 ? '-' + formattedNum : formattedNum;
}

// Helper function to format dates.
function formatDate(date, format) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    let result = format.replace("YYYY", year.toString())
        .replace("MM", month)
        .replace("DD", day);
    result = result.replace("HH", hours)
        .replace("mm", minutes)
        .replace("ss", seconds);
    return result;
}

// Initialize TableManager for elements with [data-api-table].
document.querySelectorAll('[data-api-table]').forEach(tableElement => {
    const manager = new TableManager(tableElement);
    manager.fetchDataAndPopulate();
    tableElement.tableManager = manager;
});

// Update table URL and refetch data when a menu item is clicked.
document.addEventListener('click', function (event) {
    let targetElement = event.target.closest('[data-api-table-url]');
    if (targetElement) {
        let parentMenu = targetElement.closest('[data-api-table-menu]');
        if (parentMenu) {
            let tableElement = parentMenu.nextElementSibling;
            while (tableElement && !tableElement.hasAttribute('data-api-table')) {
                tableElement = tableElement.nextElementSibling;
            }
            if (tableElement) {
                const newUrl = targetElement.getAttribute('data-api-table-url');
                tableElement.setAttribute('data-api-table', newUrl);
                if (tableElement.tableManager) {
                    tableElement.tableManager.updateApiUrlAndRefetch(newUrl);
                } else {
                    const manager = new TableManager(tableElement);
                    manager.updateApiUrlAndRefetch(newUrl);
                }
            }
        }
    }
});

// Initialize tables and direct renderers on page load.
document.addEventListener('DOMContentLoaded', () => {
    // Initialize tables.
    const tableElements = document.querySelectorAll('[data-api-table]');
    tableElements.forEach(tableElement => {
        const tableManagerInstance = new TableManager(tableElement);
        tableElement.tableManager = tableManagerInstance;
    });

    // Dynamic Direct Rendering:
    // For each endpoint in renderEndpoints, build the attribute name:
    // index 0 -> data-api-render, index 1 -> data-api-render-2, etc.
    const renderElementsByEndpoint = {};
    renderEndpoints.forEach((endpointUrl, index) => {
        const attrName = index === 0 ? 'data-api-render' : `data-api-render-${index + 1}`;
        const elements = document.querySelectorAll(`[${attrName}]`);
        if (elements.length > 0) {
            renderElementsByEndpoint[index] = Array.from(elements);
        }
    });

    // For each endpoint group, fetch once and update all elements in that group.
    Object.keys(renderElementsByEndpoint).forEach(endpointIndex => {
        const endpointUrl = renderEndpoints[endpointIndex];
        if (endpointUrl) {
            fetch(endpointUrl)
                .then(response => response.json())
                .then(data => {
                    renderElementsByEndpoint[endpointIndex].forEach(element => {
                        const attrName = endpointIndex == 0 ? 'data-api-render' : `data-api-render-${parseInt(endpointIndex) + 1}`;
                        const dotPath = element.getAttribute(attrName);
                        let value = dotPath ? extractValue(data, dotPath) : data;
                        value = applyElementFormatting(element, value);
                        element.innerText = value;
                    });
                })
                .catch(error => {
                    console.error(`Error fetching data for endpoint index ${endpointIndex}:`, error);
                });
        } else {
            console.warn(`No endpoint found for index ${endpointIndex}`);
        }
    });

    // Helper to extract nested value using dot-path notation (supports array indices).
    function extractValue(obj, path) {
        const parts = path.split('.');
        let value = obj;
        for (const part of parts) {
            const arrayRegex = /(\w+)(?:\[(\d+)\])?/;
            const match = arrayRegex.exec(part);
            if (match) {
                const prop = match[1];
                const index = match[2];
                value = value[prop];
                if (index !== undefined && Array.isArray(value)) {
                    value = value[parseInt(index, 10)];
                }
            } else {
                value = undefined;
                break;
            }
        }
        return value;
    }
});

// Sort and ordering features for the table.
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-api-table-order-by]').forEach(headerItem => {
        headerItem.addEventListener('click', function () {
            const orderByValue = this.getAttribute('data-api-table-order-by');
            const tableElement = this.closest('[data-api-table]');
            if (tableElement) {
                let baseUrl = tableElement.getAttribute('data-api-table');
                const urlParts = baseUrl.split('?');
                baseUrl = urlParts[0];
                const existingParams = new URLSearchParams(urlParts[1] || '');
                const currentSort = existingParams.get('sort');
                const currentOrder = existingParams.get('order');
                if (currentSort === orderByValue) {
                    existingParams.set('order', currentOrder === 'asc' ? 'desc' : 'asc');
                } else {
                    existingParams.set('order', 'desc');
                }
                existingParams.set('sort', orderByValue);
                const newUrl = `${baseUrl}?${existingParams.toString()}`;
                tableElement.setAttribute('data-api-table', newUrl);
                if (tableElement.tableManager) {
                    tableElement.tableManager.updateApiUrlAndRefetch(newUrl);
                } else {
                    const manager = new TableManager(tableElement);
                    manager.updateApiUrlAndRefetch(newUrl);
                }
            }
        });
    });
});

</script>
