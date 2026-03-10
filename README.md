# Bilbasen Lease Helper (Chrome Extension)

A small Chrome/Chromium extension that runs on **bilbasen.dk** car listing pages, extracts key values (e.g. *Nypris* and *Restværdi*), and shows a simple set of derived calculations in the extension popup (including a “break even price”).

## What it does

- Scrapes **Nypris** (new price) and **Restværdi** (residual value) from the active Bilbasen tab.
- Displays the extracted values plus derived tax-tier and deduction calculations in the popup.
- Works entirely client-side (content script + popup); no backend.

## Install (unpacked / local dev)

### Requirements

- Node.js 18+ (used for the build script and `jsdom` test)
- Chrome/Chromium (Manifest V3 extension)

1. Install dependencies:

	```bash
	npm install
	```

2. Build the unpacked extension into `dist/`:

	```bash
	npm run build
	```

3. Load into Chrome:

	- Open `chrome://extensions`
	- Enable **Developer mode**
	- Click **Load unpacked**
	- Select the `dist/` folder

## Usage

1. Navigate to a car listing on `https://www.bilbasen.dk/...`.
2. Click the extension icon.
3. The popup will show Nypris/Restværdi and derived values.

If you see “Open a Bilbasen car page.” then the active tab isn’t a supported Bilbasen page or the values couldn’t be detected.

## Development

### Project layout

- `content.js` — content script that extracts Nypris/Restværdi from Bilbasen pages.
- `popup.html`, `popup.js` — popup UI + calculations.
- `manifest.json` — Manifest V3 configuration.
- `scripts/build-dist.mjs` — build script that copies runtime files into `dist/`.

### Rebuilding

Re-run:

```bash
npm run build
```

Then in `chrome://extensions`, click **Reload** on the extension.

## Testing

There’s a small Node-based test that runs the real scraper against a saved Bilbasen HTML file using `jsdom`:

```bash
npm test
```

## Permissions & privacy

From `manifest.json`:

- `host_permissions`: `https://www.bilbasen.dk/*`
- `permissions`: `activeTab`

The extension only reads data from the currently open Bilbasen tab to compute and display the popup values.

## Troubleshooting

- **Popup shows dashes (–)**: the page may not contain Nypris/Restværdi (or Bilbasen changed their DOM). Try another listing.
- **Works on some pages only**: Bilbasen pages can be client-rendered; the scraper retries briefly, but some pages may still not expose the expected fields.

## Contributing

Issues and pull requests are welcome.

When contributing:

- Keep changes small and focused.
- Prefer updating `test-content.mjs` (or adding additional fixtures) when changing the scraper.

## License

No license file is currently included in this repository. If you intend this to be open source, add a `LICENSE` file (for example MIT) and update this section.

## Disclaimer

This project is provided “as is”. Calculations may be incomplete or incorrect and may not reflect current rules or real-world totals.
