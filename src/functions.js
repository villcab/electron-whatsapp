import { app } from 'electron';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import http from 'https';
import semver from 'semver';
import notify from 'electron-main-notification'

import packa from '../package.json';

export function isRunning(win) {
    return app.makeSingleInstance(function (commandLine, workingDirectory) {
        if (win) {
            if (win.isMinimized()) win.restore();
            win.show();
            win.focus();
        }
        return true;
    });
}

export function checkUpdates() {
    return new Promise(done => {
        http.get('https://zerkc.gitlab.io/whatsdesk/update.json', (res) => {
            res.setEncoding('utf8');
            res.on('data', (d) => {
                d = JSON.parse(d);
                if (semver.lt(packa.version, d.version)) {
                    done(true);
                    /*notify("Update", { body: "Update avalible" }, () => {
                        shell.openExternal("https://zerkc.gitlab.io/whatsdesk/");
                    })*/;
                }else{
                    done(false);
                }
            });

        }).on('error', (e) => {
            done(false);
        });
    })
}

export function getWhatsdeskPath() {
    let home = app.getPath('home');
    if (home.indexOf("/snap/") != -1) {
        home = home.substring(0, home.indexOf("/whatsdesk/") + 11) + "current";
    }
    return  path.join(home, ".whatsdesk");;
}

export function isSnap() {
    let home = app.getPath('home');
    return (home.indexOf("/snap/") != -1);
}

export function isRunningQuery(query, ignorePID = -1) {
    return new Promise((done) => {
        let platform = process.platform;
        let cmd = '';
        switch (platform) {
            case 'win32': cmd = `tasklist`; break;
            case 'darwin': cmd = `ps -ax | grep ${query}`; break;
            case 'linux': cmd = `ps -A | grep ${query} `; break;
            default: break;
        }
        exec(cmd, (err, stdout, stderr) => {
            done(stdout.toLowerCase().indexOf(query.toLowerCase()) > -1 && stdout.toLowerCase().indexOf(ignorePID));
        });
    })
}

export function createDefault() {
    let whatsdeskPath = getWhatsdeskPath();
    if (!fs.existsSync(whatsdeskPath)) {
        fs.mkdirSync(whatsdeskPath);
    }
    if(!fs.existsSync(path.join(whatsdeskPath, "settings.json"))){
        let settings = {};
        settings.version = packa.version;
        settings.configs = defaultConfigs();
        fs.writeFileSync(path.join(whatsdeskPath, "settings.json"), JSON.stringify(settings), "utf8");
        return settings;
    }
    let settings = fs.readFileSync(path.join(whatsdeskPath, "settings.json"),"utf8");
    settings = JSON.parse(settings);
    console.log(settings);
    settings.configs = defaultConfigs(settings.configs);
    console.log(settings);
    return settings
}

export function defaultConfigs(obj = {}){
    let configs = {
        general:{
            closeExit:{
                value:false,
                type:"checkbox",
                text:"Close window and Exit",
                tinytext:null
            },
            skipTaskbar:{
                value:false,
                type:"checkbox",
                text:"Skip Taskbar",
                tinyText:"Makes the window not show in the taskbar."
            }
        }
    }
    if(typeof obj == "boolean"){
         if(obj){
             return configs;
         }
    }else{
        return mergeDeep(getPrettyConfig(configs),obj);
    }
}

function getPrettyConfig(configs){
    for(let k in configs){
        let configtag = configs[k];
        for(let ktag in configtag){
            let config = configtag[ktag];
            configtag[ktag] = config.value;
        }
    }
    return configs;
}

function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
  }
  
  /**
   * Deep merge two objects.
   * @param target
   * @param ...sources
   */
function mergeDeep(target, ...sources) {
    if (!sources.length) return target;
    const source = sources.shift();
  
    if (isObject(target) && isObject(source)) {
      for (const key in source) {
        if (isObject(source[key])) {
          if (!target[key]) Object.assign(target, { [key]: {} });
          mergeDeep(target[key], source[key]);
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      }
    }
  
    return mergeDeep(target, ...sources);
}