const fs = require('fs');
const path = require('path');
const jimp = require('jimp');
const ffmpeg = require('ffmpeg');
const fluent = require('fluent-ffmpeg');

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
        const { pathFolder, searchFiles, renameFiles } = req.body;
        const renameWith = renameFiles ? renameFiles : '';
        const timeFrom = new Date().getTime();
        let fileData = [];
        let newName;
        let total = 0;
        const dir = fs.readdirSync(pathFolder);
        for (let i = 0; i < dir.length; i++) {
            if(dir[i].includes(searchFiles)){
                newName = dir[i].replace(searchFiles, renameWith);
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
        let stats, sizes, sizeFile;
        let fileData = [];
        let total = 0;
        const { pathFolderSource, pathFolderDest, searchFiles, size, withMove } = req.body;
        const arrSize = size.split(' ');
        let valueSize = Number(arrSize[0]);
        const labelSize = arrSize[1];
        const startTime = new Date();
        const dir = fs.readdirSync(pathFolderSource);
        for (let i = 0; i < dir.length; i++) {
            valueSize = Number(arrSize[0]);
            stats = fs.lstatSync(`${pathFolderSource}${dir[i]}`);
            if(!stats.isDirectory()){
                sizes = convertBytes(stats.size);
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
                if(stats.size >= valueSize && dir[i].includes(searchFiles)){
                    console.log(`${dir[i]} - ${sizes}`);
                    if(withMove){
                        // rename sudah menghapus file di path source, dipindah ke path dest
                        fs.renameSync(pathFolderSource + dir[i], pathFolderDest + dir[i]);
                    }
                    fileData.push(`${dir[i]} - ${sizes}`);
                    total = total + 1;
                }
            }
        }
        const endTime = new Date();
        const duration = (endTime.getTime() - startTime.getTime()) / 1000;
        const result = {
            status: 'Success',
            code: 200,
            data: {
                filenames: fileData,
                total,
                duration: `${duration} ms`,
            }
        }
        res.send(result);
    } catch (error) {
        console.log(error);
        res.send(error);
    }
}

async function resizeImage (req, res) {
    try {
        const { pathFolderSource, pathFolderDestination, imageQuality } = req.body;
        let fileData = [];
        let total = 0;
        let endTime, duration, startTime, file, stats, statsDest;
        const totalStartTime = new Date();
        const dir = fs.readdirSync(pathFolderSource);
        console.log('Total file with directory: ', dir.length);
        for (let i = 0; i < dir.length; i++) {
            stats = fs.lstatSync(`${pathFolderSource}${dir[i]}`);
            if(!stats.isDirectory()){
                startTime = new Date();
                total += 1;
                await jimp.read(`${pathFolderSource}${dir[i]}`)
                .then(image => {
                    return image
                        .quality(imageQuality)
                        .write(`${pathFolderDestination}${dir[i]}`);
                })
                .catch(err => {
                    console.log(err);
                })
                endTime = new Date();
                duration = (endTime.getTime() - startTime.getTime()) / 1000;
                // statsDest = fs.lstatSync(`${pathFolderDestination}${dir[i]}`);
                file = `${pathFolderSource}${dir[i]} - ${duration} ms - ${convertBytes(stats.size)}`;
                fileData.push(file);
                console.log(`${i+1} -> ${file}`);
            }
        }
        const totalEndTime = new Date();
        const totalDuration = totalEndTime.getTime() - totalStartTime.getTime();
        const diffMins = Math.round(((totalDuration % 86400000) % 3600000) / 60000); // minutes
        const result = {
            status: 'Success',
            code: 200,
            data: {
                filenames: fileData,
                total,
                duration: `${diffMins} minutes` 
            }
        }
        console.log('result', result);
        res.send(result);
    } catch (error) {
        console.log(error);
        res.send(error);
    }
}

async function resizeVideo (req, res) {
    try {
        const { pathFolderSource, pathFolderDestination, videoName } = req.body;
        const process = await new ffmpeg(`${pathFolderSource}${videoName}`);
        console.log(process.metadata);
        console.log(process.info_configuration);
        process
            .setVideoSize('640x?', true, true, '#fff')
		    .setAudioChannels(2)
            .save(`${pathFolderDestination}${videoName}`)
        
        // fluent(`${pathFolderSource}${videoName}`)
        //     // Generate 720P video
        //     .output(`${pathFolderSource}test-1280x720.mp4`)
        //     .videoCodec('libx264')  
        //     .noAudio()
        //     .size('1280x720')
		  
		//     // Generate 1080P video
		//     .output(`${pathFolderDestination}test-1920x1080.mp4`)
		//     .videoCodec('libx264')
		//     .noAudio()
		//     .size('1920x1080')

        //     .on('error', function(err) {
        //         console.log('An error occurred: ' + err.message);
                
        //     })	
        //     .on('progress', function(progress) { 
        //         console.log('... frames: ' + progress.frames);
                
        //     })
        //     .on('end', function() { 
        //         console.log('Finished processing'); 
                
        //     })
        //     .run();
        res.send("Successfully");
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
    resizeImage,
    resizeVideo,
};