import { app, BrowserWindow } from 'electron';

let mainWindow: Electron.BrowserWindow | null = null;

app.on('window-all-closed', () => {
  app.quit();
});

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768
  });

  mainWindow.loadURL(`file://${__dirname}/index.html`);
  mainWindow.addListener('show', (e: Electron.Event) => e.sender.openDevTools());
});
