const { app, BrowserWindow, ipcMain, Menu, shell, Tray } = require('electron')
const path = require('path')
const fs = require('fs')
const notify = require('electron-main-notification')
const windowStateKeeper = require('electron-window-state')

const windowSettings = require('./pages/settings')
const { checkUpdates, createDefault, getWhatsdeskPath, isRunning } = require('./functions.js')
const { getPlugins } = require('./plugins')

//import playsound from './sounds/sound';

let notificationsActives = [];
let injectScripts = ["unregisterservices.js", "loadscript.js", "notifications.js", "links.js", "menucontextual.js"];
let mainWindow;
let appIcon;
let settings = createDefault();

process.title = 'WhatsApp';
let whatsappUrl = 'https://web.whatsapp.com/';

app.on("ready", async _ => {
    let iShouldQuit = isRunning(mainWindow);
    if (iShouldQuit) {
        console.log("WhatsApp is running")
        app.quit();
        process.exit(0);
        return;
    }
    let plugins = getPlugins();
    checkUpdates().then(update => {
        if (update) {
            notify("Update", { body: "Update avalible" }, () => {
                shell.openExternal("https://zerkc.gitlab.io/whatsdesk/");
            });
        }
    })

    let mainWindowState = windowStateKeeper({
        defaultWidth: 1000,
        defaultHeight: 700
    })

    //globalShortcut.register('CommandOrControl+Q', () => { })
    appIcon = new Tray(path.join(__dirname, "icon", "tray_whatsapp_rest.png"));
    mainWindow = new BrowserWindow({
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

    mainWindowState.manage(mainWindow)

    mainWindow.setMenu(null);
    mainWindow.loadURL(whatsappUrl, {
        userAgent: mainWindow.webContents.getUserAgent().replace(/(Electron|whatsapp)\/([0-9\.]+)\ /gi, "")
    });
    //win.webContents.openDevTools();
    mainWindow.on('ready-to-show', () => {
        mainWindow.show();
        for (let state in plugins) {
            for (let pname in plugins[state]) {
                let plugin = plugins[state][pname];
                plugin.js.forEach(js => {
                    let script = fs.readFileSync(js, "utf8");
                    mainWindow.webContents.executeJavaScript(script);
                });
            }
        }
        mainWindow.webContents.executeJavaScript(`_beforeload = ${JSON.stringify(Object.keys(plugins.beforeload))}`);
        mainWindow.webContents.executeJavaScript(`_afterload = ${JSON.stringify(Object.keys(plugins.afterload))}`);
        for (let scriptName of injectScripts) {
            let script = fs.readFileSync(path.join(__dirname, "scripts", scriptName), "utf8");
            mainWindow.webContents.executeJavaScript(script);
        }

    });
    mainWindow.on('page-title-updated', (evt, title) => {
        evt.preventDefault()
        title = title.replace(/(\([0-9]+\) )?.*/, "$1WhatsApp");
        mainWindow.setTitle(title);
        appIcon.setToolTip(title);
        if (/\([0-9]+\)/.test(title)) {
            showNotification();
        } else {
            destroyNotification();
        }
    })
    mainWindow.on("focus", () => {
        destroyNotification();
        notificationsActives = [];
    });
    mainWindow.on('show', () => {
        appIcon.setHighlightMode('always')
    })
    mainWindow.on('hide', () => {
        appIcon.setHighlightMode('never')
    })
    mainWindow.on('close', function (event) {
        if (settings.configs.general && !settings.configs.general.closeExit) {
            event.preventDefault();
            mainWindow.hide();
        } else {
            app.quit();
            process.exit(0);
        }
    });

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show/Hide WhatsApp', click: function () {
                mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()
            }
        },
        {
            label: 'Quit', click: function () {
                mainWindow.destroy();
                app.quit();
                process.exit(0);
            }
        }
    ])
    appIcon.on('click', () => {
        mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()
    })

    // Make a change to the context menu
    contextMenu.items[1].checked = false
    appIcon.setToolTip('WhatsApp')

    // Call this again for Linux because we modified the context menu
    appIcon.setContextMenu(contextMenu)


    mainWindow.webContents.on('will-navigate', handleRedirect)
    mainWindow.webContents.on('new-window', handleRedirect)
    const menu = Menu.buildFromTemplate([
        {
            label: 'Tools',
            submenu: [
                {
                    label: 'Settings',
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
                    label: 'Show/Hide Menu',
                    accelerator: "CommandOrControl+h",
                    click() {
                        mainWindow.setMenuBarVisibility(!mainWindow.isMenuBarVisible())
                        mainWindow.setAutoHideMenuBar(!mainWindow.isMenuBarVisible())
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
    mainWindow.setMenu(menu);
})

function handleRedirect(e, url) {
    if (!url.startsWith(whatsappUrl)) {
        e.preventDefault()
        shell.openExternal(url)
    }
}

function showNotification() {
    mainWindow.flashFrame(true);
    appIcon.setImage(path.join(__dirname, "icon", "tray_whatsapp_active.png"))
}

function destroyNotification() {
    mainWindow.flashFrame(false);
    appIcon.setImage(path.join(__dirname, "icon", "tray_whatsapp_rest.png"))
}

ipcMain.on('notifications', (event, arg) => {
    //playsound();
    if (!mainWindow.isFocused()) {
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
    mainWindow.show();
    mainWindow.focus();
    event.sender.send('notification:new', true);
})

function saveConfigs(configs) {
    if (!configs) return;
    let whatsdeskPath = getWhatsdeskPath();
    Object.assign(settings.configs, configs);
    fs.writeFileSync(path.join(whatsdeskPath, "settings.json"), JSON.stringify(settings), "utf8");
}
