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
var spawn = require('child_process').spawn;

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

    var child = spawn('node', ['ref='+item.ref, 'type='+item.type]);

    var result = null;
    child.stdout.on('data', function(data) {
        result = data;
    });
    child.stderr.on('data', function(data) {
    });

    child.on('close', function(code) {
        if (code == 0) {
            _updateEncodingEntity(item.ref, item.type, 'success')
                .then(callback).catch(callback);
        }
        else {
            _updateEncodingEntity(item.ref, item.type, 'error', result)
                .then(callback).catch(callback);
        }
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