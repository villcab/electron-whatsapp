//solo para hacer un cambio
const { ipcRenderer } = require("electron");
const path = require('path');
let _Notification = window.Notification
let notificationsCount = 1;
window.Notification = function (name, props) {
    let n = new _Notification(name, props);
    n.__id = notificationsCount++;
    ipcRenderer.send("notifications", n.__id);
    setTimeout(() => {
        n._onclick = n.onclick;
        n.onclick = function (evt) {
            ipcRenderer.send("notification:click", true);
            if (n._onclick) n._onclick.call(this, evt);
        }

    }, 500)
    n._close = n.close;
    n.close = function () {
        ipcRenderer.send("notification:close", n.__id);
        n._close.apply(this, arguments);
    }
    return n;
}
Notification.requestPermission = _Notification.requestPermission
Notification.permission = _Notification.permission;
