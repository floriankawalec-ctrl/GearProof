# GearProof

Free and open-source hardware diagnostics for Windows and the web.

GearProof tests:

- mouse buttons, wheel and movement gaps;
- keyboard keys and repeat events;
- controller buttons, sticks and drift;
- left/right audio channels and microphone input;
- a printable local test report with repair suggestions.

No account, subscription or payment is required. Test results remain in local browser storage and microphone audio is not uploaded.

## Use GearProof

- Web app: <https://gearproof-test.florian-kawalec.chatgpt.site>
- Windows: download the latest installer from this repository's Releases page.

## Run the website locally

Requirements: Node.js 22 or newer.

```bash
npm ci
npm run dev
```

## Build the Windows app

```bash
cd desktop-electron
npm install
npm run dist:windows
```

The Windows application displays the hosted GearProof interface in a locked-down Electron window. Hardware results are stored locally on that computer.

## License

[MIT](LICENSE)
