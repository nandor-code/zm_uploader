
'use strict';

// Logger. 
const logger = require('./logger');
console.log('Logger created...');

const fs = require('fs');
const util = require('util');

// AWS config.
const awsCreds = JSON.parse(fs.readFileSync('./aws.json'));
const AWS = require('aws-sdk');
const s3 = new AWS.S3(awsCreds);

const configObj = JSON.parse(fs.readFileSync('./zm_uploader_config.json'));
const config = configObj.config;

logger.info(config);
