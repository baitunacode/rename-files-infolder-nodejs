const fs = require('fs');
const path = require('path');

async function listFiles (req, res) {
    try {
        const { pathFolder, extFiles } = req.body
        let fileData = [];
        let fileText, result;
        // list of files in the directory
        fs.readdir(pathFolder, function (err, files) {
            fileText = files.filter(el => path.extname(el) === extFiles);
            res.send(fileText); 
        });
    } catch (error) {
        console.log(error);
        res.send(error);
    }
}

async function renameFiles(req, res) {
    try {
        const { pathFolder, searchFiles } = req.body;
        const timeFrom = new Date().getTime();
        let fileData = [];
        let newName;
        let total = 0;
        const dir = fs.readdirSync(pathFolder);
        for (let i = 0; i < dir.length; i++) {
            if(dir[i].includes(searchFiles)){
                newName = dir[i].replace(searchFiles, '');
                fs.renameSync(pathFolder + dir[i], pathFolder + newName);
                fileData.push(newName);
                total = total + 1;
            }
        }
        const timeTo = new Date().getTime();
        const result = {
            status: 'Success',
            code: 200,
            data: {
                filenames: fileData,
                total,
                timeFrom,
                timeTo,
            }
        }
        res.send(result);
    } catch (error) {
        console.log(error);
        res.send(error);
    }
}

module.exports = {
    listFiles,
    renameFiles,
};