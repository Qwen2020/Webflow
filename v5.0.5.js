/*********************************
 * Section: Constants and Configurations
 ********************************/
window.NO_CONTENT_CODE = "NO_CONTENT";

window.isStorefrontLeadSubmissionEnabled = (typeof window.enableStorefrontLeads == "boolean" && window.enableStorefrontLeads) ?? false;
window.isForceProdEnabled = (typeof window.forceProdEnv == "boolean" && window.forceProdEnv) ?? false;

window.params = new URLSearchParams(window.location.search);
window.isQA = window.location.hostname.includes('beta');// && params.get('qa');

/* Configuration and QA env/flags checks */
if (isQA && params.get('lang')) {
    window.lang = params.get('lang');
} else {
    window.lang = document.documentElement.lang;
}
window.isFrench = window.lang === 'fr-CA';

window.apiConfigs = {};
window.apiConfigs.dealerSearchPath = "/research/v2/dealer-search";
window.apiConfigs.vehicleSearchPath = "/research/v2/vehicle-inventory";
window.apiConfigs.modelTrimsPath = "/research/v2/trims-information";
window.apiConfigs.validatePostalCodeUrl = "/Home/Refine?returnOnInvalidLocation=true"
window.apiConfigs.salesLeadUrl = "/SendEmail/SaleLead";
window.apiConfigs.storefrontLeadUrl = "/SendEmail/StorefrontLead";
window.apiConfigs.getQuoteUrl = window.isStorefrontLeadSubmissionEnabled
    ? window.apiConfigs.storefrontLeadUrl
    : "/SendEmail/DealerPlusLead";

if (isQA && !window.isForceProdEnabled) {
    window.apiBaseUrl = window.isFrench
        ? "https://apimqa.autohebdo.net"
        : "https://apimqa.autotrader.ca";
} else {
    window.apiBaseUrl = window.isFrench
        ? "https://apimktprd01.autohebdo.net"
        : "https://apimktprd01.autotrader.ca";
}

/*********************************
 * Section: Generic Utils
 ********************************/

/*****
 * New Relic Browser Monitoring error logging.
 * Error messages will be in the format of :
 *  - ${window.ERROR_TYPE}: ${input message} ${if error object is provided, error object message} 
 * and it will include the stack trace in the newrelic error log if there was an error input.
 */
function logError(errorType, mess, e) {
    const formattedMessage = `${errorType}: ${mess}`;
    if (typeof newrelic !== "undefined" && newrelic !== null && typeof newrelic.noticeError === "function") {
        try {
            // This is so that we can stack errors and get the full stack trace
            // Regardless of browser. Taken from NewRelic documentation.
            if (typeof e === "object") {
                e.message = `${formattedMessage}: ${e.message}`
                throw e;
            } else {
                throw new Error(formattedMessage);
            }
        } catch (err) {
            newrelic.noticeError(err);
        }

        if (window.isQA) {
            console.error(formattedMessage, e);
        }
    } else {
        console.error(formattedMessage, e);
    }
}

window.ERROR_TYPE = {
    API: 'API',
    MAP: 'MAP',
    GENERIC: 'GENERIC',
    LEAD: 'LEAD',
    USER_INFO: 'USER_INFO',
    REQUEST_QUOTE: 'REQUEST_QUOTE',
    REQUEST_QUOTE_LOCATION: 'REQUEST_QUOTE_LOCATION'
}

function isDefined(input) {
    return typeof input !== 'undefined' && input !== null;
}

function defaultIfUndefined(input, defaultValue) {
    return isDefined(input) ? input : defaultValue;
}

function isBlank(input) {
    return typeof input !== 'string' || input == null || input.trim().length === 0;
}

function isEmptyArray(arr) {
    return !isNotEmptyArray(arr);
}

function isNotEmptyArray(arr) {
    return Array.isArray(arr) && arr.length > 0;
}

function safeLower(input) {
    if (isBlank(input))
        return input;
    return input.toLowerCase();
}

function isValidEmail(email) {
    if (isBlank(email))
        return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone) {
    if (isBlank(phone))
        return false;
    const phoneRegex = /^(?:\+?(\d{1}))?(([- \.]?(\d{3}?[- \.]?)|[- \.]?)\(?)?(\d{3})(\)?[- \.]?)(\d{3})[- \.]?(\d{2})[- \.]?(\d{2})$/;
    return phoneRegex.test(phone);
}

function isValidPostalCodeFormat(postalCode) {
    if (isBlank(postalCode))
        return false;
    const postalCodeRegex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
    return postalCodeRegex.test(postalCode);
}

window.isMobileDeviceCheckResult;
function isMobileDevice() {
    if (isDefined(window.isMobileDeviceCheckResult)) {
        return window.isMobileDeviceCheckResult;
    }

    let check = false;
    (function (a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window.opera);
    window.isMobileDeviceCheckResult = check;
    return check;
};

function tryLogEvent(data) {
    try {
        if (!isDefined(data))
            return;

        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push(data);
    } catch (e) {
        logError(ERROR_TYPE.GENERIC, 'Failed to log event.', e);
    }
}

window.scrollPosition = 0;
function lockScroll() {
    scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollPosition}px`;
    document.body.style.width = '100%';
}

function unlockScroll() {
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('position');
    document.body.style.removeProperty('top');
    document.body.style.removeProperty('width');
    window.scrollTo(0, scrollPosition);
}

function safeParseJSON(jsonString) {
    try {
        if (isBlank(jsonString))
            return null;

        return JSON.parse(jsonString);
    } catch (e) {
        logError(ERROR_TYPE.GENERIC, 'Failed to parse JSON string.', e);
        return null;
    }
}

function getCookie(cookieName) {
    if (isBlank(cookieName))
        return null;

    const name = cookieName + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookieArray = decodedCookie.split(';');
    for (let i = 0; i < cookieArray.length; i++) {
        let cookie = cookieArray[i];
        while (cookie.charAt(0) === ' ') {
            cookie = cookie.substring(1);
        }
        if (cookie.indexOf(name) === 0) {
            return cookie.substring(name.length, cookie.length);
        }
    }
    return "";
}

function setCookie(cookieName, cookieValue, expirationDays) {
    if (isBlank(cookieName) || isBlank(cookieValue))
        return;

    const d = new Date();
    d.setTime(d.getTime() + (expirationDays * 24 * 60 * 60 * 1000));
    const expires = `expires=${d.toUTCString()}`;
    const domain = window.location.hostname.split('.').slice(1).join('.');
    document.cookie = `${cookieName}=${cookieValue};${expires};path=/;domain=.${domain};`;
}

function generateUUID() {
    try {
        if (isDefined(crypto) && typeof crypto.randomUUID === "function") {
            return crypto.randomUUID();
        }

        return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
            (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
        );
    } catch (e) {
        logError(ERROR_TYPE.GENERIC, 'Failed to generate UUID.', e);
        return null;
    }
}

/**
 * Function stolen from Responsive.Web. Never modify this before verifying 
 * what it looks like on the other side.
 */
function getViewPortSize() {
    var width = window.innerWidth;
    if (width < 576)
        return "XS-P";
    if (width < 768)
        return "XS-L";
    if (width < 992)
        return "S";
    if (width < 1200)
        return "M";
    return "L";
}

/**
 * Saves a coookie only accessible under Storefront which will be 
 * deleted at the end of the user session.
 */
function setStorefrontSessionCookie(cookieName, cookieValue) {
    if (isBlank(cookieName) || isBlank(cookieValue))
        return;

    document.cookie = `${cookieName}=${cookieValue}; path=/; secure; samesite=strict`;
}

/*********************************
 * Section: Functional Utils
 ********************************/

/**
 * Formats the phone number to (###) ###-#### regardless of there being a country code (11 digits)
 * 
 * @param {*} phoneNumber 
 * @returns 
 */
function formatPhoneNumber(phoneNumber) {
    if (typeof phoneNumber !== "string" || phoneNumber.trim().length === 0) {
        return "";
    }

    return phoneNumber
        .replace(/\D/g, '')
        .replace(/(\d{1})?(\d{3})(\d{3})(\d{4})/, function (_, p1, p2, p3, p4) {
            return `(${p2}) ${p3}-${p4}`
        });
}

/**
 * Checks if there is a modelYear metadata tag in the page. If there is, it takes precedence. (This is used in model pages)
 * 
 * Otherwise, it checks for a year metadata tag in the page. There should always be a year meta tag, but just in case
 * we use current year minus 1 as fallback.
 * 
 * @returns resolved year
 */
function resolveMinYear() {
    const modelYearMeta = document.querySelector('meta[name="modelYear"]');
    if (modelYearMeta && modelYearMeta.content) {
        return modelYearMeta.content;
    }

    const yearMeta = document.querySelector('meta[name="year"]');
    if (yearMeta && yearMeta.content) {
        return yearMeta.content;
    }

    return (new Date().getFullYear() - 1).toString();
}

/**
 * This is a temporary patch to ensure we scope to min/max year on model pages, which
 * are the only pages with a modelYear meta tag. What we'd like to do is eventually add an
 * optional max year meta tag to the page, and use that as the max year.
 * 
 * @returns resolved max year
 */
function resolveMaxYear() {
    const modelYearMeta = document.querySelector('meta[name="modelYear"]');
    return (modelYearMeta && modelYearMeta.content)
        ? modelYearMeta.content
        : null;
}

/*********************************
 * Section: User Location - Init
 ********************************/
window.userPostalCode = null;
window.userLocationInfo = null;

function setUserLocationInfo() {
    try {
        const searchLocationCookie = getCookie("srchLocation");
        const locationInfo = safeParseJSON(searchLocationCookie);
        if (isDefined(locationInfo))
            window.userLocationInfo = locationInfo;
    } catch (e) {
        logError(ERROR_TYPE.GENERIC, 'Failed to set user location info.', e);
    }
}
try {
    const postalCodeCookie = getCookie("pCode");
    if (!isBlank(postalCodeCookie))
        window.userPostalCode = postalCodeCookie;
    setUserLocationInfo();
} catch (e) {
    logError(ERROR_TYPE.GENERIC, 'Failed to initialize user postal code.', e);
}

/*********************************
 * Section: Lead Form - Constants
 ********************************/
window.LeadFormSourceTypes = {
    INTERNAL: {
        key: "INTERNAL",
        analytics: {
            elementName: "contact dealer",
            // Maybe manufacturer is not defined in some cases.
            location: !isBlank(window.manufacturer) ? `new ${safeLower(window.manufacturer)} vehicles near you` : null
        },
        topicId: window.isMobileDevice() ? 107079 : 107078
    },
    LD_BEST_MATCH_LEAD: {
        key: "LD_BEST_MATCH_LEAD",
        analytics: {
            elementName: "contact dealer",
            location: "best_match"
        },
        topicId: window.isMobileDevice() ? 107089 : 107088
    },
    LD_CLOSE_MATCH_LEAD: {
        key: "LD_CLOSE_MATCH_LEAD",
        analytics: {
            elementName: "contact dealer",
            location: "close_match"
        },
        topicId: window.isMobileDevice() ? 107094 : 107093
    },
    LD_REQUEST_QUOTE_LEAD: {
        key: "LD_REQUEST_QUOTE_LEAD",
        analytics: {
            elementName: "get a quote",
            location: "pivot_widget",
            leadKey: "storefront - get a quote"
        },
        topicId: window.isMobileDevice() ? 107099 : 107098
    },
    PIVOT_SPEC_DETAILS: {
        key: "PIVOT_SPEC_DETAILS",
        analytics: {
            elementName: "print spec sheet",
            location: "pivot_widget",
            leadKey: "storefront - pivot print specs"
        },
        topicId: window.isMobileDevice() ? 107128 : 107127
    },
    OFFERS_CHECK_AVAILABILITY: {
        key: "OFFERS_CHECK_AVAILABILITY",
        analytics: {
            elementName: "check availability",
            location: "offers",
            leadKey: "storefront - check avail offers"
        },
        topicId: window.isMobileDevice() ? 107130 : 107129
    }
};

window.LD_WIDGET_DOMAIN = "customer-autotrader-pivot.m.londondynamics.com";

/*********************************
 * Section: Lead Form - Functional
 ********************************/
function getLeadForm() {
    return document.getElementById('leadForm');
}

function toggleLeadFormModalView(display) {
    try {
        var leadFormModalContainer = getLeadForm();
        if (!isDefined(leadFormModalContainer)) {
            logError(ERROR_TYPE.LEAD, 'Cannot find lead form modal to toggle visibility.');
            return;
        }

        if (display) {
            leadFormModalContainer.style.display = "flex";
            leadFormModalContainer.style.opacity = 1;
            lockScroll();
        } else {
            leadFormModalContainer.style.display = "none";
            leadFormModalContainer.style.opacity = 0;
            unlockScroll();
        }

    } catch (e) {
        logError(ERROR_TYPE.LEAD, 'Error while trying to toggle lead form modal visibility.', e);
    }
}

/**
 * For when there is no actual vehicle, but possible some vehicle specific info.
 * VehicleContext {
 *  make: string;
 *  model: string;
 *  year: string;
 *  trim: string;
 *  exteriorColor: string;
 *  analytics: {
 *      source: string;
 *  }
 * }
 */
window.vehicleContext = null;
function extractVehicleContext(data) {
    if (!isDefined(data))
        return null;

    return {
        analytics: {
            source: "pivot_spec_details"
        },
        make: data.make,
        model: data.model,
        year: data.year,
        trim: data.trim,
        exteriorColor: data.exteriorColor
    };
}

function extractPivotContext(pivotData) {
    if (!isDefined(pivotData))
        return null;

    const selection = pivotData.selection;
    if (!isDefined(selection)) {
        logError(ERROR_TYPE.REQUEST_QUOTE, "Selection is undefined in payload.");
        return null;
    }
    
    const vehicleContext = {
        make: pivotData.make ?? window.manufacturer,
        model: pivotData.model ?? window.modelOverride,
        year: pivotData.year ?? resolveMinYear()
    };

    const trim = selection.trim ?? selection.feat_trim;
    if (!isBlank(trim)) {
        vehicleContext.trim = trim;
    } else {
        logError(ERROR_TYPE.REQUEST_QUOTE, "Trim is blank in payload.");
    }

    const rawExteriorColor = selection.oemExteriorColor;
    if (!isBlank(rawExteriorColor)) {
        const selectionLabels = pivotData.selectionLabels;
        if (isDefined(selectionLabels)) {
            vehicleContext.exteriorColor = selectionLabels[rawExteriorColor];
        } else {
            logError(ERROR_TYPE.REQUEST_QUOTE, "selectionLabels is not defined in payload.");
        }
    } else {
        logError(ERROR_TYPE.REQUEST_QUOTE, "Exterior color is blank in payload.");
    }

    return vehicleContext;
}

function customLeadForm(source, make, model, year, trim, exteriorColor) {
    const sourceType = LeadFormSourceTypes[source];
    if (sourceType == null) {
        logError(ERROR_TYPE.LEAD, `Invalid lead form source type: ${source}`);
        return;
    }

    window.vehicleContext = {
        make: make,
        model: model,
        year: year,
        trim: trim,
        exteriorColor: exteriorColor
    };
    openLeadFormModal(null, sourceType);
}

// Event handler added for London Dynamic so they can open lead form modal from their iFrame.
window.addEventListener("message", function (event) {
    if (!isDefined(event.data)) {
        return;
    }

    const source = event.data.type;
    if (typeof source !== "string")
        return;

    const sourceType = LeadFormSourceTypes[source];
    if (!isDefined(sourceType))
        return;

    if (sourceType.key === LeadFormSourceTypes.LD_REQUEST_QUOTE_LEAD.key) {
        window.vehicleContext = extractPivotContext(event.data);
        if (!isDefined(window.vehicleContext))
            return;
    } else if (sourceType.key === LeadFormSourceTypes.PIVOT_SPEC_DETAILS.key) {
        window.vehicleContext = extractVehicleContext(event.data);
        if (!isDefined(window.vehicleContext))
            return;
    }


    const vehicle = event.data.vehicle;
    const index = event.data.index;

    const vehicleInfo = tryExtractVehicleInfo(vehicle, index);
    openLeadFormModal(vehicleInfo, sourceType);
});

function fillRequestQuoteDealerInfo() {
    if (!isDefined(window.nearestDealer))
        return;

    const dealerNameContainer = getLeadFormDealerNameContainer();
    if (!isDefined(dealerNameContainer))
        return;

    const dealerLabel = `${window.nearestDealer.name} - (${window.nearestDealer.city})`;
    dealerNameContainer.innerHTML = dealerLabel;
}

const STRING_FORMAT_PLACEHOLDER = "{PLACEHOLDER}";
const REQUEST_QUOTE_MESSAGE_FORMAT = window.isFrench
    ? `Bonjour, je suis Ã  la recherche dâ€™une ${STRING_FORMAT_PLACEHOLDER}. Pourriez-vous me contacter Ã  se sujet, merci.`
    : `Hi, Iâ€™m interested in buying a ${STRING_FORMAT_PLACEHOLDER}. Please contact me when possible, thank you.`;

/**
 * Initialize lead form for non-vehicle specific leads (request quote, print spec, etc.)
 * @param {Object} options - Configuration options
 * @param {boolean} options.hidePhoneField - Whether to hide the phone input field
 * @param {string} options.messageTemplate - Custom message template (optional)
 */
function initRequestQuoteMode(options = {}) {
    const { hidePhoneField = false, messageTemplate = null } = options;

    const postalCodeInputContainer = getLeadFormPostalCodeInputContainer();
    const isNearestDealerResolved = isDefined(window.nearestDealer);
    // If we already have a nearby dealer, then hide the postal code input.
    postalCodeInputContainer.style.display = isNearestDealerResolved ? 'none' : '';

    if (isNearestDealerResolved) {
        // Setting this so that form validation goes through without checking postal code.
        window.validatedPostalCode = window.userPostalCode;
    }

    fillRequestQuoteDealerInfo();

    // Show or hide phone input based on options
    const phoneInput = getLeadFormPhoneInput();
    if (isDefined(phoneInput)) {
        const phoneFormGroup = phoneInput.closest('.form-group');
        if (isDefined(phoneFormGroup)) {
            phoneFormGroup.style.display = hidePhoneField ? 'none' : '';
        }
    }

    const make = window.vehicleContext.make;
    const model = window.vehicleContext.model;
    const year = (window.vehicleContext.year ?? "").toString();
    const trim = window.vehicleContext.trim;
    const exteriorColor = window.vehicleContext.exteriorColor;

    let message;
    if (messageTemplate) {
        // Use custom message template
        message = messageTemplate
            .replace('{make}', make || '')
            .replace('{model}', model || '')
            .replace('{year}', year || '')
            .replace('{trim}', trim || '')
            .replace('{exteriorColor}', exteriorColor || '');
    } else {
        const vehicleInfoSegments = window.isFrench
            ? [make, model, trim, year, exteriorColor]
            : [year, exteriorColor, make, model, trim];
        const vehicleInfoString = vehicleInfoSegments.filter(segment => !isBlank(segment)).join(' ');
        message = REQUEST_QUOTE_MESSAGE_FORMAT.replace(STRING_FORMAT_PLACEHOLDER, vehicleInfoString);
    }

    const messageInput = getLeadFormMessageInput();
    messageInput.value = message;
}
window.leadFormSource;
window.isLeadFormOpen = false;
function openLeadFormModal(vehicle, sourceType) {
    try {
        if (!isDefined(getLeadForm())) {
            logError(ERROR_TYPE.LEAD, 'Failed to open lead form. Lead form not found.');
            return;
        }

        window.leadFormSource = sourceType ?? LeadFormSourceTypes.INTERNAL;

        const isVehicleLeadType = isSpecificVehicleLeadType(window.leadFormSource);
        const vehicleId = vehicle?.id;
        if (isVehicleLeadType && isBlank(vehicleId)) {
            window.leadFormSource = null;
            logError(ERROR_TYPE.LEAD, 'Failed to open lead form. Vehicle ID is blank.');
            return;
        }

        if (!isVehicleLeadType && !isDefined(window.vehicleContext)) {
            window.leadFormSource = null;
            logError(ERROR_TYPE.LEAD, 'Failed to open lead form for nonspecific vehicle case: vehicle context is empty.');
            return;
        }

        window.isLeadFormOpen = true;

        window.currentLeadVehicle = vehicle;

        const dealerNameSection = getLeadFormDealerNameContainer();
        if (isDefined(dealerNameSection)) {
            dealerNameSection.innerHTML = vehicle?.dealerName ?? "";
        }

        /**
         * When there is no specific vehicle involved in the lead, we likely at least have 
         * metadata related to a vehicle like make/model/year/trim/color.
         * 
         * Because of that, the form will be initialized in request quote mode where some
         * inputs are different and behavior/lead type handling differs.
         */
        if (!isVehicleLeadType) {
            if (window.leadFormSource.key === LeadFormSourceTypes.PIVOT_SPEC_DETAILS.key) {
                // Print Spec form: hide phone field and use custom message
                const printSpecMessageTemplate = window.isFrench
                    ? "Bonjour, j'ai tÃ©lÃ©chargÃ© ma fiche technique {year} {exteriorColor} {model} {trim} et je confirme que mes coordonnÃ©es vous ont Ã©tÃ© envoyÃ©es."
                    : "Hi, I've downloaded my {year} {exteriorColor} {model} {trim} Build Sheet and acknowledge that my contact details have been sent to you.";
                initRequestQuoteMode({ hidePhoneField: true, messageTemplate: printSpecMessageTemplate });
            } else {
                // Regular request quote form: show phone field and use default message
                initRequestQuoteMode();
            }
        }

        toggleLeadFormModalView(true);

        const analyticsInfo = window.leadFormSource.analytics;
        const event = {
            "event": "select_element",
            "element_type": "button",
            "element_name": analyticsInfo.elementName,
            "location": analyticsInfo.location ?? `new ${safeLower(window.manufacturer)} vehicles near you`,
        };

        tryLogEvent(event);
    } catch (e) {
        logError(ERROR_TYPE.LEAD, 'Error while trying to open lead form.', e);
    }
}

function clearLeadFormModal() {
    getLeadFormSuccessMessageContainer().style.display = '';
    getLeadFormErrorMessageContainer().style.display = '';
    getLeadFormModalForm().style.display = '';
    getLeadFormMessageInput().value = window.leadFormDefaultMessage || '';
    getLeadFormDealerNameContainer().innerHTML = '';
    getLeadFormPostalCodeInputContainer().style.display = 'none';

    // Reset phone input visibility
    const phoneInput = getLeadFormPhoneInput();
    if (isDefined(phoneInput)) {
        const phoneFormGroup = phoneInput.closest('.form-group');
        if (isDefined(phoneFormGroup)) {
            phoneFormGroup.style.display = '';
        }
    }

    // TODO: Price alerts
    // const priceAlertInput = getLeadFormPriceAlertInput();
    // if (isDefined(priceAlertInput) && priceAlertInput.checked) {
    //     priceAlertInput.click();
    // }
}

function closeLeadFormModal() {
    if (!window.isLeadFormOpen)
        return;

    try {
        window.isLeadFormOpen = false;
        window.leadFormSource = null;
        window.vehicleContext = null;
        // Ensuring load state is removed just in case.
        setSalesLeadFormLoadingState(false);
        // Closing modal
        toggleLeadFormModalView(false);
        // clearing form states
        clearLeadFormModal();
    } catch (e) {
        logError(ERROR_TYPE.LEAD, 'Error while trying to close lead form.', e);
    }
}
/**
 * Returns the lead form modal's name input.
 */
function getLeadFormNameInput() {
    const leadForm = getLeadForm();
    return isDefined(leadForm) ? leadForm.querySelector('[id="leadFormNameInput"]') : null;
}
/**
 * Returns the lead form modal's email input.
 */
function getLeadFormEmailInput() {
    const leadForm = getLeadForm();
    return isDefined(leadForm) ? leadForm.querySelector('[id="leadFormEmailInput"]') : null;
}
/**
 * Returns the lead form modal's phone input.
 */
function getLeadFormPhoneInput() {
    const leadForm = getLeadForm();
    return isDefined(leadForm) ? leadForm.querySelector('[id="leadFormPhoneInput"]') : null;
}
/**
 * Returns the lead form modal's price alert checkbox.
 */
function getLeadFormPriceAlertInputContainer() {
    const leadForm = getLeadForm();
    return isDefined(leadForm) ? leadForm.querySelector('[id="leadFormPriceAlertInputContainer"]') : null;
}
/**
 * Returns the lead form modal's price alert checkbox.
 */
function getLeadFormPriceAlertInput() {
    const leadForm = getLeadForm();
    return isDefined(leadForm) ? leadForm.querySelector('[id="leadFormPriceAlertInput"]') : null;
}
/**
 * Returns the lead form modal's postal code input.
 */
function getLeadFormPostalCodeInput() {
    const leadForm = getLeadForm();
    return isDefined(leadForm) ? leadForm.querySelector('[id="leadFormPostalCodeInput"]') : null;
}
/**
 * Returns the lead form modal's postal code input container.
 */
function getLeadFormPostalCodeInputContainer() {
    const leadForm = getLeadForm();
    return isDefined(leadForm) ? leadForm.querySelector('[id="leadFormPostalCodeWrapper"]') : null;
}
/**
 * Returns the lead form modal's message input.
 */
function getLeadFormMessageInput() {
    const leadForm = getLeadForm();
    return isDefined(leadForm) ? leadForm.querySelector('[id="leadFormMessageInput"]') : null;
}
/**
 * Returns the lead form modal's dealer name container.
 */
function getLeadFormDealerNameContainer() {
    const leadForm = getLeadForm();
    return isDefined(leadForm) ? leadForm.querySelector('[id="leadFormDealerNameSection"]') : null;
}
/**
 * Returns the Form HTML element of the lead form modal.
 */
function getLeadFormModalForm() {
    const leadForm = getLeadForm();
    return isDefined(leadForm) ? leadForm.querySelector('[id="leadFormInternalContent"]') : null;
}
/**
 * Returns the lead form modal's success message container.
 */
function getLeadFormSuccessMessageContainer() {
    const leadForm = getLeadForm();
    return isDefined(leadForm) ? leadForm.querySelector('[id="leadFormSuccessMessage"]') : null;
}
/**
 * Returns the lead form modal's error message container.
 */
function getLeadFormErrorMessageContainer() {
    const leadForm = getLeadForm();
    return isDefined(leadForm) ? leadForm.querySelector('[id="leadFormErrorMessage"]') : null;
}
/**
 * Returns the lead form modal's submit button.
 */
function getLeadFormSubmitButton() {
    const leadForm = getLeadForm();
    return isDefined(leadForm) ? leadForm.querySelector('[id="leadFormSubmitButton"]') : null;
}
/**
 * Returns the lead form modal's loading state container.
 */
function getLeadFormLoaderContainer() {
    const leadForm = getLeadForm();
    return isDefined(leadForm) ? leadForm.querySelector('[id="leadFormLoader"]') : null;
}

function prefillLeadForm(name, email, phone) {
    const nameInput = getLeadFormNameInput();
    if (isDefined(nameInput)) {
        nameInput.value = name;
    } else {
        logError(ERROR_TYPE.LEAD, 'Failed to prefill lead form. Name input not found.');
    }

    const emailInput = getLeadFormEmailInput();
    if (isDefined(emailInput)) {
        emailInput.value = email;
    } else {
        logError(ERROR_TYPE.LEAD, 'Failed to prefill lead form. Email input not found.');
    }

    if (!isBlank(phone)) {
        const phoneInput = getLeadFormPhoneInput();
        if (isDefined(phoneInput)) {
            phoneInput.value = phone;
        } else {
            logError(ERROR_TYPE.LEAD, 'Failed to prefill lead form. Phone input not found.');
        }
    }
}

/*********************************
 * Section: User Information
 ********************************/
/**
 * Here is what the user INFO from the API looks like at the time of writing this (2024/11/13): 
 *  public interface IGetCatUserProfileResponse
    {
        string CatID { get; set; }
        string FirstName { get; set; }
        string LastName { get; set; }
        string Email { get; set; }
        string PostalCode { get; set; }
        string Mobile { get; set; }
    }
    Now the user reengagement info is stored in local storage as a stringified object with the following structure:
    {
        name: string, 
        email: string,
        phone: string | null | undefined,
        milUixTimestamp: number
    }
*/
function getReEngagementUser() {
    try {
        const reEngagementData = localStorage.getItem('reuObject');
        if (!isDefined(reEngagementData))
            return null;

        return safeParseJSON(reEngagementData);
    } catch (e) {
        logError(ERROR_TYPE.USER_INFO, 'Failed to get re-engagement user from local storage.', e);
        return null;
    }
}

function setReEngagementUser(name, email, phone) {
    try {
        const reEngagementUser = {
            name: name || '',
            email: email || '',
            phone: phone || '',
            milUixTimestamp: Date.now()
        };

        localStorage.setItem('reuObject', JSON.stringify(reEngagementUser));
    } catch (e) {
        logError(ERROR_TYPE.USER_INFO, 'Failed to set and save re-engagement user.', e);
    }
}

function setUserInfo(name, email, phone, catId, loggedIn = false) {
    try {
        if (isBlank(name) || isBlank(email))
            return;

        const userInfo = {
            name: name,
            email: email,
            phone: phone,
            catId: catId,
            loggedIn: loggedIn
        };

        window.storefrontUserInfo = userInfo;
        setStorefrontSessionCookie(window.STOREFRONT_USER_INFO_COOKIE_NAME, JSON.stringify(userInfo));
    } catch (e) {
        logError(ERROR_TYPE.USER_INFO, 'Failed to set and save user info.', e);
    }
}


window.isLeadFormLoading = false;
function setSalesLeadFormLoadingState(loading) {
    if (window.isLeadFormLoading === loading) {
        return;
    }

    const leadForm = getLeadForm();
    if (!isDefined(leadForm)) {
        logError(ERROR_TYPE.LEAD, 'Failed to set lead form loading state. Lead form not found.');
        return;
    }

    window.isLeadFormLoading = loading;

    const loader = getLeadFormLoaderContainer();
    if (loading) {
        if (isDefined(loader)) {
            loader.style.display = 'flex';
        } else {
            logError(ERROR_TYPE.LEAD, 'Failed to display lead form loader. Loader not found.');
        }

        getLeadFormSubmitButton().disabled = true;
    } else {
        if (isDefined(loader)) {
            loader.style.display = 'none';
        } else {
            logError(ERROR_TYPE.LEAD, 'Failed to hide lead form loader. Loader not found.');
        }

        getLeadFormSubmitButton().disabled = false;
    }
}

function calculateConversionValue(name, email, phone) {
    const nameValue = !isBlank(name) ? 8 : 0;
    const emailValue = !isBlank(email) ? 20 : 0;
    const phoneValue = !isBlank(phone) ? 9 : 0;

    return nameValue + emailValue + phoneValue;
}

function isSpecificVehicleLeadType(leadSource) {
    return [
        LeadFormSourceTypes.INTERNAL,
        LeadFormSourceTypes.LD_BEST_MATCH_LEAD,
        LeadFormSourceTypes.LD_CLOSE_MATCH_LEAD
    ].some(type => leadSource.key === type.key);
}

function postLeadSubmissionHandler(success, conversionValue) {
    setSalesLeadFormLoadingState(false);
    if (success) {
        // Swaps from form to success message.
        getLeadFormModalForm().style.display = 'none';
        getLeadFormSuccessMessageContainer().style.display = 'block';

        const event = {
            'event': 'hard_lead_ad_general_inquiry',
            'leadMetric': 'hard_lead_ad_general_inquiry'
        }

        if (isDefined(conversionValue) && conversionValue > 0) {
            event.conversion_value = conversionValue.toString();
        }

        // Log GA event for hard lead
        const vehicle = window.currentLeadVehicle;
        if (isDefined(vehicle)) {
            event.items = [{
                'item_id': vehicle.id,
                'item_name': `${vehicle.make} | ${vehicle.model}`,
                'price': vehicle.price,
                'item_brand': vehicle.dealerId,
                'item_category': 'not used',
                'quantity': 1,
                'ad_id': vehicle.id,
                'ad_make': vehicle.make,
                'ad_model': vehicle.model,
                'ad_province': vehicle.province,
                'ad_year': vehicle.year,
                'ad_dealer_id': vehicle.dealerId,
                'ad_position': 'organic',
                'ad_active_upsells': 'organic',
                'ad_upgrades_applied': 'not used',
            }];
            event.vehicle = {
                'adID': vehicle.id,
                'upgradesApplied': 'not used',
                'dealerID': vehicle.dealerId,
                'listingPosition': 'organic',
                'make': vehicle.make,
                'model': vehicle.model,
                'price': vehicle.price,
                'province': vehicle.province,
                'year': vehicle.year
            }
        }

        if (isDefined(window.vehicleContext)) {
            const province = isDefined(window.userLocationInfo) && isDefined(window.userLocationInfo.Location)
                ? (window.userLocationInfo.Location.Province ?? "").toLowerCase()
                : "";
            
            const leadTrackingKey = window.leadFormSource.analytics.leadKey ?? 'storefront - lead';
            event.items = [{
                'item_id': leadTrackingKey,
                'item_name': leadTrackingKey,
                'item_category': 'not used',
                'ad_make': (window.vehicleContext.make ?? "").toLowerCase(),
                'ad_model': (window.vehicleContext.model ?? "").toLowerCase(),
                'ad_province': province,
                'ad_year': (window.vehicleContext.year ?? "").toString(),
                'ad_position': 'organic',
                'ad_active_upsells': 'organic',
                'ad_upgrades_applied': 'not used'
            }];
        }

        tryLogEvent(event);

        //TODO: Price Alerts : soft lead in GA
        // tryLogEvent({
        //     'event': 'soft_lead_ad_general_inquiry',
        //     'leadMetric': 'soft_lead_ad_general_inquiry',
        //     'items': [{
        //         'item_id': vehicle.id,
        //         'item_name': `${vehicle.make} | ${vehicle.model}`,
        //         'price': vehicle.price,
        //         'item_brand': vehicle.dealerId,
        //         'item_category': 'not used',
        //         'quantity': 1,
        //         'ad_id': vehicle.id,
        //         'ad_make': vehicle.make,
        //         'ad_model': vehicle.model,
        //         'ad_province': vehicle.province,
        //         'ad_year': vehicle.year,
        //         'ad_dealer_id': vehicle.dealerId,
        //         'ad_position': 'organic',
        //         'ad_active_upsells': 'organic',
        //         'ad_upgrades_applied': 'not used',
        //     }],
        //     'vehicle': {
        //         'adID': vehicle.id,
        //         'upgradesApplied': 'not used',
        //         'dealerID': vehicle.dealerId,
        //         'listingPosition': 'organic',
        //         'make': vehicle.make,
        //         'model': vehicle.model,
        //         'price': vehicle.price,
        //         'province': vehicle.province,
        //         'year': vehicle.year
        //     }
        // });
    } else {
        getLeadFormErrorMessageContainer().style.display = 'block';
    }
}

function tryExtractVehicleInfo(vehicle, index) {
    try {
        if (!isDefined(vehicle))
            return null;

        const vehicleInfo = {};
        vehicleInfo.id = safeLower(vehicle['trackingId']);
        vehicleInfo.year = safeLower(vehicle['year']);
        vehicleInfo.make = safeLower(vehicle['make']);
        vehicleInfo.model = safeLower(vehicle['model']);
        vehicleInfo.province = safeLower(vehicle['province']);
        vehicleInfo.index = safeLower(isDefined(index) ? index.toString() : "-1");

        const rawPrice = vehicle['price'];
        vehicleInfo.price = safeLower(isDefined(rawPrice) ? rawPrice.toString() : "");

        const dealer = vehicle['dealer'];
        vehicleInfo.dealerId = safeLower(isDefined(dealer) ? dealer['trackingId'] : "");
        // Do not lowercase this one. It's used for UI purposes rather than tracking, unlike the others.
        vehicleInfo.dealerName = isDefined(dealer) ? dealer['name'] : "";

        return vehicleInfo;
    } catch (e) {
        logError(ERROR_TYPE.LEAD, 'Failed to extract tracking vehicle info.', e);
        return null;
    }
}

function sendLead(name, email, phone, message, retry = true, timeout = 6000) {
    const isVehicleLeadType = isSpecificVehicleLeadType(window.leadFormSource);

    const errorType = isVehicleLeadType
        ? ERROR_TYPE.LEAD
        : ERROR_TYPE.REQUEST_QUOTE;
    try {
        getLeadFormErrorMessageContainer().style.display = '';
        setSalesLeadFormLoadingState(true);
        setReEngagementUser(name, email, phone);

        let payload;
        if (isVehicleLeadType) {
            leadUrl = window.apiConfigs.salesLeadUrl;
            payload = {
                "topicId": window.leadFormSource.topicId,
                "shouldKeepTopicId": true,
                "adId": window.currentLeadVehicle.id.replace("-", "_"),
                "name": name,
                "emailAddress": email,
                "phone": phone,
                "message": message,
                "url": window.location.href,
                "viewPort": getViewPortSize(),
                "autoMatchOptIn": false,
            };
        } else {
            if (!isDefined(window.nearestDealer)) {
                logError(errorType, 'Trying to send request quote lead without a dealer.');
                postLeadSubmissionHandler(false);
                return;
            }

            leadUrl = window.apiConfigs.getQuoteUrl;
            payload = {
                "CompanyId": window.nearestDealer.id,
                "TopicId": window.leadFormSource.topicId,
                "ShouldKeepTopicId": true,
                "FromName": name,
                "FromEmail": email,
                "FromPhone": phone,
                "Subject": "general",
                "Message": message,
                "SendCopy": true,
                "IsMobile": window.isMobileDevice(),
                "VehicleInfo": {
                    "Make": window.vehicleContext.make,
                    "Model": window.vehicleContext.model,
                    "Year": window.vehicleContext.year,
                    "Trim": window.vehicleContext.trim,
                    "Status": "1" // Status 1 means NEW vehicle
                },
            };
        }

        if (!isBlank(window.hijackLeadUrl)) {
            leadUrl = window.hijackLeadUrl;
        }

        const controller = new AbortController();
        var tweakedTimeout = isQA && params.get('forceTimeout')
            ? 100
            : timeout;
        var timeoutId = setTimeout(() => controller.abort(), tweakedTimeout);

        fetch(leadUrl, {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
                "Accept": "application/json, text/plain, */*"
            },
            signal: controller.signal,
            body: JSON.stringify(payload)
        }).then(response => {
            clearTimeout(timeoutId);
            if (!response.ok) {
                logError(errorType, 'Failed to send lead. Response: ' + JSON.stringify(response));
                postLeadSubmissionHandler(false);
                return;
            }

            postLeadSubmissionHandler(true, calculateConversionValue(name, email, phone));
        }).catch(error => {
            clearTimeout(timeoutId);
            let unlockEverything = true;
            const isTimeoutError = error.name === 'AbortError';
            if (retry) {
                // Since we're retrying, we want to keep the loading state and not let the user know it failed.
                unlockEverything = false;
                sendLead(name, email, phone, message, false, isTimeoutError ? timeout * 2 : timeout);
            } else {
                if (isTimeoutError) {
                    logError(errorType, `Request timed out twice with ${tweakedTimeout} timeout for its retry.`, error);
                } else {
                    logError(errorType, 'Failed to send lead on form submission.', error);
                }
            }

            if (unlockEverything) {
                postLeadSubmissionHandler(false);
            }
        });
    } catch (e) {
        logError(errorType, 'Failed to send lead.', e);
        setSalesLeadFormLoadingState(false);
        getLeadFormErrorMessageContainer().style.display = 'block';
    }
}

window.enableCheckAvailFeature = false;
function initCheckAvailFeature() {
    try {
        // check all HTML elemnts with attribte data-feature-action="checkAvailability"
        const checkAvailElements = document.querySelectorAll('[data-feature-action="checkAvailability"]');
        if (!isDefined(checkAvailElements) || checkAvailElements.length === 0) {
            window.enableCheckAvailFeature = false;
            return;
        }
        
        const validElements = Array.from(checkAvailElements).map(element => {
            const featureSource = element.getAttribute('data-feature-section');
            const featureMake = element.getAttribute('data-vehicle-make');
            const featureModel = element.getAttribute('data-vehicle-model');
            const featureYear = element.getAttribute('data-vehicle-year');
            if (isBlank(featureSource) || isBlank(featureMake) || isBlank(featureModel) || isBlank(featureYear)) {
                // hide the element as it's invalid.
                element.style.display = 'none';
                return;
            }

            // add onclick event to call function openCheckAvailLeadForm
            element.onclick = function (event) {
                event.preventDefault();
                event.stopPropagation();
                window.vehicleContext = {
                    make: featureMake,
                    model: featureModel,
                    year: featureYear,
                    analytics: {
                        source: featureSource
                    }
                };
                openLeadFormModal(null, LeadFormSourceTypes.OFFERS_CHECK_AVAILABILITY);
            }

            return element;
        }).filter(element => isDefined(element));
        
        window.enableCheckAvailFeature = validElements.length > 0;
    } catch (e) {
        logError(ERROR_TYPE.GENERIC, 'Failed to initialize check availability feature flag.', e);
    }
}

initCheckAvailFeature();

function isCheckAvailFeatureEnabled() {
    return window.enableCheckAvailFeature;
}

function isPivotWidgetEnabled() {
    // New widget detection
    const pivotWidgetElements = document.querySelectorAll('[data-component-name="pivotWidget"]');
    if (isDefined(pivotWidgetElements) && (pivotWidgetElements.length ?? 0) > 0) {
        return true;
    }

    // Old widget detection - from LD iframe impleementation
    const iframes = document.querySelectorAll('iframe[data-src]');
    if (!isDefined(iframes) || (iframes.length ?? 0) === 0)
        return false;

    for (let i = 0; i < iframes.length; i++) {
        if (iframes[i].getAttribute('data-src').indexOf(window.LD_WIDGET_DOMAIN) !== -1) {
            return true;
        }
    }
}

async function loadNearestDealer(postalCode) {
    try {
        if (!isBlank(postalCode) && isBlank(getCookie("pCode"))) {
            // This means the postal code was validated and there isn't a cookie. We should set it.
            setCookie("pCode", postalCode, 365);
        }

        const data = await fetchDealersInfo(postalCode);
        if (isDefined(data) && isNotEmptyArray(data.companies)) {
            window.nearestDealer = data.companies[0];
            fillRequestQuoteDealerInfo();
        } else {
            logError(ERROR_TYPE.REQUEST_QUOTE_LOCATION, 'Failed to load nearest dealer.');
        }
    } catch (e) {
        logError(ERROR_TYPE.REQUEST_QUOTE_LOCATION, 'Failed to load nearest dealer and set info.', e);
    }

    window.postalCodeServerValidationOn = false;
}

async function validatePostalCode(postalCode) {
    try {
        window.postalCodeServerValidationOn = true;
        const response = await fetch(window.apiConfigs.validatePostalCodeUrl, {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
                "Accept": "application/json, text/javascript, */*"
            },
            body: JSON.stringify({
                Address: postalCode,
                InMarketType: "basicSearch",
                // This seems to be required so the server doesn't trip on itself while validating a postal code. Applies for the 3 below....
                Proximity: -1,
                IsNew: true,
                HasDigitalRetail: false
            })
        });

        if (!response.ok) {
            logError(ERROR_TYPE.REQUEST_QUOTE_LOCATION, 'Failed to validate postal code. Response: ' + JSON.stringify(response));
            return false;
        }

        const data = await response.json();
        const locationJson = isDefined(data) ? data.LocationJson : '';
        const postalCodeIsValid = isDefined(data) ? (data.LocationIsValid ?? false) : false;
        if (postalCodeIsValid && !isBlank(locationJson)) {
            setCookie("srchLocation", encodeURIComponent(locationJson), 365);
            setUserLocationInfo();
        }

        return postalCodeIsValid;
    } catch (e) {
        logError(ERROR_TYPE.REQUEST_QUOTE_LOCATION, 'Failed to validate postal code.', e);
        return false;
    }
}

/**
 * Contains the postal code that was last validated. Does not mean it is valid.
 */
window.validatedPostalCode;
/**
 * If true, it means an API call is trying to validate the postal code and get a dealer if valid.
 */
window.postalCodeServerValidationOn = false;
async function isValidPostalCode(postalCode) {
    while (postalCodeServerValidationOn) {
        await sleep(50);
    }

    postalCode = (postalCode ?? "").trim().replaceAll(" ", "");

    if (!isBlank(postalCode) && window.validatedPostalCode === postalCode) {
        return false;
    }

    window.validatedPostalCode = postalCode;
    window.nearestDealer = null;
    if (!isValidPostalCodeFormat(postalCode)) {
        return false;
    }

    const isValid = await validatePostalCode(postalCode);

    if (!isValid) {
        window.postalCodeServerValidationOn = false;
    }
    return isValid;
}

async function onPostalCodeChangeHandler(_event) {
    cleanupPostalCodeInput();
    const postalCodeInput = getLeadFormPostalCodeInput();
    const postalCode = postalCodeInput.value;

    if (window.validatedPostalCode === postalCode)
        return;

    // This willbe true when the user has focused away and thinks they're done.
    const isUserDone = _event.type === "change";

    // The length check is to avoid spamming checks. Only if the user is still focused on the input.
    const isValidLength = (postalCode ?? "").length === 6;
    if (!isUserDone && !isValidLength)
        return;

    const isValid = await isValidPostalCode(postalCode);
    if (isValid) {
        loadNearestDealer(postalCode);
    } else {
        setPostalCodeError();
        getLeadFormModalForm().reportValidity();
    }
}

function setPostalCodeError() {
    const input = getLeadFormPostalCodeInput();
    input.setCustomValidity(isFrench ? "Veuillez entrer un code postal valide (ex: M9C 5J1)." : 'Please enter a valid postal code (eg: M9C 5J1).');
}

function cleanupPostalCodeInput() {
    const postalCodeInput = getLeadFormPostalCodeInput();
    postalCodeInput.setCustomValidity('');
    const rawPostalCode = postalCodeInput.value;
    const postalCode = (rawPostalCode ?? "").trim().replaceAll(" ", "");
    postalCodeInput.value = postalCode;
}

async function validateLeadForm() {
    let errorInput = null;

    const isVehicleLeadType = isSpecificVehicleLeadType(window.leadFormSource);
    const isNearbyDealerResolved = isDefined(window.nearestDealer);
    if (!isVehicleLeadType && !isNearbyDealerResolved) {
        cleanupPostalCodeInput();
        const postalCodeInput = getLeadFormPostalCodeInput();
        const postalCode = postalCodeInput.value;
        if (await isValidPostalCode(postalCode)) {
            if (!isDefined(window.nearestDealer)) {
                await loadNearestDealer(postalCode);
                if (!isDefined(window.nearestDealer)) {
                    setPostalCodeError();
                    errorInput = defaultIfUndefined(errorInput, postalCodeInput);
                }
            }
        } else {
            setPostalCodeError();
            errorInput = defaultIfUndefined(errorInput, postalCodeInput);
        }
    }

    const nameInput = getLeadFormNameInput();
    const name = nameInput.value;
    if (isBlank(name)) {
        nameInput.setCustomValidity(isFrench ? "Veuillez entrer votre nom." : 'Please enter your name.');
        errorInput = defaultIfUndefined(errorInput, nameInput);
    }

    const emailInput = getLeadFormEmailInput();
    const email = emailInput.value;
    // check if email is blank or if it's not a valid email format
    if (!isValidEmail(email)) {
        emailInput.setCustomValidity(isFrench ? "Veuillez entrer une adresse courriel valide." : 'Please enter a valid email address.');
        errorInput = defaultIfUndefined(errorInput, emailInput);
    }

    const phoneInput = getLeadFormPhoneInput();
    const phone = phoneInput.value;
    if (!isBlank(phone) && !isValidPhone(phone)) {
        phoneInput.setCustomValidity(isFrench ? "Veuillez entrer un numÃ©ro de tÃ©lÃ©phone valide." : 'Please enter a valid phone number.');
        errorInput = defaultIfUndefined(errorInput, phoneInput);
    }

    const messageInput = getLeadFormMessageInput();
    const message = messageInput.value;
    if (isBlank(message)) {
        messageInput.setCustomValidity(isFrench ? "Veuillez entrer un message." : 'Please enter a message.');
        errorInput = defaultIfUndefined(errorInput, messageInput);
    }

    if (isDefined(errorInput)) {
        errorInput.focus();
        return false;
    }

    return true;
}

async function submitLeadModal(event) {
    event.preventDefault();
    event.stopPropagation();

    const nameInput = getLeadFormNameInput();
    nameInput.setCustomValidity('');
    const emailInput = getLeadFormEmailInput();
    emailInput.setCustomValidity('');
    const phoneInput = getLeadFormPhoneInput();
    phoneInput.setCustomValidity('');
    const messageInput = getLeadFormMessageInput();
    messageInput.setCustomValidity('');
    getLeadFormPostalCodeInput().setCustomValidity('');

    setSalesLeadFormLoadingState(true);
    const form = getLeadFormModalForm();
    const isFormValid = await validateLeadForm();
    if (!isFormValid) {
        setSalesLeadFormLoadingState(false);
        form.reportValidity();
        return;
    }

    const name = nameInput.value;
    const email = emailInput.value;
    const phone = phoneInput.value;

    window.storefrontUserInfo = window.storefrontUserInfo || {};
    if (!isBlank(name) && !isBlank(email)) {
        setUserInfo(name, email, phone, window.storefrontUserInfo.catId, window.storefrontUserInfo.loggedIn);
    }

    sendLead(name, email, phone, messageInput.value);
}

window.STOREFRONT_USER_INFO_COOKIE_NAME = "storefrontUserInfo";
window.USER_NOT_LOGGED_IN_RESPONSE = "EMPTY";

async function fetchDealersInfo(postalCode) {
    let dealerFetchUrl = `${window.apiBaseUrl}${window.apiConfigs.dealerSearchPath}?oemName=${window.manufacturer}`;
    if (!isBlank(postalCode)) {
        dealerFetchUrl = `${dealerFetchUrl}&postalCode=${postalCode}`;
    }
    const response = await fetch(dealerFetchUrl, {
        credentials: 'include'
    });
    return response.json();
}

document.addEventListener('DOMContentLoaded', () => {
    async function loadUserInfo() {
        /**
         * Check for existing user info cookie and parse it if it exists.
         */
        var rawUserInfoCookie = getCookie(window.STOREFRONT_USER_INFO_COOKIE_NAME);
        if (!isBlank(rawUserInfoCookie)) {
            window.storefrontUserInfo = safeParseJSON(rawUserInfoCookie);
        }

        /**
         * If it's not defined, try to fetch the info as a logged in user.
         */
        if (!isDefined(window.storefrontUserInfo)) {
            try {
                const response = await fetch('/Cat/UserProfile', {
                    credentials: 'same-origin',
                    redirect: 'manual' // This is because when not authenticated the response is a redirect that fetch follows.
                });

                if (response.status !== 200)
                    throw new Error(window.NO_CONTENT_CODE);

                const data = await response.json();
                if (!isDefined(data))
                    throw new Error(window.NO_CONTENT_CODE);

                let name = "";
                if (!isBlank(data.FirstName)) {
                    name = !isBlank(data.LastName)
                        ? `${data.FirstName} ${data.LastName}`
                        : data.FirstName;
                }
                setUserInfo(name, data.Email, data.Mobile, data.CatID, true);
            } catch (error) {
                if (error.message !== window.NO_CONTENT_CODE)
                    logError(ERROR_TYPE.USER_INFO, 'Failed to fetch and set user info.', error);
            }
        }

        /**
         * If it's still not defined and we have a re engagement user in local storage, then use this.
         */
        if (!isDefined(window.storefrontUserInfo)) {
            const reEngagementUser = getReEngagementUser();
            if (isDefined(reEngagementUser)) {
                setUserInfo(reEngagementUser.name, reEngagementUser.email, reEngagementUser.phone, null, false);
            }
        }
    }

    loadUserInfo()
        .then(_res => {
            /**
             * We only want to do all of this if we have a lead form in the DOM.
             */
            if (!isDefined(getLeadForm()))
                return;

            // TODO: Price alerts
            // We don't support price alerts yet so we hide them.
            const priceAlertInputContainer = getLeadFormPriceAlertInputContainer();
            if (isDefined(priceAlertInputContainer)) {
                priceAlertInputContainer.style.display = 'none';
            }

            if (isDefined(window.storefrontUserInfo) && !isBlank(window.storefrontUserInfo.email)) {
                prefillLeadForm(window.storefrontUserInfo.name, window.storefrontUserInfo.email, window.storefrontUserInfo.phone);
            }

            const leadFormMessageInput = getLeadFormMessageInput();
            if (isDefined(leadFormMessageInput)) {
                const defaultMessage = leadFormMessageInput.dataset.defaultText;
                leadFormMessageInput.value = defaultMessage;
                window.leadFormDefaultMessage = defaultMessage;
            }

            const postalCodeInputContainer = getLeadFormPostalCodeInputContainer();
            if (isDefined(postalCodeInputContainer)) {
                postalCodeInputContainer.style.display = 'none';
                const postalCodeInput = getLeadFormPostalCodeInput();
                postalCodeInput.addEventListener('change', onPostalCodeChangeHandler);
                postalCodeInput.addEventListener('input', onPostalCodeChangeHandler);
            }

            // Adding event handler for lead form modal submit button
            const leadFormSubmitButton = getLeadFormSubmitButton();
            if (isDefined(leadFormSubmitButton)) {
                leadFormSubmitButton.addEventListener('click', submitLeadModal);
            }
            // Adding event handler for lead form modal close button
            getLeadForm().querySelector('#leadFormCloseButton').addEventListener('click', closeLeadFormModal);

            // Adding event handler for outside click to close lead form modal.
            function leadFormOutsideClickHandler(event) {
                const leadForm = getLeadForm();
                if (!isDefined(leadForm))
                    return;

                const leadFormContainer = leadForm.children[0];
                // check if leadFormContainer is event target or if it contains the event target
                if (event.target === leadFormContainer || leadFormContainer.contains(event.target))
                    return;

                closeLeadFormModal();
            }

            window.addEventListener('mousedown', leadFormOutsideClickHandler);
            window.addEventListener('touchstart', leadFormOutsideClickHandler);
        })
        .catch(e => logError(ERROR_TYPE.USER_INFO, 'Error while initiating user info.', e));
});

/*********************************
 * Section: Setting Up Page
 ********************************/
(function () {

    if (isQA && params.get('manufacturer')) {
        window.manufacturer = params.get('manufacturer');
    } else {
        const metaTag = document.querySelector('meta[name="manufacturer"]');
        window.manufacturer = metaTag ? metaTag.getAttribute('content') : '';
    }

    if (isQA && params.get('model')) {
        window.modelOverride = params.get('model');
    } else {
        const metaTag = document.querySelector('meta[name="model"]');
        window.modelOverride = metaTag ? metaTag.getAttribute('content') : '';
    }

    if (isQA) {
        console.debug('QA mode is activated - API requests are sourced from the "' + lang + '" language. The manufacturer has been set to "' + manufacturer + '".');
    }

    /*********************************
     * Section: Vehicle inventory
     ********************************/
    document.addEventListener('DOMContentLoaded', () => {
        let cards = document.querySelectorAll('[data-at-card]');
        if (cards.length > 0) {
            const manufacturerMeta = manufacturer;
            const modelMeta = modelOverride;
            let vehicleInventoryApiUrl = `${window.apiBaseUrl}${window.apiConfigs.vehicleSearchPath}?make=${manufacturerMeta}`;

            if (modelMeta) {
                vehicleInventoryApiUrl += '&model=' + modelMeta;
            }

            const minYear = resolveMinYear();
            vehicleInventoryApiUrl += `&minYear=${minYear}`;

            const maxYear = resolveMaxYear();
            if (isDefined(maxYear)) {
                vehicleInventoryApiUrl += `&maxYear=${maxYear}`;
            }

            fetch(vehicleInventoryApiUrl, {
                credentials: 'include'
            })
                .then(response => {
                    if (response.status === 204) {
                        throw new Error(window.NO_CONTENT_CODE);
                    } else if (!response.ok) {
                        throw new Error(`Failed Inventory fetch due to error. Status code: ${response.status}.`);
                    }

                    return response.json();
                }).then(data => {
                    document.body.removeAttribute('data-skeleton');

                    // If there are more cards than vehicles, remove the extra cards
                    if (cards.length > data.vehicles.length) {
                        for (let i = data.vehicles.length; i < cards.length; i++) {
                            cards[i].remove();
                        }
                    }

                    // Update href of all elements with 'data-at-inventory-url' attribute
                    const inventoryUrlElements = document.querySelectorAll('[data-at-inventory-url]');
                    inventoryUrlElements.forEach(element => {
                        element.href = data.searchUrl;
                    });

                    // Update the cards NodeList to reflect the removed cards
                    cards = document.querySelectorAll('[data-at-card]');

                    cards.forEach((card, index) => {
                        const vehicle = data.vehicles[index];
                        if (!vehicle) {
                            return;
                        }

                        // Setting tracking attributes (GTM)
                        card.setAttribute('data-an-position', index + 1);

                        for (let key in vehicle) {
                            if (typeof vehicle[key] === 'object' && vehicle[key] !== null) {
                                // If the value is an object, add data attributes for each key in the object
                                for (let subKey in vehicle[key]) {
                                    card.setAttribute(`data-an-${key}-${subKey}`, vehicle[key][subKey]);
                                }
                            } else {
                                card.setAttribute(`data-an-${key}`, vehicle[key]);
                            }
                        }

                        if (vehicle.hasSpinFeature !== true) {
                            const spinImg = card.querySelector('[data-at-visibility="hasSpinFeature"]');
                            if (spinImg)
                                spinImg.remove();
                        }

                        if (vehicle.hasVideo !== true) {
                            const videoImg = card.querySelector('[data-at-visibility="hasVideo"]');;
                            if (videoImg)
                                videoImg.remove();
                        }

                        /*********************************
                         * Lead Form - Button Event Handler
                         ********************************/
                        var leadFormButton = card.querySelector('[data-action="lead-modal"]');
                        if (leadFormButton) {
                            const vehicleInfo = tryExtractVehicleInfo(vehicle, index);
                            // Make sure this event handler function is a lambda or vehicleInfo will be undefined.
                            leadFormButton.addEventListener('click', (event) => {
                                // We're trying to block the button from triggering the anchor on the parent card.
                                event.preventDefault();
                                event.stopPropagation();
                                const savedVehicle = vehicleInfo;
                                window.openLeadFormModal(savedVehicle);
                            });
                        }

                        const textElements = card.querySelectorAll('[data-at-text]');
                        textElements.forEach(el => {
                            const key = el.getAttribute('data-at-text');
                            const keys = key.split('-');
                            let value = vehicle;
                            keys.forEach(k => {
                                value = value[k];
                            });

                            if (key === 'price') {
                                if (window.isFrench) {
                                    value = new Intl.NumberFormat('fr-CA', {
                                        style: 'currency',
                                        currency: 'CAD',
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 0
                                    }).format(value);
                                } else {
                                    value = new Intl.NumberFormat('en-CA', {
                                        style: 'currency',
                                        currency: 'CAD',
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 0
                                    }).format(value);
                                }
                            }

                            if (key === 'distance') {
                                value = window.isFrench
                                    ? `Ã€ ${value} km de vous`
                                    : `${value} km from you`;
                            }

                            el.innerHTML = value;
                        });

                        const imageElements = card.querySelectorAll('[data-at-image]');
                        imageElements.forEach(el => {
                            const key = el.getAttribute('data-at-image');
                            const keys = key.split('-');
                            let value = vehicle;
                            keys.forEach(k => {
                                value = value[k];
                            });
                            if (value) {
                                el.src = value;
                            }
                        });

                        const linkElements = card.querySelectorAll('[data-at-link]');
                        linkElements.forEach(el => {
                            const key = el.getAttribute('data-at-link');
                            el.href = vehicle[key];
                        });
                    });

                }).then(() => {

                    // Apply data pushes to rendered inventory.

                    let items = [];

                    let cards = document.querySelectorAll('[data-at-card]');

                    cards.forEach((parent, index) => {
                        let item = {
                            'item_id': '',
                            'item_name': '',
                            'listingPosition': 'organic',
                            'price': '',
                            'item_brand': '',
                            'item_category': 'not used',
                            'quantity': '1',
                            'ad_id': '',
                            'ad_make': '<MAKE>',
                            'ad_model': '<MODEL>',
                            'ad_province': '<PROVINCE>',
                            'ad_year': '<YEAR>',
                            'ad_dealer_id': '',
                            'raw_location': '',
                            'ad_position': 'organic',
                            'ad_active_upsells': 'organic',
                            'ad_upgrades_applied': 'not used',
                            'positions': ''
                        };

                        let itemMapping = {
                            'item_id': 'trackingid',
                            'item_name': 'model', // add brand and model
                            'item_brand': 'dealer-trackingid',
                            'ad_dealer_id': 'dealer-trackingid',
                            'price': 'price',
                            'quantity': '1',
                            'ad_id': 'trackingid',
                            'ad_make': 'make',
                            'ad_model': 'model',
                            'ad_province': 'province',
                            'ad_year': 'year',
                            'ad_position': 'ad-position',
                            'positions': 'position'

                        };

                        for (let key in item) {
                            let attrName = 'data-an-' + itemMapping[key];
                            let attr = parent.getAttribute(attrName);

                            if (attr !== null) {
                                if (key === 'item_name') {
                                    var metaContent = document.querySelector('meta[name="manufacturer"]').content;
                                    item[key] = metaContent + ' | ' + attr;
                                } else {
                                    item[key] = attr;
                                }
                            }
                        }

                        items.push(item);
                    });

                    let vehicle = [];

                    cards.forEach((parent) => {
                        let item = {
                            'adID': '<AD ID>',
                            'upgradesApplied': 'not used',
                            'dealerID': 'trackingid',
                            'listingPosition': 'organic',
                            'make': '<MAKE>',
                            'model': '<MODEL>',
                            'price': '<PRICE>',
                            'province': '<PROVINCE>',
                            'rawLocation': '',
                            'year': '<YEAR>'
                        };

                        let itemMapping = {
                            'adID': 'trackingid',
                            'dealerID': 'dealer-trackingid',
                            'make': 'make',
                            'model': 'model',
                            'price': 'price',
                            'province': 'province',
                            'year': 'year'
                        };

                        for (let key in item) {
                            let attrName = 'data-an-' + itemMapping[key];
                            let attr = parent.getAttribute(attrName);

                            if (attr !== null) {
                                if (key === 'item_name') {
                                    var metaContent = document.querySelector('meta[name="manufacturer"]').content;
                                    item[key] = metaContent + ' | ' + attr;
                                } else {
                                    item[key] = attr;
                                }
                            }
                        }

                        vehicle.push(item);
                    });

                    function generateDataPush(items, type, vehicle) {
                        let elementTitle = document.querySelector('[data-push-title]');
                        let dataPushTitleValue = elementTitle.dataset.pushTitle;

                        let dataPush = {
                            'event': type,
                            'listKey': dataPushTitleValue.replace('[brand]', manufacturerMeta).replace('[model]', modelMeta),
                            'ecommerce': {
                                'item_list_name': 'storefront - ' + elementTitle.textContent.replace(/\n/g, ' ').trim(),
                                items
                            }
                        };

                        if (vehicle != null) {
                            dataPush['vehicle'] = vehicle;
                        }

                        return dataPush;
                    }
                    let dataPush = generateDataPush(items, 'view_item_list');

                    dataLayer.push(dataPush);

                    function handleClick(event) {
                        let link = event.target.closest('a');
                        let parentElement = link.parentNode;
                        let index = Array.from(parentElement.parentNode.children).indexOf(parentElement);

                        let dataPush = generateDataPush([items[index]], 'select_item', vehicle[index]);

                        dataLayer.push(dataPush);
                    }

                    cards.forEach((card) => {
                        card.addEventListener('click', handleClick);
                    });

                }).catch(error => {
                    let inventoryCard = document.querySelector('[data-at-card]');
                    if (inventoryCard)
                        inventoryCard.closest('section').remove();
                    if (error.message !== window.NO_CONTENT_CODE) {
                        logError(ERROR_TYPE.API, 'Failed Inventory fetch', error);
                    }
                });

        }

    });

    /*********************************
     * Trim Translations Mapping
     ********************************/
    const mapping = {
        "360 Camera": "CamÃ©ra Ã  360Â°",
        "Adaptive Cruise Control": "RÃ©gulateur de vitesse adaptatif",
        "Add Vehicle": "Ajouter vÃ©hicule",
        "Air Conditioning": "Climatiseur",
        "All Features": "Toutes les caractÃ©ristiques",
        "AM/FM Stereo": "AM/FM StÃ©rÃ©o",
        "Android Auto": "Android Auto",
        "Apple CarPlay": "Apple CarPlay",
        "Auto-Dimming Rearview Mirror": "RÃ©troviseur Ã  attÃ©nuation automatique",
        "Automatic Headlights": "Phares automatiques",
        "Automatic Parking": "Stationnement automatique",
        "AutoTrader Review": "Avis AutoHebdo",
        "Auxiliary Audio Input": "Prise audio auxiliaire",
        "Back-Up Camera": "CamÃ©ra de recul",
        "Base Curb Weight": "Poids Ã  vide ",
        "Based on": "Selon",
        "Battery Range": "PortÃ©e batterie (km)",
        "Bed Liner": "Doublure de caisse",
        "Blind Spot Monitor": "Surveillance de lâ€™angle mort",
        "Bluetooth Connection": "Interface Bluetooth",
        "Brake": "Freins",
        "Brake ABS System": "Freinage ABS",
        "Brake Assist": "Freinage assistÃ©",
        "Buyerâ€™s Guide": "Guide dâ€™achat",
        "Canadian MSRP": "PDSF",
        "MSRP": "PDSF",
        "Canopy": "Toit amovible",
        "Car Comparison": "Comparatif de vÃ©hicules",
        "Cargo Volume ": "Volume cargo ",
        "Cargo Volume to First Row": "Volume cargo 1re rangÃ©e ",
        "Cargo Volume to Second Row": "Volume cargo 2e rangÃ©e ",
        "Cargo Volume to Third Row": "Volume cargo 3e rangÃ©e ",
        "CD Player": "Lecteur CD",
        "Change Vehicle": "Changer vÃ©hicule",
        "Child Safety Locks": "Verrous de sÃ©curitÃ© pour enfants",
        "Climate Control": "Climatisation automatique",
        "Comfort": "Confort",
        "Compare": "Comparer",
        "Compare Cars Side by Side": "Comparatif de modÃ¨les cÃ´te Ã  cÃ´te",
        "Compare Trims": "Comparer les versions",
        "Want to see which vehicle is better? Use our Vehicle Comparison Tool and see their price, specs and features side by side.": "Vous nâ€™avez pas encore trouvÃ© le modÃ¨le qui vous convient le mieux? Utilisez notre outil comparatif pour afficher les prix, donnÃ©es techniques et autres caractÃ©ristiques en cÃ´te Ã  cÃ´te.",
        "Comparison": "Comparaison",
        "Compare prices, trims, specs, options, features and scores of up to five cars, trucks or SUVs that are available in Canada with our free side-by-side car comparison tool.": "Compare les prix, versions, donnÃ©es techniques, options, caractÃ©ristiques et cotes dâ€™un maximum de cinq voitures, camions ou VUS offerts au Canada avec notre outil gratuit de comparaison en face Ã  face.",
        "Connectivity": "ConnectivitÃ©",
        "Convenience": "CommoditÃ©",
        "Cooled Front Seat(s)": "SiÃ¨ges avant ventilÃ©s",
        "Cooled Rear Seat(s)": "SiÃ¨ges arriÃ¨re ventilÃ©s",
        "Cross-Traffic Alert": "Alerte de circulation transversale",
        "Cruise Control": "RÃ©gulateur de vitesse",
        "Data provided by": "DonnÃ©es fournies par",
        "Daytime Running Lights": "Feux de jour",
        "Dead Weight Hitch - Max Tongue Wt.": "Cap. de remorquage, attelage - Poids max. au timon",
        "Dead Weight Hitch - Max Trailer Wt.": "Cap. de remorquage, attelage - Charge utile max.",
        "Differences": "DiffÃ©rences",
        "Displacement": "CylindrÃ©e",
        "DriverAssistance": "Aide Ã  la conduite",
        "Driver Assistance": "Aide Ã  la conduite",
        "Driver Adjustable Lumbar": "Ajustement lombaire conducteur",
        "Driver Air Bag": "Coussin gonflable conducteur",
        "Driver Restriction Features": "Restrictions de conduite",
        "Drivetrain": "EntraÃ®nement",
        "Emergency Trunk Release": "Ouverture dâ€™urgence du coffre",
        "Engine": "Moteur",
        "Engine Immobilizer": "AntidÃ©marreur",
        "Explore": "AnnÃ©es-modÃ¨les",
        "Exterior": "ExtÃ©rieur",
        "Exterior Styling": "Style extÃ©rieur",
        "Fifth Wheel Hitch - Max Tongue Wt.": "Attelage Ã  sellette - Poids max. au timon",
        "Fifth Wheel Hitch - Max Trailer Wt.": "Attelage Ã  sellette - Charge utile max.",
        "for Sale": "Ã  vendre",
        "Front Head Air Bag": "Coussin gonflable avant",
        "Front Head Air bag": "Coussin gonflable avant",
        "Front Head Room": "DÃ©gagement tÃªte, avant",
        "Front Leg Room": "DÃ©gagement genoux, avant",
        "Front Reading Lamps": "Lampes de lecture avant",
        "Front Shoulder Room": "DÃ©gagement Ã©paules, avant ",
        "Front Side Air Bag": "Coussins gonflables latÃ©raux avant",
        "Front Tire Size": "Pneus avant",
        "Fuel": "Carburant",
        "Fuel Capacity": "Cap. carburant (L)",
        "Fuel Consumption: City": "Consom. carburant: Ville",
        "Fuel Consumption: City/HWY Combined": "Consom. carburant: CombinÃ©",
        "Fuel Consumption: Equivalent - City": "Consom. carburant: Ã‰quivalent - Ville",
        "Fuel Consumption: Equivalent - City/HWY Combined": "Consom. carburant: Ã‰quivalent - CombinÃ©",
        "Fuel Consumption: Equivalent - Highway": "Consom. carburant: Ã‰quivalent - Autoroute",
        "Fuel Consumption: Highway": "Consom. carburant: Autoroute",
        "Fuel Economy": "Ã‰conomie de carburant",
        "Fuel System": "SystÃ¨me dâ€™alimentation",
        "Hands-Free Liftgate": "Hayon motorisÃ© main libre",
        "Hard Disk Drive Media Storage": "Disque dur stockage mÃ©dia",
        "HD Radio": "Radio HD",
        "Headlights-Auto-Leveling": "Phares Ã  nivellement automatique",
        "Heads-Up Display": "Affichage tÃªte haute",
        "Head to Head Comparisons": "Comparatif face-Ã -face",
        "Heated Front Seat(s)": "SiÃ¨ges avant chauffants",
        "Heated Mirrors": "Miroirs chauffants",
        "Heated Rear Seat(s)": "SiÃ¨ges arriÃ¨re chauffants",
        "Heated Steering Wheel": "Volant chauffant",
        "Height, Overall": "Hauteur hors-tout ",
        "HID headlights": "Phares HID",
        "Horsepower": "Puissance",
        "Infotainment": "Infodivertissement",
        "Integrated Turn Signal Mirrors": "Miroirs Ã  feux clignotants intÃ©grÃ©s",
        "Interior": "IntÃ©rieur",
        "Interior Design": "CommoditÃ© intÃ©rieure",
        "Inventory": "Inventaire",
        "Keyless Entry": "TÃ©lÃ©dÃ©verrouillage",
        "Keyless Start": "DÃ©marrage sans clÃ©",
        "Key Specifications for": "Principales caractÃ©ristiques:",
        "Knee Air Bag": "Coussin gonflable aux genoux",
        "Lane Departure Warning": "Avertisseur de dÃ©rive",
        "Lane Keeping Assist": "Aide au maintien dans la voie",
        "Latest Automotive Articles": "Plus rÃ©cents articles automobiles",
        "Latest Convertibles": "Plus rÃ©centes dÃ©capotables",
        "Latest Coupes": "CoupÃ©s neufs",
        "Latest Hatchbacks": "VÃ©hicules Ã  hayon",
        "Latest Minivans": "Minifourgonnettes neuves",
        "Latest Sedans": "Berlines neuves",
        "Latest SUVs": "VUS neufs",
        "Latest Trucks": "Camions neufs",
        "Latest and Upcoming Vehicles": "VÃ©hicules rÃ©cents et non dÃ©voilÃ©s",
        "Latest Vehicles": "Plus rÃ©cents vÃ©hicules",
        "Latest Wagons": "Familiales neuves",
        "Length, Overall": "Longueur hors-tout ",
        "Less Makes": "Moins de marques",
        "Lighting": "Ã‰clairage",
        "Luggage Rack": "Porte-bagages",
        "Make": "Marque",
        "Manufacturer Recall Number": "NumÃ©ro de rappel du fabricant",
        "Maximum Trailering Capacity": "CapacitÃ© de remorque max.",
        "Mechanical": "MÃ©canique",
        "Min Ground Clearance": "Garde au sol ",
        "Mirror Memory": "Miroir Ã  mÃ©moire",
        "Model": "ModÃ¨le",
        "Model year(s) affected": "AnnÃ©e-modÃ¨le touchÃ©e",
        "Model Overview": "AperÃ§u du modÃ¨le",
        "Models": "ModÃ¨les",
        "More Makes": "Plus de marques",
        "Most Popular Comparisons": "Plus populaires comparatifs",
        "MP3 Player": "Lecteur MP3",
        "Multi-Zone Air Conditioning": "Climatiseur multizone",
        "N/A": "s.o.",
        "Navigation System": "SystÃ¨me de navigation",
        "News and Reviews": "Nouvelles et Revues",
        "Frequently Asked Questions About the": "Foire Aux Questions Sur la",
        "Night Vision": "SystÃ¨me de vision nocturne",
        "No content available": "Aucun contenu disponible",
        "No deals currently available for this location.": "PrÃ©sentement aucune offre pour cet emplacement.",
        "There is no record of recalls for the": "Aucun rappel trouvÃ© pour",
        "Not Available": "Non offert",
        "Notification Type": "Type de notification",
        "Optional": "En option",
        "Overall Score": "Note globale",
        "Owner Reviews": "Ã‰valuations de propriÃ©taires",
        "Owner Scores": "Avis des proprios",
        "Passenger Adjustable Lumbar": "Ajustement lombaire passager",
        "Passenger Air Bag": "Coussin gonflable passager",
        "Passenger Capacity": "Nb. de passagers",
        "Pickup Bed Tonneau Cover": "Couvercle de caisse rigide",
        "Power Door Locks": "Verrouillage Ã©lectrique",
        "Power Driver Seat": "SiÃ¨ge motorisÃ© conducteur",
        "Power Folding Mirrors": "Miroirs escamotables",
        "Power Liftgate": "Hayon motorisÃ©",
        "Power Mirror(s)": "Miroirs Ã©lectriques",
        "Power Outlet": "Prise de courant",
        "Power Passenger Seat": "SiÃ¨ge motorisÃ© passager",
        "Power Retractable Running Boards": "Marchepieds motorisÃ©s rÃ©tractables",
        "Power Windows": "Vitres Ã©lectriques",
        "Cars": "Automobiles",
        "Compare Vehicles": "Comparer vÃ©hicules",
        "Convertibles": "DÃ©capotables",
        "Coupes": "CoupÃ©s",
        "Hatchbacks": "VÃ©hicules Ã  hayon",
        "Already have a model in mind? Dive in and see information on trims, prices, specs, options and more!": "Vous avez dÃ©jÃ  un modÃ¨le en tÃªte? SÃ©lectionnez-le ci-dessous pour dÃ©couvrir les versions, prix, donnÃ©es techniques, options et plus!",
        "Home": "Accueil",
        "Luxury Sedans": "Berlines de luxe",
        "Luxury SUVs": "VUS de luxe",
        "Minivans": "Minifourgonnettes",
        "Sedans": "Berlines",
        "SUVs": "VUS",
        "Trucks": "Camions",
        "Wagons": "Familiales",
        "Rain Sensing Wipers": "Essuie-glace automatiques",
        "Read less": "Lire moins",
        "Read more": "Lire plus",
        "Rear Air Conditioning": "Climatisation Ã  lâ€™arriÃ¨re",
        "Rear Head Air Bag": "Coussin gonflable arriÃ¨re",
        "Rear Head Room": "DÃ©gagement tÃªte, arriÃ¨re ",
        "Rear Leg Room": "DÃ©gagement genoux, arriÃ¨re ",
        "Rear Parking Aid": "Aide au stationnement arriÃ¨re",
        "Rear Reading Lamps": "Lampes de lecture arriÃ¨re",
        "Rear Seat Audio Controls": "Commandes audio aux siÃ¨ges arriÃ¨re",
        "Rear Shoulder Room": "DÃ©gagement Ã©paules, arriÃ¨re ",
        "Rear Side Air Bag": "Coussins gonflables latÃ©raux arriÃ¨re",
        "Rear Tire Size": "Pneus arriÃ¨re",
        "Recall date": "Date de rappel",
        "Recall Information": "Rappels",
        "Recall number": "NÂ° de rappel",
        "Reliability": "FiabilitÃ©",
        "Remote Engine Start": "DÃ©marreur Ã  distance",
        "Remote Trunk Release": "Couvercle de coffre tÃ©lÃ©commandÃ©",
        "Research": "Rechercher",
        "Research By Make": "Recherche par marque",
        "reviews": "avis",
        "Reviews & News": "Revues et nouvelles",
        "Rollover Protection Bars": "Barres de protection antiroulis",
        "Roof": "Toit",
        "Running Boards/Side Steps": "Marchepieds",
        "Safety": "SÃ©curitÃ©",
        "Satellite Radio": "Radio satellite",
        "Search now": "Rechercher maintenant",
        "Seat-Massage": "SiÃ¨ges Ã  massage",
        "Seatbelt Air Bag": "Coussin gonflable de ceinture",
        "Seat Memory": "MÃ©moire de siÃ¨ge",
        "Seats": "SiÃ¨ges",
        "Security": "SÃ©curitÃ©",
        "Security System": "SystÃ¨me de sÃ©curitÃ©",
        "Select Another Vehicle": "SÃ©lectionner autre vÃ©hicule",
        "Select A Vehicle": "SÃ©lectionner un vÃ©hicule",
        "Similar Vehicles": "VÃ©hicules similaires",
        "Smart Device Integration": "IntÃ©gration appareils intelligents",
        "Stability Control": "ContrÃ´le de stabilitÃ©",
        "Standard": "De sÃ©rie",
        "Steering": "Direction",
        "Steering Wheel-Audio Controls": "Commandes de la radio au volant",
        "Stepside Pickup Box": "Caisse stepside",
        "Sun/Moon Roof": "Toit soleil/lune",
        "System affected": "SystÃ¨me touchÃ©",
        "Third Row Head Room": "DÃ©gagement tÃªte, 3e rangÃ©e ",
        "Third Row Leg Room": "DÃ©gagement genoux, 3e rangÃ©e ",
        "Third Row Shoulder Room": "DÃ©gagement Ã©paules, 3e rangÃ©e ",
        "Tire Pressure Monitor": "Surv. pression des pneus",
        "Torque": "Couple",
        "Traction Control": "SystÃ¨me antipatinage",
        "Trader Scores": "Cotes AutoHebdo",
        "Transmission": "Transmission",
        "Transport Canada": "Transports Canada",
        "Trim Comparison": "Comparatif de versions",
        "Trim (Optional)": "Version (En option)",
        "Trunk Volume": "Volume coffre",
        "Units Affected": "UnitÃ©s affectÃ©es",
        "Universal Garage Door Opener": "Ouvre-porte de garage universel",
        "Upcoming": "Ã€ venir",
        "Variable Speed Intermittent Wipers": "Essuie-glaces intermittents",
        "Vehicle Information": "Renseignements sur le vÃ©hicule",
        "This vehicle has not yet been reviewed": "Soyez le premier Ã  donner votre avis!",
        "Vehicle Research": "Rechercher vÃ©hicule",
        "View all": "Voir toutes les",
        "View All Articles": "Tous les articles",
        "View all owner reviews": "Voir tous les avis de propriÃ©taires",
        "View Deals": "Voir les offres",
        "View details": "Afficher dÃ©tails",
        "View Inventory": "Voir inventaire",
        "View Issue": "Voir le problÃ¨me",
        "View less recalls": "Afficher moins de rappels",
        "View more recalls": "Voir plus de rappels",
        "Wheelbase": "Empattement",
        "Wheels-Locks": "Ã‰crous de roues de sÃ©curitÃ©",
        "Width, Max w/o mirrors": "Largeur, sans rÃ©troviseurs ",
        "WiFi Hotspot": "Point dâ€™accÃ¨s Wi-Fi",
        "Wireless Charging": "Recharge sans fil",
        "Wt Distributing Hitch - Max Tongue Wt.": "Attelage Ã  redistribution - Poids max. au timon",
        "Wt Distributing Hitch - Max Trailer Wt.": "Attelage Ã  redistribution - Charge utile max.",
        "Year": "AnnÃ©e",
        "Showing {0} of {1} trims": "{0} de {1} versions",
        "News": "Nouvelles",
        "Review": "Revue",
        "No model overview available": "Aucun aperÃ§u du modÃ¨le disponible",
        "Cargo Volume with Rear Seat Down": "Volume cargo, siÃ¨ges arriÃ¨re abaissÃ©s",
        "Cargo Volume with Rear Seat Up": "Volume cargo, siÃ¨ges arriÃ¨re levÃ©s",
        "Reviews and News": "Revues et nouvelles",
        "No": "Non",
        "Yes": "Oui",
        "4 Wheel Disc": "Disque aux 4 roues",
        "4 Wheel Drum": "Tambour aux 4 roues",
        "All-wheel": "4RM",
        "Flex Fuel": "Flex Fuel",
        "for": "pour",
        "Front-wheel": "Roues avant",
        "Front Disc Rear Drum": "Disques avant/tambours arr.",
        "Gasoline": "Essence",
        "Gasoline direct injection": "Injection directe d'essence",
        "Hydrogen": "HydrogÃ¨ne",
        "I-6 twin turbo premium unleaded": "I-6 double turbo super sans plomb",
        "Manual Steering": "Direction non assistÃ©e",
        "There are no reviews and news": "Aucun avis / nouvelle",
        "Port/direct injection": "Injection indirecte/directe",
        "Power Steering": "Direction assistÃ©e",
        "V-6 twin turbo regular unleaded": "V-6 double turbo rÃ©gulier sans plomb",
        "V-8 regular unleaded": "V-8 rÃ©gulier sans plomb",
        "Wheel drive": "EntraÃ®nement",
        "Compare {0}": "Comparer {0}",
        "DRIVABILITY": "AGRÃ‰MENT CONDUITE",
        "FEATURES": "CARACTÃ‰RISTIQUES",
        "POWERTRAIN": "GROUPE MOTOPROPULSEUR",
        "PRACTICALITY": "COMMODITÃ‰",
        "QUALITY": "SÃ‰CURITÃ‰",
        "STYLING": "STYLISME",
        "USABILITY/ERGONOMICS": "UTILISATION/ERGONOMIE",
        "VALUE": "VALEUR",
        "Owner Score": "Avis des proprios",
        "Deals": "offres",
        "in": "Ã ",
        "Review & Compare: <br /> {0} Trims": "Examiner et comparer : <br /> {0} finitions",
        "Review: {0} Trim": "Examiner : {0} finition",
        "The {0} has <strong>{1} trims.</strong> Below you will be able to review all the trims with the option to compare.": "La {0} comporte <strong>{1} finitions.</strong> Ci-dessous, vous pourrez passer en revue toutes les versions avec la possibilitÃ© de les comparer.",
        "The {0} has <strong>1 trim.</strong> Below you will be able to review this trim in detail.": "Le {0} a <strong>1 garniture.</strong> Vous pourrez examiner cette garniture en dÃ©tail ci-dessous.",
        "trims available": "finitions disponibles",
        "trim available": "finition disponibles",
        "Filter by trim level": "Filtrer par niveau de garniture intÃ©rieure",
        "Apply": "Appliquer",
        "Clear all": "Effacer",
        "of": "de",
        "Add to comparison": "Ajouter Ã  la comparaison",
        "Show full trim specifications": "Afficher toutes les caractÃ©ristiques des finitions",
        "Starting at": "Ã€ partir de"
    }

    /*********************************
     * Trim API Call Block
     ********************************/
    document.addEventListener('DOMContentLoaded', () => {
        const dataTrimsElements = document.querySelectorAll('[data-trims]');
        if (dataTrimsElements.length > 0) {
            const apiModels = document.querySelector('meta[name="apiModels"]');

            let trimModels;
            if (apiModels && typeof apiModels.content === "string" && apiModels.content.trim().length > 0) {
                trimModels = apiModels.content.split(',').map(apiModel => apiModel.trim()).filter(apiModel => apiModel.length > 0).join(',');
            } else {
                trimModels = modelOverride;
            }
            const trimInfoApiURL = `${apiBaseUrl}${window.apiConfigs.modelTrimsPath}?make=${manufacturer}&models=${trimModels}&year=${resolveMinYear()}`;
            fetch(trimInfoApiURL, {
                credentials: 'include'
            })
                .then(response => {
                    if (response.status === 204) {
                        throw new Error(window.NO_CONTENT_CODE);
                    } else if (!response.ok) {
                        throw new Error(`Failed trims fetch due to error. Status code: ${response.status}).`);
                    }

                    return response.json();
                }).then(data => {
                    // Sort trims by MSRP
                    data.sort((a, b) => {
                        const aMsrp = parseInt(a.msrp.replace(/[^\d]/g, ''));
                        const bMsrp = parseInt(b.msrp.replace(/[^\d]/g, ''));
                        if (isNaN(aMsrp) && isNaN(bMsrp)) {
                            return 0; // Both are NaN, consider them equal
                        } else if (isNaN(aMsrp)) {
                            return 1; // aMsrp is NaN, sort a after b
                        } else if (isNaN(bMsrp)) {
                            return -1; // bMsrp is NaN, sort b after a
                        } else {
                            return aMsrp - bMsrp; // Both are valid numbers, sort normally
                        }
                    });

                    dataTrimsElements.forEach(dataTrims => {

                        const clone = dataTrims.firstElementChild.cloneNode(true);

                        dataTrims.innerHTML = '';

                        data.forEach((item, index) => {
                            const itemClone = clone.cloneNode(true);

                            dataTrims.appendChild(itemClone);
                            // Update the slides
                            swiperTrims.updateSlides();

                            itemClone.setAttribute('data-gtm-content-name', 'Slide ' + (index + 1) + ' - ' + item['name']);

                            let gtmModel = itemClone.querySelector('[data-gtm-content-model]');
                            if (gtmModel) {
                                gtmModel.setAttribute('data-gtm-content-model', item['name']);
                            }

                            itemClone.querySelectorAll('[data-trim-text]').forEach(el => {
                                const keys = el.getAttribute('data-trim-text').split('-');
                                let value = item;
                                keys.forEach(key => {
                                    value = value[key];
                                });

                                el.innerHTML = value;
                            });

                            itemClone.querySelectorAll('[data-trim-image]').forEach(el => {
                                const keys = el.getAttribute('data-trim-image').split('-');
                                let value = item;
                                keys.forEach(key => {
                                    value = value[key];
                                });

                                if (value) {
                                    el.src = value;
                                }
                            });

                            let trimCount = itemClone.querySelectorAll('[data-trim-count]');
                            if (trimCount.length > 0) {
                                trimCount.forEach(el => {
                                    const countType = el.getAttribute('data-trim-count');
                                    if (countType === 'current') {
                                        el.innerHTML = index + 1;
                                    } else if (countType === 'total') {
                                        el.innerHTML = data.length;
                                    }
                                });
                            }

                            const keySpecsEl = itemClone.querySelector('[data-trim-key-specifications]');
                            if (keySpecsEl) {
                                const keySpecClone = keySpecsEl.firstElementChild.cloneNode(true);

                                keySpecsEl.innerHTML = '';

                                item.keySpecifications.forEach(spec => {
                                    const newKeySpecClone = keySpecClone.cloneNode(true);
                                    newKeySpecClone.innerHTML = spec;
                                    keySpecsEl.appendChild(newKeySpecClone);
                                });
                            }

                            const specsEl = itemClone.querySelector('[data-trims-specs]');
                            if (specsEl) {
                                const specClone = specsEl.children[1].cloneNode(true);
                                specsEl.removeChild(specsEl.children[1]);
                                Object.entries(item.categories).forEach(([key, value]) => {
                                    const newSpecClone = specClone.cloneNode(true);
                                    newSpecClone.querySelector('[data-trims-specs=title]').innerHTML = window.isFrench ? mapping[key] : key;
                                    newSpecClone.querySelector('[mirror-click]').setAttribute('mirror-click', key);

                                    const listEl = newSpecClone.querySelector('[data-trims-spec=list]');
                                    const listItemClone = listEl.firstElementChild.cloneNode(true);

                                    listEl.innerHTML = '';
                                    Object.entries(value).forEach(([specKey, specValue]) => {
                                        const newListItemClone = listItemClone.cloneNode(true);

                                        newListItemClone.querySelector('[data-trims-spec=key]').innerHTML = window.isFrench ? mapping[specKey] : specKey;

                                        const normalizedValue = safeLower(specValue);
                                        if (normalizedValue === 'yes') {
                                            newListItemClone.querySelector('[data-trims-spec=value]').innerHTML = window.isFrench ? 'Inclus' : 'Included';
                                            newListItemClone.querySelector('[data-trims-spec=value]').className += ' trim_table_included';
                                        } else if (normalizedValue === 'no') {
                                            newListItemClone.querySelector('[data-trims-spec=value]').innerHTML = window.isFrench ? 'Non Inclus' : 'Not Included';
                                            newListItemClone.querySelector('[data-trims-spec=value]').className += ' trim_table_not-available';
                                        } else if (normalizedValue === 'optional') {
                                            newListItemClone.querySelector('[data-trims-spec=value]').innerHTML = window.isFrench ? 'En option' : 'Optional';
                                            newListItemClone.querySelector('[data-trims-spec=value]').className += ' trim_table_optional';
                                        } else {
                                            newListItemClone.querySelector('[data-trims-spec=value]').innerHTML = specValue;
                                        }

                                        listEl.appendChild(newListItemClone);
                                    });

                                    specsEl.appendChild(newSpecClone);
                                });
                            }

                        });

                        const totalEls = document.querySelectorAll('[data-trim-total]');
                        totalEls.forEach(totalEl => {
                            if (totalEl) {
                                if (window.isFrench) {
                                    totalEl.innerHTML = `${data.length} ${data.length === 1 ? 'version' : 'versions'}`;
                                } else {
                                    totalEl.innerHTML = `${data.length} ${data.length === 1 ? 'trim' : 'trims'}`;
                                }
                            }
                        });

                        window.Webflow && window.Webflow.destroy();
                        window.Webflow && window.Webflow.ready();
                        window.Webflow && window.Webflow.require('ix2').init();
                        document.dispatchEvent(new Event('readystatechange'));

                        document.body.removeAttribute('data-skeleton-trims');

                        // Mirror Clicks
                        const mirrorElements = document.querySelectorAll('[mirror-click]');

                        mirrorElements.forEach(element => {
                            element.addEventListener('click', function (event) {
                                // Only proceed if this is a user-initiated event
                                if (!event.isTrusted) {
                                    return;
                                }

                                const mirrorValue = this.getAttribute('mirror-click');

                                const sameMirrorElements = document.querySelectorAll(`[mirror-click="${mirrorValue}"]`);

                                sameMirrorElements.forEach(el => {
                                    if (el !== this) { // Avoid infinite loop by not clicking the element that was originally clicked
                                        el.click();
                                    }
                                });
                            });
                        });
                    });
                })
                .catch(error => {
                    if (error.message !== window.NO_CONTENT_CODE)
                        logError(ERROR_TYPE.API, 'Failed trims fetch', error);
                    
                    let trimCards = document.querySelector('[data-trims]');
                    if (trimCards) 
                        trimCards.closest('section').remove();
                });
        }
    });

    /*********************************
     * Dealer Map Block
     ********************************/
    const isDealerBlockEnabled = document.querySelector('[data-map]');
    if (!isDealerBlockEnabled) {
        /**
         * If dealer block is not there, pivot is there or check avail offer feature enabled and we have a postal code for the user, 
         * then we should prefetch dealers to save the nearest dealer to the user in case they
         * use the "Get a quote" feature.
         */
        if ((isPivotWidgetEnabled() || isCheckAvailFeatureEnabled()) && !isBlank(window.userPostalCode)) {
            loadNearestDealer(window.userPostalCode);
        }
    } else {
        // Configure variables for APIs
        const mapKey = 'AIzaSyAJ4RR6p9mwLCt8xALz5-HHcvUO0btxYJI';


        // Call the function and store the promise
        let dataPromise = fetchDealersInfo();

        let fetchLongitude;
        let fetchLatitude;

        dataPromise.then(data => {
            if (data && data.userLocation) {
                fetchLongitude = data.userLocation.longitude;
                fetchLatitude = data.userLocation.latitude;
            }
        });

        // Initialize lastRequestedDirections variable
        let lastRequestedDirections = null;
        // Main map code responsible for creating the map, adding markers, and populating the list

        window.initMap = () => {

            let destinationLocation = '';
            userLocationPromise = dataPromise.then(data => {
                if (data && data.userLocation) {
                    fetchLongitude = data.userLocation.longitude;
                    fetchLatitude = data.userLocation.latitude;
                }
                return {
                    lat: fetchLatitude || 43.70, // Use fetched latitude or default to Toronto
                    lng: fetchLongitude || -79.42 // Use fetched longitude or default to Toronto
                };
            });

            userLocationPromise.then(userLocation => {

                function calculateAndDisplayRoute(directionsService, directionsRenderer, origin, destination, travelMode) {
                    directionsService.route(
                        {
                            origin: origin,
                            destination: destination,
                            travelMode: travelMode
                        },
                        (response, status) => {
                            if (status === 'OK') {
                                directionsRenderer.setDirections(response);

                                // Get the destination address of the last leg
                                let legs = response.routes[0].legs;
                                let lastLeg = legs[legs.length - 1];
                                let destinationAddress = lastLeg.end_address;

                                document.querySelector('[data-map=destination]').innerHTML = destinationAddress;
                            } else {
                                logError(ERROR_TYPE.MAP, 'Directions request failed due to ' + status);
                            }
                        }
                    );
                }

                // Get the update location element from the GoogleMapWidget
                const updateLocationElement = document.querySelector('[data-map="update-location"]');

                if (updateLocationElement) {
                    updateLocationElement.addEventListener('click', () => {
                        // Get the value of the user input from the element with data-map="postcode" (not necessarily a postal code)
                        const postcodeElement = document.querySelector('[data-map="postcode"]');
                        if (postcodeElement) {
                            const address = postcodeElement.value;
                            // Use Google Maps Geocoding API to get the latitude and longitude from the postcode
                            fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${mapKey}&language=${lang}`)
                                .then(response => response.json())
                                .then(data => {
                                    if (!isDefined(data.results[0]) || !isDefined(data.results[0].geometry) || !isDefined(data.results[0].geometry.location)) {
                                        logError(ERROR_TYPE.MAP, `Failed to get coordinates from input address: ${address}. Response: ${JSON.stringify(data)}`);
                                        return;
                                    }

                                    const location = data.results[0].geometry.location;

                                    // Update userLocation coordinates
                                    userLocation.lat = location.lat;
                                    userLocation.lng = location.lng;

                                    // This triggers the "Directions" button click event on a dealer tile
                                    lastRequestedDirections.click();
                                })
                                .catch(error => {
                                    logError(ERROR_TYPE.MAP, 'Failed to get coordinates from input address: ' + address, error);
                                });
                        }
                    });
                }

                function initDirections(retryOnFailure = true) {
                    // Use a geocoding service to get the postcode from the latitude and longitude
                    fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${userLocation.lat},${userLocation.lng}&key=${mapKey}&language=${lang}`)
                        .then(response => response.json())
                        .then(data => {

                            // Set the postcode in the element with the attribute data-map="postcode"
                            const postcodeElement = document.querySelector('[data-map="postcode"]');
                            if (!postcodeElement) {
                                logError(ERROR_TYPE.MAP, 'No element with data-map="postcode" found when trying to initDirections().');
                            } else if (data.results && data.results[0]) {
                                const addressComponent = data.results[0].address_components.find(component => component.types.includes('postal_code'));
                                if (addressComponent) {
                                    const postcode = addressComponent.short_name;
                                    postcodeElement.value = postcode;
                                } else {
                                    logError(ERROR_TYPE.MAP, 'No postal_code found in address_components when trying to initDirections().');
                                }
                            } else {
                                logError(ERROR_TYPE.MAP, 'No results found in geocoding response when trying to initDirections(). Data:' + JSON.stringify(data));
                            }
                        })
                        .catch(error => {
                            logError(ERROR_TYPE.MAP, 'Failed to get postcode from latitude and longitude. Is retry: ' + retryOnFailure, error);
                            if (retryOnFailure) {
                                initDirections(false);
                            }
                        });
                }

                dataPromise.then(data => {
                    // Replace locations with companies
                    const locations = data.companies;

                    // We want to save the nearest dealer only if the user had a postal code. Otherwise, we likely loaded the default dealer list.
                    if (isNotEmptyArray(locations) && !isBlank(window.userPostalCode)) {
                        window.nearestDealer = locations[0];
                    }

                    // Create a new map centered at the user's location
                    const map = new google.maps.Map(document.getElementById('map'), {
                        zoom: 11,
                        center: userLocation,
                        styles: [{
                            featureType: 'poi',
                            stylers: [{
                                visibility: 'off'
                            }
                            ]
                        }
                        ],
                        streetViewControl: false, // This will hide the Street View control
                        mapTypeControl: false // This will hide the Map/Satellite control
                    });

                    // Create a new DirectionsService object
                    const directionsService = new google.maps.DirectionsService();
                    // Create a new DirectionsRenderer object
                    const directionsRenderer = new google.maps.DirectionsRenderer();

                    // Set the map for the DirectionsRenderer
                    directionsRenderer.setMap(map);

                    // Set the panel for the DirectionsRenderer
                    let panelElement = document.querySelector('[data-maps-directions]');
                    directionsRenderer.setPanel(panelElement);

                    // Get the list and the template list item
                    const list = document.querySelector('[data-map-list]');
                    const template = list.firstElementChild;

                    window.positionMap = (coordinates) => {
                        map.setCenter(coordinates);
                        map.setZoom(15);
                    }

                    // We don't want the phone number anchor clicks to prompt for an app choice on desktop/tablets devices.
                    window.phoneNumberClickHandler = (event) => {
                        if (!window.isMobileDevice()) {
                            event.preventDefault();
                        }
                    }

                    let currentInfoWindow = null;
                    // Add a marker and a list item for each location
                    locations.forEach((dealer, index) => {
                        const marker = new google.maps.Marker({
                            position: {
                                lat: parseFloat(dealer.latitude),
                                lng: parseFloat(dealer.longitude)
                            },
                            map: map,
                            icon: 'https://uploads-ssl.webflow.com/64c57def3601adf69171da07/65e894381acc2469159cdc1c_dormant.svg'
                        });

                        // Construct languages varaibles.

                        let distanceCopy = 'km de chez vous';
                        let directionsCopy = 'Obtenir des directions';

                        if (window.isFrench) {
                            distanceCopy = 'km de chez vous';
                            directionsCopy = 'Obtenir des directions';
                        } else {
                            distanceCopy = 'km from you';
                            directionsCopy = 'Get Directions';
                        }

                        let infoWindow = new google.maps.InfoWindow({
                            content: `
                                <div class="maps_infowindow maps_tip_heading">
                                <div class="maps_infowindow_header">
        
                                <img src="${dealer.logoUrl}" loading="lazy" alt="" class="maps_infoWindow_image">
                                
                                <div class="maps_infowindow_heading">${dealer.name}</div></div>
                                
                                <div class="maps_infowindow_divider">
                                
                                </div>
                                
                                <ul role="list" class="map_item_list_window">
                                
                                <li class="map_item_list_item">
                                
                                <div class="map_item_list_item_icon w-embed"> <svg width="14" height="15" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.99935 7.26213C6.61257 7.26213 6.24164 7.10848 5.96815 6.83499C5.69466 6.5615 5.54102 6.19057 5.54102 5.80379C5.54102 5.41702 5.69466 5.04609 5.96815 4.77259C6.24164 4.4991 6.61257 4.34546 6.99935 4.34546C7.38612 4.34546 7.75706 4.4991 8.03055 4.77259C8.30404 5.04609 8.45768 5.41702 8.45768 5.80379C8.45768 5.9953 8.41996 6.18494 8.34667 6.36187C8.27339 6.53881 8.16597 6.69957 8.03055 6.83499C7.89513 6.97041 7.73436 7.07783 7.55743 7.15112C7.3805 7.2244 7.19086 7.26213 6.99935 7.26213ZM6.99935 1.72046C5.91638 1.72046 4.87777 2.15067 4.112 2.91644C3.34622 3.68221 2.91602 4.72082 2.91602 5.80379C2.91602 8.86629 6.99935 13.3871 6.99935 13.3871C6.99935 13.3871 11.0827 8.86629 11.0827 5.80379C11.0827 4.72082 10.6525 3.68221 9.8867 2.91644C9.12093 2.15067 8.08232 1.72046 6.99935 1.72046Z" fill="#3E3E3E"></path>
                                </svg></div>
                                
                                <div>${dealer.address} - ${dealer.distance} ${distanceCopy}</div>
                                
                                </li>
                                
                                <li class="map_item_list_item">
                                
                                <div class="map_item_list_item_icon w-embed"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3.86167 6.29417C4.70167 7.945 6.055 9.29833 7.70583 10.1383L8.98917 8.855C9.1525 8.69167 9.38 8.645 9.58417 8.70917C10.2375 8.925 10.9375 9.04167 11.6667 9.04167C11.8214 9.04167 11.9697 9.10312 12.0791 9.21252C12.1885 9.32192 12.25 9.47029 12.25 9.625V11.6667C12.25 11.8214 12.1885 11.9697 12.0791 12.0791C11.9697 12.1885 11.8214 12.25 11.6667 12.25C9.0366 12.25 6.51426 11.2052 4.65452 9.34548C2.79479 7.48574 1.75 4.9634 1.75 2.33333C1.75 2.17862 1.81146 2.03025 1.92085 1.92085C2.03025 1.81146 2.17862 1.75 2.33333 1.75H4.375C4.52971 1.75 4.67808 1.81146 4.78748 1.92085C4.89687 2.03025 4.95833 2.17862 4.95833 2.33333C4.95833 3.0625 5.075 3.7625 5.29083 4.41583C5.355 4.62 5.30833 4.8475 5.145 5.01083L3.86167 6.29417Z" fill="#3E3E3E"></path>
                                </svg></div>
                                
                                <div><a target="_blank" onclick="window.phoneNumberClickHandler(event)" href="tel:${dealer.phoneNumber}">${window.formatPhoneNumber(dealer.phoneNumber)}</a></div>
                                
                                </li>
        
                                <li>
                                <a href="#" data-map-directions="${dealer.latitude}, ${dealer.longitude}">${directionsCopy}</a>
                                </li>
                                
                                </ul>
                                
                                </div>
        
        
                                            `
                        });

                        marker.addListener('click', () => {
                            if (currentInfoWindow) {
                                currentInfoWindow.close();
                            }
                            infoWindow.open(map, marker);
                            currentInfoWindow = infoWindow;
                            marker.setIcon('https://uploads-ssl.webflow.com/64c57def3601adf69171da07/65e894396b30c86b21522c13_active.svg');
                            li.classList.add('hover');
                        });

                        google.maps.event.addListener(map, 'click', () => {
                            if (currentInfoWindow) {
                                currentInfoWindow.close();
                                currentInfoWindow = null;
                            }
                            marker.setIcon('https://uploads-ssl.webflow.com/64c57def3601adf69171da07/65e894381acc2469159cdc1c_dormant.svg');
                            li.classList.remove('hover');
                        });

                        // Clone the template and populate it with data

                        const li = template.cloneNode(true);

                        li.querySelectorAll('[data-map], [data-map-image], [data-map-distance]').forEach(element => {
                            const key = element.hasAttribute('data-map')
                                ? element.getAttribute('data-map')
                                : element.hasAttribute('data-map-image')
                                    ? element.getAttribute('data-map-image')
                                    : 'distance';

                            if (dealer.hasOwnProperty(key)) {
                                li.setAttribute('data-gtm-content-model', dealer['name']);

                                var directionButton = li.querySelector('[data-map="direction-button"]');
                                if (directionButton) {
                                    directionButton.setAttribute('data-gtm-content-model', dealer['name']);
                                }

                                if (element.hasAttribute('data-map') && element.getAttribute('data-map') === 'phoneNumber') {

                                    let phoneNumber = dealer[key];
                                    if (phoneNumber) {
                                        element.innerHTML = window.formatPhoneNumber(phoneNumber);
                                        element.href = `tel:${dealer[key]}`;
                                        element.onclick = window.phoneNumberClickHandler;
                                    }

                                } else if (element.hasAttribute('data-map')) {
                                    element.innerHTML = dealer[key];
                                } else if (element.hasAttribute('data-map-image')) {
                                    if (dealer[key] && dealer[key].trim() !== '') {
                                        element.src = dealer[key];
                                        element.srcset = dealer[key];
                                    }
                                } else if (element.hasAttribute('data-map-distance')) {
                                    element.textContent = `${dealer[key]} km`;
                                }
                            }

                            // If the element is a direction button, add an event listener
                            if (key === 'direction-button') {
                                element.addEventListener('click', function () {
                                    // We need to make sure the renderer has a map.
                                    directionsRenderer.setMap(map);

                                    destinationLocation = {
                                        lat: dealer.latitude,
                                        lng: dealer.longitude
                                    };
                                    calculateAndDisplayRoute(directionsService, directionsRenderer, userLocation, destinationLocation, google.maps.TravelMode.DRIVING);

                                    lastRequestedDirections = element;

                                    // Simulate a click on the element with the data-maps-directions-open attribute
                                    let openElement = document.querySelector('[data-maps-directions-open]');
                                    if (openElement) {
                                        openElement.click();
                                    }
                                });
                            }
                        });
                        li.addEventListener('click', () => {
                            window.positionMap(marker.getPosition());
                        });

                        // Clear the list before appending the first location
                        if (index === 0) {
                            while (list.firstChild) {
                                list.removeChild(list.firstChild);
                            }
                        }

                        // Append the new list item to the list
                        list.appendChild(li);
                    });

                    // Event listener for UI elements which triggers from the invisible direction button
                    document.addEventListener('click', function (event) {
                        if (event.target.dataset.mapDirections) {
                            destinationLocation = {
                                lat: parseFloat(event.target.dataset.mapDirections.split(',')[0]),
                                lng: parseFloat(event.target.dataset.mapDirections.split(',')[1])
                            };
                            calculateAndDisplayRoute(directionsService, directionsRenderer, userLocation, destinationLocation, google.maps.TravelMode.DRIVING);

                            // Simulate a click on the element with the data-maps-directions-open attribute
                            let openElement = document.querySelector('[data-maps-directions-open]');

                            if (openElement) {
                                openElement.click();
                            }
                        }
                    });

                    document.querySelector('[data-maps-directions-mode]').addEventListener('click', function (event) {
                        if (event.target.tagName === 'BUTTON') {
                            let selectedMode = event.target.id;

                            if (destinationLocation) {
                                calculateAndDisplayRoute(directionsService, directionsRenderer, userLocation, destinationLocation, google.maps.TravelMode[selectedMode]);
                            }
                        }
                    });

                    // When the Directions widget is closed
                    document.querySelector('[data-maps="close-directions"]').addEventListener('click', function (_event) {
                        directionsRenderer.setMap(null);
                        window.positionMap(destinationLocation);
                    });

                    document.body.removeAttribute('data-skeleton-maps');
                });

                initDirections();
            }).catch(error => {
                logError(ERROR_TYPE.API, 'Error within userLocationPromise handling.', error)
            });
        }

        // Create a new script element
        let script = document.createElement('script');

        // Set the source of the script to the Google Maps API
        script.src = `https://maps.googleapis.com/maps/api/js?key=${mapKey}&language=${lang}&callback=initMap`;

        // Append the script element to the body of the document
        document.body.appendChild(script);
    }
})();
