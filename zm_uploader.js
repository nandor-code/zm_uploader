
'use strict';

const fs = require('fs');
const util = require('util');
const chokidar = require('chokidar');

// AWS config.
const awsCreds = JSON.parse(fs.readFileSync('./aws.json'));
const AWS = require('aws-sdk');
const s3 = new AWS.S3(awsCreds);
const ssm = new AWS.SSM(awsCreds);

var uploadBucket = "Unknown";

ssm.getParameter( { Name: 'slack_door_bell_bucket' }, function(err,data) { uploadBucket = data.Parameter.Value; console.log("Got upload Bucket:", uploadBucket); } );

const configObj = JSON.parse(fs.readFileSync('./zm_uploader_config.json'));
const config = configObj.config;

console.log("Using Config: ");
console.log(config);
console.log("==============");


// file watcher
var watcher = chokidar.watch(config.IMGPATH, {ignored: [ /.*log/, /^\./, /^.*mp4/ ], persistent: true, ignoreInitial: true});

var files = {}
var uploads = 0;
var reportTime = Date.now();

watcher
  .on('add', function(path) {console.log('File', path, 'has been added');})
  .on('change', function(path) {console.log('File', path, 'has been changed'); files[path] = Date.now(); })
  .on('unlink', function(path) {console.log('File', path, 'has been removed');})
  .on('error', function(error) {console.error('Error happened', error);})

setTimeout( checkUploads, 1 );

function checkUploads()
{
    if( (Date.now() - reportTime) / 1000 > config.REPORT_SEC ) 
    {
        console.log("Checking for uploads (" + uploads + " proccessed so far)");
        reportTime = Date.now();
    }

    for( var f in files )
    {
	var changeSec = ( (Date.now() - files[f]) / 1000 );
        //console.log( "file " + f + " last changed " + ( changeSec ) + " seconds ago" );
	if( changeSec >= config.STALE_FILE_UPLOAD_SEC )
        {
            uploadToS3( f );
	    delete files[f];
        }
    }
    return setTimeout(checkUploads, config.UPDATE_INTERVAL);
}

const uploadToS3 = ( file ) => {

    const fileContent = fs.readFileSync(file);
    const params = {
        Bucket: uploadBucket,
        Key: 'snapshot.jpg',
        Body: fileContent
    };

    console.log("Uploading " + file + " to " + uploadBucket );

    // Actual upload.
    return new Promise((resolve, reject) => {
        s3.putObject(params, (error, result) => {
            if (error) {
                reject(error);
            } else {
                uploads++;
                resolve(result);
            }
        });
    });
};
