import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import packa from '../package.json';
import { getWhatsdeskPath } from './functions.js';


const isDirectory = source => fs.lstatSync(source).isDirectory()
const isFile = source => fs.lstatSync(source).isFile()
const getDirectories = source =>
    fs.readdirSync(source).map(name => path.join(source, name)).filter(isDirectory)
const getFiles = source =>
    fs.readdirSync(source).map(name => path.join(source, name)).filter(isFile)

export function getPlugins() {
    let whatsdeskPath = getWhatsdeskPath();
    let dirs = getDirectories(whatsdeskPath);
    let plugins = {
        beforeload: {},
        afterload: {}
    };
    dirs.forEach(dir => {
        if (fs.existsSync(path.join(dir, 'config.json'))) {
            let config = fs.readFileSync(path.join(dir, 'config.json'), "utf8");
            config = JSON.parse(config);
            if (config.main) {
                if (config.load == "beforeload") {
                    plugins.beforeload[config.main] = getFilesPlugin(dir);
                } else if (config.load == "afterload") {

                }
            }
        }
    });
    return plugins;
}

export  function getFilesPlugin($path) {
    let files = {
        js: [],
        css: []
    };
    if (fs.existsSync(path.join($path, "js"))) {
        files.js = getFiles(path.join($path, "js"));
    }
    if (fs.existsSync(path.join($path, "css"))) {
        files.css = getFiles(path.join($path, "css"));
    }
    return files;
}