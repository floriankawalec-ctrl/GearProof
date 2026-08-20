/* eslint-disable @typescript-eslint/no-require-imports */
const { app, BrowserWindow, session, shell } = require("electron");
const path = require("node:path");

const APP_URL = "https://gearproof-test.florian-kawalec.chatgpt.site/?desktop=1";
const APP_ORIGIN = "https://gearproof-test.florian-kawalec.chatgpt.site";

function createWindow() {
  const window = new BrowserWindow({
    title: "GearProof",
    width: 1280,
    height: 820,
    minWidth: 980,
    minHeight: 680,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: "#F3F4EF",
    icon: path.join(__dirname, "../assets/icon.ico"),
    webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true, webSecurity: true }
  });

  window.webContents.setUserAgent(`${window.webContents.getUserAgent()} GearProofDesktop/0.1.0`);
  window.once("ready-to-show", () => window.show());
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith(APP_ORIGIN)) return { action: "allow" };
    void shell.openExternal(url);
    return { action: "deny" };
  });
  window.webContents.on("will-navigate", (event, url) => {
    if (url.startsWith(APP_ORIGIN)) return;
    event.preventDefault();
    void shell.openExternal(url);
  });
  void window.loadURL(APP_URL);
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionCheckHandler((_webContents, permission, requestingOrigin) => permission === "media" && requestingOrigin.startsWith(APP_ORIGIN));
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => callback(permission === "media" && webContents.getURL().startsWith(APP_ORIGIN)));
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on("window-all-closed", () => app.quit());
