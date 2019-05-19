import { app, BrowserView, BrowserWindow, Menu, MenuItem } from 'electron';

let mainWindow: Electron.BrowserWindow | null = null;

//NOTE: CONTEXT MENU CREATION IN EXAMPLE IS PURELY EXAMPLE PURPOSE ONLY, NOT A RECOMMENDED PRACTICE
const setContextMenuEventHandler = (wnd: Electron.BrowserView | Electron.BrowserWindow) => {
  wnd.webContents.addListener('context-menu', async (_e: Electron.Event, p: any) => {
    const menu = new Menu();
    const isTextInput = p.isEditable || (p.inputFieldType && p.inputFieldType !== 'none');
    if (!isTextInput) {
      menu.append(new MenuItem({ label: 'no text input detected' }));
    } else if (!p.misspelledWord || p.misspelledWord.length < 1) {
      menu.append(new MenuItem({ label: 'no spelling correction suggestion' }));
    } else {
      const code = `window.provider.getSuggestion(\`${p.misspelledWord}\`)`;
      const suggestion = await wnd!.webContents.executeJavaScript(code);
      suggestion.forEach((value: string) => {
        let item = new MenuItem({
          label: value,
          click: () => wnd!.webContents.replaceMisspelling(value)
        });

        menu.append(item);
      });
    }

    menu.popup({ window: mainWindow! });
  });
};

app.on('window-all-closed', () => {
  app.quit();
});

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    //nodeIntegration is enabled only for simple example. do not follow this in production.
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  const view = new BrowserView({
    //nodeIntegration is enabled only for simple example. do not follow this in production.
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: require.resolve('./worker-preload')
    }
  });
  mainWindow.setBrowserView(view);

  view.setBounds({ x: 0, y: 80, width: 1024, height: 768 });
  view.setAutoResize({ width: true, height: true });
  view.webContents.loadURL('http://html.com/tags/textarea/#Code_Example');

  setTimeout(() => {
    view.webContents.openDevTools();
  }, 2000);

  setContextMenuEventHandler(view);
});
