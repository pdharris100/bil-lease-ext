console.log("Registering listener in content script");
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.action === "getDetails") {
            getDetails(request, sender, sendResponse);
            // this is required to use sendResponse asynchronously
            return true;
        }
    }
);

function getDetails(request, sender, sendResponse) {
    const normalizeWhitespace = (value) => (value ?? '').replace(/\s+/g, ' ').trim();

    const normalizeKey = (value) => normalizeWhitespace(value).toLowerCase().replace(/æ/g, 'ae');

    const parsePriceDkk = (priceText) => {
        const digitsOnly = (priceText ?? '').replace(/[^0-9]/g, '');
        if (!digitsOnly) return NaN;
        return parseInt(digitsOnly, 10);
    };

    const extractJsonObjectAfter = (scriptText, marker) => {
        const idx = (scriptText ?? '').indexOf(marker);
        if (idx === -1) return '';

        const eqIdx = scriptText.indexOf('=', idx);
        if (eqIdx === -1) return '';

        const start = scriptText.indexOf('{', eqIdx);
        if (start === -1) return '';

        let depth = 0;
        let inString = false;
        let quote = '';
        let escape = false;

        for (let i = start; i < scriptText.length; i++) {
            const ch = scriptText[i];

            if (inString) {
                if (escape) {
                    escape = false;
                    continue;
                }
                if (ch === '\\') {
                    escape = true;
                    continue;
                }
                if (ch === quote) {
                    inString = false;
                    quote = '';
                }
                continue;
            }

            if (ch === '"' || ch === "'") {
                inString = true;
                quote = ch;
                continue;
            }

            if (ch === '{') {
                depth++;
                continue;
            }

            if (ch === '}') {
                depth--;
                if (depth === 0) return scriptText.slice(start, i + 1);
            }
        }

        return '';
    };

    const tryParseProps = () => {
        const scripts = Array.from(document.querySelectorAll('script'));
        for (const script of scripts) {
            const text = script.textContent ?? '';
            if (!text.includes('_props')) continue;
            if (!text.includes('var _props')) continue;

            const jsonText = extractJsonObjectAfter(text, 'var _props');
            if (!jsonText) continue;

            try {
                return JSON.parse(jsonText);
            } catch {
                return null;
            }
        }

        return null;
    };

    let cachedProps = null;
    let hasCachedProps = false;
    const getProps = () => {
        if (hasCachedProps) return cachedProps;
        const props = tryParseProps();
        if (props) {
            cachedProps = props;
            hasCachedProps = true;
            return cachedProps;
        }
        return null;
    };

    const extractNyprisFromProps = (props) => {
        const modelInfo = props?.listing?.vehicle?.modelInformation;
        if (!Array.isArray(modelInfo)) return null;

        const row = modelInfo.find((r) => normalizeKey(r?.name) === 'nypris');
        const value = parsePriceDkk(normalizeWhitespace(row?.displayValue));
        return Number.isFinite(value) ? value : null;
    };

    const extractRestvaerdiFromProps = (props) => {
        const leasingDetails = props?.listing?.leasing?.details;
        if (!Array.isArray(leasingDetails)) return null;

        const row = leasingDetails.find((r) => normalizeKey(r?.name) === 'restvaerdi');
        const value = parsePriceDkk(normalizeWhitespace(row?.displayValue));
        return Number.isFinite(value) ? value : null;
    };

    const extractNypris = (props) => {
        const fromProps = extractNyprisFromProps(props);
        if (fromProps !== null) return fromProps;

        const table = document.querySelector('table[data-e2e="model-information-table-preview"]');
        if (!table) return null;

        const rows = Array.from(table.querySelectorAll('tr'));
        for (const row of rows) {
            const headerText = normalizeWhitespace(row.querySelector('th')?.textContent);
            if (!headerText) continue;
            if (!headerText.toLowerCase().startsWith('nypris')) continue;

            const valueText = normalizeWhitespace(row.querySelector('td')?.textContent);
            const value = parsePriceDkk(valueText);
            return Number.isFinite(value) ? value : null;
        }

        return null;
    };

    const extractRestvaerdi = (props) => {
        const fromProps = extractRestvaerdiFromProps(props);
        if (fromProps !== null) return fromProps;

        const items = Array.from(document.querySelectorAll('[data-e2e="leasing-offer-detail"]'));
        for (const item of items) {
            const label = normalizeKey(item.querySelector('[data-e2e="leasing-offer-detail-label"]')?.textContent);
            if (label !== 'restvaerdi') continue;

            const valueText = normalizeWhitespace(item.querySelector('[data-e2e="leasing-offer-detail-value"]')?.textContent);
            const value = parsePriceDkk(valueText);
            return Number.isFinite(value) ? value : null;
        }

        return null;
    };

    // Bilbasen pages can be client-rendered; retry briefly if details aren't in the DOM yet.
    const maxWaitMs = 3000;
    const intervalMs = 200;
    const start = Date.now();

    const respondWhenReady = () => {
        const props = getProps();
        const nypris = extractNypris(props);
        const restvaerdi = extractRestvaerdi(props);

        const timedOut = Date.now() - start >= maxWaitMs;
        if ((nypris !== null && restvaerdi !== null) || timedOut) {
            sendResponse({ nypris, restvaerdi });
            return;
        }

        setTimeout(respondWhenReady, intervalMs);
    };

    respondWhenReady();
}
