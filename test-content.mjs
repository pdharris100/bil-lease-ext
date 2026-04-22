// test-content.mjs
// Runs the real Bilbasen VIP scraper from content.js against a saved VIP HTML page.

import fs from 'node:fs';
import assert from 'node:assert/strict';
import { JSDOM, VirtualConsole } from 'jsdom';

const html = fs.readFileSync(
    new URL('./Brugt Porsche Taycan 4S Performance+ 4d - Bilbasen.txt', import.meta.url),
    'utf8'
);

// Silence noisy CSS parsing errors from the saved page HTML.
const virtualConsole = new VirtualConsole();
virtualConsole.on('jsdomError', (err) => {
    if (err?.message?.includes('Could not parse CSS stylesheet')) return;
    // Forward other jsdom errors to stderr to avoid hiding real problems.
    console.error(err);
});

const dom = new JSDOM(html, {
    runScripts: 'outside-only',
    virtualConsole,
});

const { window } = dom;

// Stub chrome APIs used by the content script.
window.chrome = { runtime: { onMessage: { addListener: () => { } } } };

// Load and execute the real content script in the jsdom window.
const contentScript = fs.readFileSync(new URL('./content.js', import.meta.url), 'utf8');
window.eval(contentScript);

assert.equal(typeof window.getDetails, 'function', 'content.js should define getDetails()');

const details = await new Promise((resolve) => {
    window.getDetails({ action: 'getDetails' }, {}, resolve);
});

assert.ok(details && typeof details === 'object', 'getDetails() should respond with an object');
assert.equal(details.nypris, 1233072);
assert.equal(details.restvaerdi, 480000);

console.log('Test passed: extracted nypris and restvaerdi.');
