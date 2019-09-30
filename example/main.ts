import { app, BrowserView, BrowserWindow, Menu, MenuItem } from 'electron';

let mainWindow: Electron.BrowserWindow | null = null;

//wire context menu event from browserview's web contents, display suggestion if available.
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
      const entry = `window.${process.env.ENTRY === 'browserWindow' ? 'browserWindowProvider' : 'browserViewProvider'}`;
      const code = `${entry}.getSuggestion(\`${p.misspelledWord}\`)`;
      const suggestion = await wnd!.webContents.executeJavaScript(code);
      suggestion.forEach((value: string) => {
        let item = new MenuItem({
          label: value,
          click: () => wnd!.webContents.replaceMisspelling(value)
        });

        menu.append(item);
      });

      menu.append(
        new MenuItem({
          label: 'Add to dictionary',
          click: () => wnd!.webContents.executeJavaScript(`${entry}.addWord(\`${p.misspelledWord}\`)`)
        })
      );
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

  mainWindow.loadURL(`file://${__dirname}/${process.env.ENTRY}.html`);

  if (process.env.ENTRY === 'browserWindow') {
    setContextMenuEventHandler(mainWindow!);
  }

  //Example logic for browser view
  if (process.env.ENTRY === 'browserView') {
    const view = new BrowserView({
      //nodeIntegration is enabled only for simple example. do not follow this in production.
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        preload: require.resolve('./browserView-preload')
      }
    });
    mainWindow.setBrowserView(view);
    view.setBounds({ x: 0, y: 80, width: 1024, height: 768 });
    view.setAutoResize({ width: true, height: true, horizontal: true, vertical: true });
    view.webContents.loadURL('http://html.com/tags/textarea/#Code_Example');

    setTimeout(() => {
      view.webContents.openDevTools();
    }, 2000);

    setContextMenuEventHandler(view);
  }
});
