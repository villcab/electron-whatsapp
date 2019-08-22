const {app, BrowserWindow, ipcMain, Menu, shell, Tray} = require('electron')
const fs = require('fs')
const path = require('path')
const notify = require('electron-main-notification')
const windowStateKeeper = require('electron-window-state')

const windowSettings = require('./pages/settings')
const {checkUpdates, createDefault, getWhatsdeskPath, isRunning} = require('./functions.js')
const {getPlugins} = require('./plugins')

//import playsound from './sounds/sound';

let notificationsActives = [];
let injectScripts = [
  "unregisterservices.js",
  "loadscript.js",
  "notifications.js",
  "links.js",
  "menucontextual.js"
];
let win = null;
let appIcon = null;
let settings = createDefault();

process.title = 'WhatsDesk';

app.on("ready", async _ => {
  let iShouldQuit = isRunning(win);
  if (iShouldQuit) {
    console.log("whatsdesk is running")
    app.quit();
    process.exit(0);
    return;
  }
  let plugins = getPlugins();
  checkUpdates().then(update => {
    if (update) {
      notify("Update", {body: "Update avalible"}, () => {
        shell.openExternal("https://zerkc.gitlab.io/whatsdesk/");
      });
    }
  })

  let mainWindowState = windowStateKeeper({
    defaultWidth: 1000,
    defaultHeight: 800
  })

  //globalShortcut.register('CommandOrControl+Q', () => { })
  appIcon = new Tray(path.join(__dirname, "icon", "tray_whatsapp_rest.png"));
  win = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    show: false,
    icon: path.join(__dirname, "icon", "whatsapp.png"),
    skipTaskbar: (settings.configs.general && settings.configs.general.skipTaskbar),
    webPreferences: {
      experimentalFeatures: true
    }
  });

  mainWindowState.manage(win)

  win.setMenu(null);
  win.loadURL("https://web.whatsapp.com/", {
    userAgent: win.webContents.getUserAgent().replace(/(Electron|whatsdesk)\/([0-9\.]+)\ /gi, "")
  });
  //win.webContents.openDevTools();
  win.on('ready-to-show', () => {
    win.show();
    for (let state in plugins) {
      for (let pname in plugins[state]) {
        let plugin = plugins[state][pname];
        plugin.js.forEach(js => {
          let script = fs.readFileSync(js, "utf8");
          win.webContents.executeJavaScript(script);
        });
      }
    }
    win.webContents.executeJavaScript(`_beforeload = ${JSON.stringify(Object.keys(plugins.beforeload))}`);
    win.webContents.executeJavaScript(`_afterload = ${JSON.stringify(Object.keys(plugins.afterload))}`);
    for (let scriptName of injectScripts) {
      let script = fs.readFileSync(path.join(__dirname, "scripts", scriptName), "utf8");
      win.webContents.executeJavaScript(script);
    }

  });
  win.on('page-title-updated', (evt, title) => {
    evt.preventDefault()
    title = title.replace(/(\([0-9]+\) )?.*/, "$1WhatsDesk");
    win.setTitle(title);
    appIcon.setToolTip(title);
    if (/\([0-9]+\)/.test(title)) {
      showNotification();
    } else {
      destroyNotification();
    }
  })
  win.on("focus", () => {
    destroyNotification();
    notificationsActives = [];
  });
  win.on('show', () => {
    appIcon.setHighlightMode('always')
  })
  win.on('hide', () => {
    appIcon.setHighlightMode('never')
  })
  win.on('close', function (event) {
    if (settings.configs.general && !settings.configs.general.closeExit) {
      event.preventDefault();
      win.hide();
    } else {
      app.quit();
      process.exit(0);
    }
  });

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show/Hide WhatsDesk', click: function () {
        win.isVisible() ? win.hide() : win.show()
      }
    },
    {
      label: 'Quit', click: function () {
        win.destroy();
        app.quit();
        process.exit(0);
      }
    }
  ])
  appIcon.on('click', () => {
    win.isVisible() ? win.hide() : win.show()
  })

  // Make a change to the context menu
  contextMenu.items[1].checked = false
  appIcon.setToolTip('WhatsDesk')

  // Call this again for Linux because we modified the context menu
  appIcon.setContextMenu(contextMenu)


  win.webContents.on('will-navigate', handleRedirect)
  win.webContents.on('new-window', handleRedirect)
  const menu = Menu.buildFromTemplate([
    {
      label: 'Tools',
      submenu: [
        {
          label: 'settings',
          click() {
            windowSettings(settings.configs).then(saveConfigs);
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'show/hide Menu',
          accelerator: "CommandOrControl+h",
          click() {
            win.setMenuBarVisibility(!win.isMenuBarVisible())
            win.setAutoHideMenuBar(!win.isMenuBarVisible())
          }
        }
      ]
    }
    /*{
        label: 'Help',
        submenu: [
            {
              label: 'Report a Problem... (gitlab)',
              click(){
                shell.openExternal("https://gitlab.com/zerkc/whatsdesk/issues/new");
              }
            }
        ]
    }*/
  ])
  win.setMenu(menu);
})

function handleRedirect(e, url) {
  if (!url.startsWith("https://web.whatsapp.com/")) {
    e.preventDefault()
    shell.openExternal(url)
  }
}

function showNotification() {
  win.flashFrame(true);
  appIcon.setImage(path.join(__dirname, "icon", "tray_whatsapp_active.png"))
}

function destroyNotification() {
  win.flashFrame(false);
  appIcon.setImage(path.join(__dirname, "icon", "tray_whatsapp_rest.png"))
}

ipcMain.on('notifications', (event, arg) => {
  //playsound();
  if (!win.isFocused()) {
    notificationsActives.push(arg);
    showNotification();
  }
  event.sender.send('notification:new', true);
})
/*ipcMain.on('notification:close', (event, arg) => {
    let index = notificationsActives.indexOf(arg);
    if (index >= 0) {
        notificationsActives.splice(index, 1);
    }
    if (notificationsActives.length == 0) {
        destroyNotification();
    }
})*/
ipcMain.on('notification:click', (event, arg) => {
  win.show();
  win.focus();
  event.sender.send('notification:new', true);
})

function saveConfigs(configs) {
  if (!configs) return;
  let whatsdeskPath = getWhatsdeskPath();
  Object.assign(settings.configs, configs);
  fs.writeFileSync(path.join(whatsdeskPath, "settings.json"), JSON.stringify(settings), "utf8");
}
