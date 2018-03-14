var models = require('../../jubi.api/models');
var moment = require('moment');
var util = require('util');
var Q = require('q');
var async = require('async');
var fs = require('fs');
var path = require('path');
var ffmpeg = require('fluent-ffmpeg');
var mime = require('mime');
var _ = require('underscore');
var randomstring = require('randomstring');

var AWS = require('aws-sdk');
AWS.config.update(config.aws);

// Video encoding job object
function VideoEncodeJob() {
    var self = this;

    self.name = 'VideoEncodeJob';
    self.nextRun = 0;

    // Create the encoding queue
    self.q = async.queue(self._encode, 10);
}


// Queue encoding task
VideoEncodeJob.prototype._encode = function (item, callback) {

    // Update the encoding entity
    var _updateEncodingEntity = function (ref, type, status, error) {
        return Q.Promise(function (resolve) {
            // Find the encoding entity
            models.Encoding.find({
                where: {
                    ref: ref,
                    type: type
                }
            }).then(function (encoding) {
                encoding.status = status;
                encoding.error = error;

                // Save the encoding entity
                encoding.save().then(function () {
                    resolve();
                }).catch(function (err) {
                    logger.error(err);
                    resolve(err);
                });
            }).catch(function (err) {
                logger.warn('Unable to find encoding entity: %s - %s', ref, type);
                resolve(err);
            })
        });
    };

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

            logger.debug('S3 Uploading: %s:%s %s', bucket, key, path);
            s3.upload(params, function (err, data) {
                if (err) reject(err);

                logger.info('S3 Upload Done: %s:%s %s', bucket, key, path);
                resolve(data);
            });
        });
    };

    var ext = item.type.split('/')[1];
    var srcFileBase = path.join(__dirname, '../work', item.ref);
    var srcFile = util.format('%s.%s', srcFileBase, randomstring.generate(7));
    var workFile = util.format('%s.%s', srcFileBase, ext);

    async.waterfall([

            // Get the source file and save to work folder
            function (callback) {
                var s3 = new AWS.S3();
                var params = {
                    Bucket: config.aws.buckets.userAssets,
                    Key: util.format('%s/video/%s', config.aws.paths.encode, item.ref)
                };
                // Download the source file
                s3.getObject(params, function (err, data) {
                    if (err) {
                        // Update the encoding entity
                        _updateEncodingEntity(item.ref, item.type, 'error', util.format('Unable to find AWS source file: %s', params.Key)).then(function () {
                            logger.error(err);
                            callback(err);
                        });
                        return;
                    }

                    // Save the source file
                    fs.open(srcFile, 'w', function (err, fd) {
                        if (err) {
                            // Update the encoding entity
                            _updateEncodingEntity(item.ref, item.type, 'error', util.format('Unable to create source file: %s', srcFile)).then(function () {
                                logger.error(err);
                                callback(err);
                            });
                            return;
                        }

                        // Write the file to the work directory
                        fs.write(fd, data.Body, 0, data.Body.length, null, function (err) {
                            if (err) {
                                // Update the encoding entity
                                _updateEncodingEntity(item.ref, item.type, 'error', util.format('Unable to write source file: %s', srcFile)).then(function () {
                                    logger.error(err);
                                    callback(err);
                                });
                                return;
                            }

                            // Close the work file
                            fs.close(fd, function () {
                                logger.debug('Source file saved to work folder: %s', srcFile);
                                callback(null);
                            })
                        });
                    });
                });
            },
            // Encode!
            function (callback) {

                var outputOptions;
                if (ext == 'ogv') outputOptions = ['-c:v', 'libtheora'];
                else if (ext == 'webm') outputOptions = ['-c:v', 'libvpx-vp9'];
                else outputOptions = ['-c:v', 'libx264', '-preset fast'];   // wp4


                // Encode the file
                ffmpeg(srcFile, {logger: logger, nolog: false})
                    .output(workFile)
                    //.outputOptions('-strict -2')
                    .outputOptions(outputOptions)
                    .on('start', function (cmdline) {
                        logger.debug('Video encoding to: %s', workFile);
                        logger.debug(cmdline);
                    })
                    .on('error', function (err) {
                        logger.error(err);
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

                var key = util.format('%s/%s.%s', config.aws.paths.videos, item.ref, ext);

                // Upload work file to AWS
                _upload(config.aws.buckets.userAssets, workFile, key).then(function () {
                    callback(null, {err: null});
                }).catch(function (err) {
                    logger.error('Unable to upload to AWS: %j', err);
                    callback(err);
                });
            },
            // Update the encoding entity
            function (result, callback) {
                // Was there an error?
                if (result.err) {
                    // Update the encoding entity
                    _updateEncodingEntity(item.ref, item.type, 'error', util.format('Unable to encode: %s', workFile)).then(function () {
                        callback(null);
                    }).catch(function (err) {
                        callback(err);
                    });
                }
                else {
                    // Update the encoding entity
                    _updateEncodingEntity(item.ref, item.type, 'ready', null).then(function () {
                        callback(null);
                    }).catch(function (err) {
                        callback(err);
                    });
                }
            }
        ],
        function (err) {
            // Cleanup our work and source files
            logger.debug('Cleaning up: %s', workFile);
            fs.unlinkSync(workFile);
            logger.debug('Cleaning up: %s', srcFile);
            fs.unlinkSync(srcFile);

            if (err) logger.error(err);
            callback(err);
        });
};


// Job entry point
VideoEncodeJob.prototype.run = function () {
    var self = this;

    return Q.Promise(function (resolve, reject) {
        // Time to run?
        if (moment().valueOf() < self.nextRun) return resolve();

        logger.debug('%s running...', self.name);

        // Get all the pending encoding objects
        models.Encoding.findAll({where: {status: 'pending'}, order: 'ref'})
            .then(function (encodings) {

                // Are there any encoding entities?
                if (encodings.length <= 0) {
                    logger.debug('%s done. No encoding entities!', self.name);

                    // Set the next run time
                    self.nextRun = moment().valueOf() + config.videoEncodeJob.interval;
                    return resolve();
                }

                // Queue the encodings
                async.eachSeries(encodings, function (encoding, callback) {
                    // Set encoding entity status to encoding
                    encoding.status = 'encoding';
                    encoding.save()
                        .then(function () {
                            // Push item on queue
                            self.q.push({
                                ref: encoding.ref,
                                type: encoding.type
                            });
                            callback();
                        })
                        .catch(function (err) {
                            callback(err);
                        });
                }, function (err) {
                    if (err) {
                        logger.error(err);
                        return reject(err);
                    }
                    logger.debug('%s complete, %d videos queued!', self.name, encodings.length);
                    // Set next run time
                    self.nextRun = moment().valueOf() + (encodings.length * (1000 * 10));
                    resolve();
                });

            })
            .catch(function (err) {
                logger.error(err);
                reject(err);
            });

    });
};

// Export the job object
module.exports = VideoEncodeJob;