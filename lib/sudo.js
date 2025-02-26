const path = require("path");
const fs = require('fs');
const {getSudoList} = require('./commandHandler.js')
let dbPath = path.join(__dirname,".","database","sudo.json")
const addSudo = (number) => {
    const sudoList = getSudoList();
    if (!sudoList.includes(number)) {
        sudoList.push(number);
        fs.writeFileSync(dbPath, JSON.stringify(sudoList, null, 2));
    }
};

 
const removeSudo = (number) => {
    let sudoList = getSudoList();
    sudoList = sudoList.filter((n) => n !== number);
    fs.writeFileSync(dbPath, JSON.stringify(sudoList, null, 2));
};

const isAlreadySudo = (number) => {
    const sudoList = getSudoList();
    return sudoList.includes(number);
};

module.exports = { addSudo, removeSudo, isAlreadySudo };