var util = require('util');
var Q = require('q');
var async = require('async');
var fs = require('fs');
var path = require('path');
var ffmpeg = require('fluent-ffmpeg');
var mime = require('mime');
var _ = require('underscore');

var AWS = require('aws-sdk');
AWS.config.update(config.aws);


// Encoding task
var encode = function (videoRef, videoType) {

    // Upload to S3
    var _upload = function (bucket, path, key) {
        return Q.Promise(function (resolve, reject) {

            // Open the file to upload
            var body = fs.createReadStream(path);

            var s3 = new AWS.S3();
            var params = {
                Bucket: bucket,
                Key: key,
                Body: body,
                ACL: 'public-read',
                ContentType: mime.lookup(key)
            };

            s3.upload(params, function (err, data) {
                if (err) reject(err);
                resolve(data);
            });
        });
    };

    return Q.Promise(function(resolve, reject) {

        var ext = videoType.split('/')[1];
        var srcFile = path.join(__dirname, '../work', videoRef);
        var workFile = util.format('%s.%s', srcFile, ext);

        async.waterfall([

                // Get the source file and save to work folder
                function (callback) {
                    var s3 = new AWS.S3();
                    var params = {
                        Bucket: config.aws.buckets.userAssets,
                        Key: util.format('%s/video/%s', config.aws.paths.encode, videoRef)
                    };
                    // Download the source file
                    s3.getObject(params, function (err, data) {
                        if (err) {
                            callback(null, {err: util.format('Unable to find AWS source file: %s', params.Key)});
                            return;
                        }

                        // Save the source file
                        fs.open(srcFile, 'w', function (err, fd) {
                            if (err) {
                                callback(null, {err: util.format('Unable to create source file: %s', srcFile)});
                                return;
                            }

                            // Write the file to the work directory
                            fs.write(fd, data.Body, 0, data.Body.length, null, function (err) {
                                if (err) {
                                    callback(null, {err: util.format('Unable to write source file: %s', srcFile)});
                                    fs.close();
                                    return;
                                }
                                // Close the work file
                                fs.close(fd, function () {
                                    callback();
                                })
                            });
                        });
                    });
                },
                // Encode!
                function (result, callback) {
                    // Was there an encoding error?
                    if (result.err) return callback(null, result);

                    // Encode the file
                    ffmpeg(srcFile, {logger: logger, nolog: false})
                        .output(workFile)
                        .outputOptions('-strict -2')
                        .on('start', function (cmdline) {
                            //logger.debug('Video encoding to: %s', workFile);
                            //logger.debug(cmdline);
                        })
                        .on('error', function (err) {
                            //logger.error(err);
                            callback(null, {err: err});
                        })
                        .on('end', function () {
                            callback(null, {err: null});
                        })
                        .run();
                },
                // Update to AWS
                function (result, callback) {
                    // Was there an encoding error?
                    if (result.err) return callback(null, result);

                    var key = util.format('%s/%s.%s', config.aws.paths.videos, videoRef, ext);

                    // Upload work file to AWS
                    _upload(config.aws.buckets.userAssets, workFile, key)
                        .then(function () {
                            // Remove the work file
                            fs.unlink(workFile)
                                .then(function() { callback(null, {err: null}); })
                                .catch(function(err) {
                                    //logger.error('Unable to delete work file: %j', err);
                                    callback(null, {err: err});
                                });

                        }).catch(function (err) {
                            //logger.error('Unable to upload to AWS: %j', err);
                            callback(null, {err: err});
                        });
                }
            ],
            function (err, result) {
                if (result.err) return reject(result.err);
                resolve();
            });
    });
};

var videoRef = null;
var videoType = null;
var processArgs = function() {
    _.each(process.argv, function(arg) {
        var parts = arg.split('=');
        if (parts.length != 2) return;
        if (parts[0].trim() == 'ref') {
            videoRef = parts[1].trim();
        }
        else if (parts[0].trim() == 'type') {
            videoType = parts[1].trim();
        }
    });
};

// Process command line arguments
processArgs();
if (!videoRef || !videoType) {
    process.exit(1);
    return;
}

// Run the encoding job
encode(videoRef, videoType)
    .then(function() {
        process.exit(0);
    })
    .catch(function(err) {
        console.log(err);
        process.exit(1);
    });