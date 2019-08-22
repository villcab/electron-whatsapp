const { ipcMain, BrowserWindow } = require('electron')
const path = require('path')
import fs from 'fs';

var window = null
var callbacks = {}

module.exports = function () {
  if (window) return playsound()

  window = new BrowserWindow({
    show: false
  })
  window.loadURL('file://' + path.join(__dirname, '/fake-browser.html'))
  window.on('ready-to-show', () => {
    playsound()
  })
}

function playsound () {
    let audio = base64_encode(path.join(__dirname,"sound.mp3"));
    window.webContents.send('playsound', "data:audio/ogg;base64,"+audio);
}
function base64_encode(file) {
    // read binary data
    var bitmap = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    return new Buffer(bitmap).toString('base64');
}
