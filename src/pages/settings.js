const { ipcMain, BrowserWindow } = require('electron')
const path = require('path')
import fs from 'fs';
import { defaultConfigs } from '../functions';
var window = null;
/*require('electron-reload')(__dirname, {
    electron: require('electron')
});*/


module.exports = function (settings) {
    return new Promise(done => {
        window = new BrowserWindow({
            show: false,
            height: 210,
            width: 350,
            //height: 800,
            //width: 800,
            resizable: true
        })
        window.setMenu(null);
        window.once("close", _ => {
            window = null;
            ipcMain.removeAllListeners("send");
            done(null);
        })
        //window.webContents.openDevTools();
        window.on('ready-to-show',_=>{
            console.log(settings);
            window.webContents.send('settings',{
                settings,
                inputs:defaultConfigs(true)
            });
            window.show();
            
        })
        
        window.setSkipTaskbar(true);

        window.loadURL('file://' + path.join(__dirname, 'settings.html'))
        
        ipcMain.once("send", (event, arg) => {
            if (arg) {
                done(arg);
            }
            window.close();
        })

        ipcMain.on("getData", (event, arg) => {
            /*window.webContents.send('settings',{
                settings,
                inputs:defaultConfigs(true)
            });*/
        })
    })
}
