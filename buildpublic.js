const package = require("./package.json");
const fs = require("fs");
const del = require('del');
const copy = require('copy');
const crypto = require('crypto');
let update = {};

update.name = package.name;
update.version = package.version;
update.description = package.description;

if (!fs.existsSync("page")) {
    fs.mkdirSync("page")
}

del.sync("./page/whatsapp_*.deb");
copy(`./dist/whatsapp_${package.version}_*.deb`, "./page/", (a, files) => {
    update.file = files[0].basename;
    let data = fs.readFileSync(`./page/${update.file}`);
    let checksum = generateChecksum(data);
    update.sha512 = checksum;
    fs.writeFileSync("./page/update.json", JSON.stringify(update), "utf-8");
    let script  = fs.readFileSync("./pagedownload.js","utf-8");
    script = script.replace(/\%\%namebase\%\%/g,update.name);
    script = script.replace(/\%\%version\%\%/g,update.version);
    script = script.replace(/\%\%86\%\%/g,"i386");
    script = script.replace(/\%\%64\%\%/g,"amd64");
    fs.writeFileSync("./page/page.js", script, "utf-8");
    function generateChecksum(str, algorithm, encoding) {
        return crypto
            .createHash(algorithm || 'sha512')
            .update(str, 'utf8')
            .digest(encoding || 'hex');
    }
});
