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

async function moveFileWithSize (req, res) {
    try {
        let stats, sizes, sizeFile, valueSize, labelSize;
        let fileData = [];
        let total = 0;
        const { pathFolderSource, pathFolderDest, searchFiles, size, withMove } = req.body;
        const dir = fs.readdirSync(pathFolderSource);
        for (let i = 0; i < dir.length; i++) {
            if(searchFiles){
                if(dir[i].includes(searchFiles)){
                    stats = fs.statSync(dir[i]);
                    sizes = convertBytes(stats.size);
                    console.log('stats', `${dir[i]} - ${sizes}`);
                    fileData.push(`${dir[i]} - ${sizes}`);
                    total = total + 1;
                }
            }else{
                stats = fs.lstatSync(`${pathFolderSource}${dir[i]}`);
                if(!stats.isDirectory()){
                    sizes = convertBytes(stats.size);
                    arrSize = size.split(' ');
                    valueSize = Number(arrSize[0]);
                    labelSize = arrSize[1];
                    switch (labelSize) {
                        case 'KB':
                            valueSize = valueSize * 1024;
                            break;
                        case 'MB':
                            valueSize = valueSize * 1024 * 1024;
                            break;
                        case 'GB':
                            valueSize = valueSize * 1024 * 1024 * 1024;
                            break;
                        case 'TB':
                            valueSize = valueSize * 1024 * 1024 * 1024 * 1024;
                            break;
                        default:
                            valueSize = valueSize;
                            break;
                    }
                    if(stats.size >= valueSize ){
                        console.log('stats', `${dir[i]} - ${sizes}`);
                        if(withMove){
                            // rename sudah menghapus file di path source, dipindah ke path dest
                            fs.renameSync(pathFolderSource + dir[i], pathFolderDest + dir[i]);
                        }
                        fileData.push(`${dir[i]} - ${sizes}`);
                        total = total + 1;
                    }
                }
            }
        }
        const result = {
            status: 'Success',
            code: 200,
            data: {
                filenames: fileData,
                total,
            }
        }
        res.send(result);
    } catch (error) {
        console.log(error);
        res.send(error);
    }
}

const convertBytes = function(bytes) {
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  
    if (bytes == 0) {
      return "n/a"
    }
  
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))
  
    if (i == 0) {
      return bytes + " " + sizes[i]
    }
  
    return (bytes / Math.pow(1024, i)).toFixed(1) + " " + sizes[i]
}

module.exports = {
    listFiles,
    renameFiles,
    moveFileWithSize,
};