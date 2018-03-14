var models = require('../models');
var moment = require('moment');
var async = require('async');
var Q = require('q');
var AWS = require('aws-sdk');
var util = require('util');
var uuid = require('node-uuid');
var path = require('path');
var fs = require('fs');
var gm = require('gm');
var mime = require('mime');
var _ = require('underscore');
var ffmpeg = require('fluent-ffmpeg');

// Called to inject stuff into pipeline.
exports.initialize = function () {
    return function (req, res, next) {

        // Set allowed options
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
        res.header('Access-Control-Allow-Headers', 'Content-Type');

        // No caching!
        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        res.header('Expires', '-1');
        res.header('Pragma', 'no-cache');

        // Inject client ip helper
        req.getClientIp = function () {
            return getClientIp(req);
        };
        // Inject client agent helper
        req.getClientAgent = function () {
            return getClientAgent(req);
        };
        // Inject fill url helper
        req.getFullUrl = function () {
            return getClientAgent(req);
        };
        // Convert UTC time to local time using user's tzOffset
        req.toLocalTime = function (d) {
            if (!req.user) return d;
            return toLocalTime(d, req.user.tzOffset);
        };

        // Inject standard send error into response
        res.sendError = function (err) {
            if (!err.isLogged) {
                logger.warn(err);
                err.isLogged = true;
            }
            res.status(req.status || 500).send(err);
        };

        // Inject standard send success into response
        res.sendSuccess = function (data) {
            res.status(200).send(data);
        };

        next();
    };
};

// Inject 404 handler into pipeline
exports.initialize404Handler = function () {

    return function (req, res) {
        logger.warn('404: [%s] %s. Client: %s - %s',
            req.method,
            getFullUrl(req),
            getClientIp(req),
            getClientAgent(req));

        res.status(404).send('Not found');
    };

};

// Inject error handler into pipeline
exports.initializeErrorHandler = function () {
    return function (err, req, res) {
        logger.error(err);
        res.status(err.status || 500);
        return res.sendError(err);
    };
};

// Inject options requests handler
exports.handleOptionsRequest = function () {
    return function (req, res, next) {

        var oneOf = false;
        if (req.headers.origin) {
            res.header('Access-Control-Allow-Origin', '*');
            oneOf = true;
        }
        if (req.headers['access-control-request-method']) {
            res.header('Access-Control-Allow-Methods', req.headers['access-control-request-method']);
            oneOf = true;
        }
        if (req.headers['access-control-request-headers']) {
            res.header('Access-Control-Allow-Headers', req.headers['access-control-request-headers']);
            oneOf = true;
        }
        if (oneOf) {
            res.header('Access-Control-Max-Age', 60 * 60 * 24 * 365);
        }

        // intercept OPTIONS method
        if (oneOf && req.method == 'OPTIONS') res.sendStatus(200);
        else next();
    };
};

// This is a helpers method to handle a promise reject in a common way.
// All promise method should use this function to handle the reject case.
exports.handleReject = handleReject = function (err, callback) {
    logger.error(err);
    if (callback) callback(err);
};

// Get the request client ip address.
exports.getClientIp = getClientIp = function (req) {
    return (
    (req.headers['x-forwarded-for'] || '').split(',')[0] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress);
};

// Get the request client agent (the browser identification string).
exports.getClientAgent = getClientAgent = function (req) {
    return req.headers['user-agent'];
};

// Get the request full URL.
exports.getFullUrl = getFullUrl = function (req) {
    return req.protocol + "://" + req.get('host') + req.originalUrl;
};

// Convert UTC date to local time
exports.toLocalTime = toLocalTime = function (d, tzOffset) {
    if (!d) return moment().format('YYYY-MM-DDTHH:mm:ss');
    var m = moment.utc(Date.UTC(
        d.getUTCFullYear(),
        d.getUTCMonth(),
        d.getUTCDate(),
        d.getUTCHours(),
        d.getUTCMinutes()
    )).add(-tzOffset, 'm');
    return m.format('YYYY-MM-DDTHH:mm:ss');
};

exports.authorizeById = function (maxRoleId, user) {
    var result = _.some(user.roles, function (r) {
        return (r.id <= maxRoleId);
    });
    if (result) return true;
    return false;
};

exports.isInRole = function (maxRoleId, user) {
    var result = _.some(user.roles, function (r) {
        return (r.id == maxRoleId);
    });
    if (result) return true;
    return false;
};

exports.roleIds = {
    SystemAdmin: 1,
    ClientAdmin: 2,
    ClientAuthor: 3,
    ClientUser: 4
};


exports.getClientHierarchy = function (id) {
    return Q.Promise(function (resolve, resject) {
        var clients = [];
        var ids = [id];
        async.doWhilst(function (callback) {
                var currentIds = ids.slice();
                models.Client.findAll({
                    where: {
                        parentId: {
                            $in: ids
                        }
                    },
                    paranoid: false
                }).then(function (foundClients) {
                    clients = clients.concat(foundClients);
                    _.each(currentIds, function (id) {
                        ids = _.without(ids, id);
                    });
                    _.each(foundClients, function (client) {
                        ids.push(client.id);
                    });
                    callback();
                })
            }, function () {
                if (ids.length > 0) {
                    return true;
                } else {
                    return false;
                }
            },
            function () {
                resolve(clients);
            });
    })
};

// The question type codes
exports.QuestionTypes = {
    SingleSelect: 1,
    MultiSelect: 2,
    Poll: 3,
    Narrative: 4,
    FillBlank: 5,
    Matching: 6,
    ShortAnswer: 7,
    Contrasting: 8,
    SentenceBuilder: 9,
    FreeContrasting: 10,
    Sequencing: 11,
    Grouping: 13,
    PollMultiSelect: 14
};

exports.sequencingTypes = {
    inOrder: {
        id: 1
    },
    parallel: {
        id: 2
    },
    interval: {
        id: 3
    }
};
exports.sequencingTypeIntervalStartTypes = {
    onStartDate: {
        id: 1
    },
    onSpecificDate: {
        id: 2
    }
};

exports.programUserAssociationTypes = {
    buddy: {
        id: 1
    }
};


// Upload a file to S3
var uploadToS3 = function (bucket, path, key) {
    return Q.Promise(function (resolve, reject) {
        AWS.config.update(config.aws);

        // Open the file to upload
        var body = fs.createReadStream(path);

        // Send to s3
        var s3 = new AWS.S3({
            params: {
                Bucket: bucket,
                Key: key,
                ACL: 'public-read',
                ContentType: mime.lookup(key)
            }
        });

        logger.debug('S3 Uploading: %s:%s %s', bucket, key, path);
        s3.upload({Body: body}, function (err, data) {
            if (err) handleReject(err, reject);

            logger.info('S3 Upload: %s:%s %s', bucket, key, path);
            resolve(data);
        });
    });
};

// Save image
exports.saveImage = function (file, isSystem) {
    return Q.Promise(function (resolve, reject) {

        var phyPath = config.tmp;
        //logger.debug(phyPath);

        var key = uuid.v4();
        var phyBaseName = phyPath + '/' + key;

        var tmpFiles = [];
        var bucket = (isSystem ? config.aws.buckets.assets : config.aws.buckets.userAssets);

        async.waterfall([

            // Save the source file to tmp folder
            function (callback) {

                var tmpFile = phyBaseName + '.jpg';

                gm(file.path)
                    .noProfile()
                    .write(tmpFile, function (err) {
                        if (err) return handleReject(err, callback);

                        // Get the file's size
                        gm(tmpFile)
                            .size(function (err, size) {
                                if (err) return handleReject(err, callback);

                                var tmpFileDef = {
                                    phyFile: tmpFile,
                                    key: util.format('%s/%s.jpg', (isSystem ? 'si' : 'ui'), key),
                                    rmtFile: util.format('%s/%s.jpg', config.aws.paths.images, key),
                                    size: [size.width, size.height]
                                };
                                tmpFiles.push(tmpFileDef);

                                uploadToS3(bucket, tmpFile, tmpFileDef.rmtFile)
                                    .then(function (resp) {
                                        tmpFileDef.url = resp.Location;
                                        callback(null);
                                    })
                                    .catch(function (err) {
                                        handleReject(err, reject);
                                    });
                            });
                    });
            },
            function (callback) {
                var result = [];
                _.each(tmpFiles, function (file) {
                    // Add to result
                    result.push({
                        key: file.key,
                        size: {
                            width: file.size[0],
                            height: file.size[1]
                        },
                        ref: key
                    });
                    // Delete the tmp file
                    fs.unlink(file.phyFile, function () {
                    });
                });
                //logger.debug(result);
                callback(null, result);
            }

        ], function (err, result) {
            if (err) handleReject(err, reject);
            resolve(result);
        });
    });
};

// Save as square image
exports.saveSquareImages = function (file, sizes, isSystem) {
    sizes = sizes || [100, 250, 600];

    return Q.Promise(function (resolve, reject) {

        var phyPath = config.tmp;
        //logger.debug(phyPath);

        var key = uuid.v4();
        var phyBaseName = phyPath + '/' + key;

        var tmpFiles = [];
        var bucket = (isSystem ? config.aws.buckets.assets : config.aws.buckets.userAssets);

        async.waterfall([

            // Save the source file to tmp folder
            function (callback) {

                var tmpFile = phyBaseName + '.jpg';

                gm(file.path)
                    .noProfile()
                    .write(tmpFile, function (err) {
                        if (err) return handleReject(err, callback);

                        // Get the file's size
                        gm(tmpFile).size(function (err, size) {
                            if (err) return handleReject(err, callback);

                            var tmpFileDef = {
                                phyFile: tmpFile,
                                key: util.format('%s/%s.jpg', (isSystem ? 'si' : 'ui'), key),
                                rmtFile: util.format('%s/%s.jpg', config.aws.paths.images, key),
                                size: [size.width, size.height]
                            };
                            tmpFiles.push(tmpFileDef);

                            uploadToS3(bucket, tmpFile, tmpFileDef.rmtFile)
                                .then(function (resp) {
                                    tmpFileDef.url = resp.Location;
                                    callback(null, tmpFile);
                                })
                                .catch(function (err) {
                                    handleReject(err, reject);
                                });
                        });
                    });
            },
            function (sourceFile, callback) {

                // Create for each size and upload
                async.each(sizes, function (size, callback) {


                    var tmpFile = util.format('%s-%dx%d.jpg', phyBaseName, size, size);
                    gm(sourceFile)
                        .resize(size, size, '^')
                        .gravity('Center')
                        .crop(size, size)
                        .write(tmpFile, function (err) {
                            if (err) return handleReject(err, callback);

                            var tmpFileDef = {
                                phyFile: tmpFile,
                                key: util.format('%s/%s-%dx%d.jpg', (isSystem ? 'si' : 'ui'), key, size, size),
                                rmtFile: util.format('%s/%s-%dx%d.jpg', config.aws.paths.images, key, size, size),
                                size: [size, size]
                            };
                            tmpFiles.push(tmpFileDef);

                            uploadToS3(bucket, tmpFile, tmpFileDef.rmtFile)
                                .then(function (resp) {
                                    tmpFileDef.url = resp.Location;
                                    callback(null);
                                })
                                .catch(function (err) {
                                    handleReject(err, reject);
                                });
                        });

                }, function (err) {
                    if (err) handleReject(err, callback);
                    callback();
                });
            },
            function (callback) {
                var result = [];
                _.each(tmpFiles, function (file) {
                    // Add to result
                    result.push({
                        key: file.key,
                        size: {
                            width: file.size[0],
                            height: file.size[1]
                        },
                        ref: key
                    });
                    // Delete the tmp file
                    fs.unlink(file.phyFile, function (err) {
                        if (err) logger.error(err);
                        else logger.trace('Unlinked: %s', file.phyFile);
                    });
                });
                //logger.debug(result);
                callback(null, result);
            }

        ], function (err, result) {
            if (err) handleReject(err, reject);
            resolve(result);
        });
    });
};

// Save a video
exports.saveVideo = function (file, isSystem) {

    return Q.Promise(function (resolve, reject) {

        var phyPath = config.tmp;

        var key = uuid.v4();
        var phyBaseName = phyPath + '/' + key;
        var tmpFile = phyBaseName + '.jpg';

        var bucket = (isSystem ? config.aws.buckets.assets : config.aws.buckets.userAssets);

        async.waterfall([

            // Create thumbnail
            function (callback) {

                ffmpeg(file.path)
                    .on('start', function (cmdline) {
                        logger.debug(cmdline);
                    })
                    .on('error', function (err) {
                        logger.error(err);
                        handleReject(err, reject);
                    })
                    .on('end', function () {
                        logger.info('Video thumbnail created...', key);

                        uploadToS3(bucket, tmpFile, util.format('%s/%s.jpg', config.aws.paths.videos, key))
                            .then(function () {
                                callback(null, util.format('%s/%s.jpg', (isSystem ? 'sv' : 'uv'), key));
                            })
                            .catch(function (err) {
                                handleReject(err, reject);
                            });
                    })
                    .screenshots({
                        count: 1,
                        filename: key + '.jpg',
                        folder: phyPath
                    });

            },
            // Kick off encoding jobs
            function (thumbKey, callback) {

                var rmtFile = util.format('%s/video/%s', config.aws.paths.encode, key);

                // Upload source video to encode folder
                uploadToS3(bucket, file.path, rmtFile)
                    .then(function () {

                        // Create the encoding records
                        models.Encoding.bulkCreate([
                            {ref: key, type: 'video/mp4'},
                            {ref: key, type: 'video/ogv'},
                            {ref: key, type: 'video/webm'}
                        ])
                            .then(function () {
                                callback(null, {key: thumbKey, ref: key});
                            })
                            .catch(function (err) {
                                handleReject(err, reject);
                            });
                    })
                    .catch(function (err) {
                        handleReject(err, reject);
                    });


            }

        ], function (err, result) {
            fs.unlink(tmpFile, function (err) {
                if (err) logger.error(err);
                else  logger.trace('Unlinked: %s', tmpFile);
            });

            if (err) return handleReject(err, reject);
            resolve(result);
        });
    });
};

// Save a audio
exports.saveAudio = function (file, isSystem) {

    return Q.Promise(function (resolve, reject) {

        var phyPath = config.tmp;

        var key = uuid.v4();
        var phyBaseName = phyPath + '/' + key;

        var bucket = (isSystem ? config.aws.buckets.assets : config.aws.buckets.userAssets);

        var mp3FilePath = phyBaseName + '-enc.mp3';
        var mp3File = util.format('%s/%s.mp3', config.aws.paths.audio, key);


        ffmpeg(file.path, {logger: logger, nolog: false})
            .output(mp3FilePath)
            .audioBitrate(128)
            .audioCodec('libmp3lame')

            /*.output(accFilePath)
             .audioBitrate(128)
             .audioCodec('libfdk_aac')*/

            .on('start', function (cmdline) {
                logger.debug(cmdline);
            })
            .on('error', function (err) {
                logger.error('Failed to encode audio %j', err);
            })
            .on('end', function () {
                logger.info('Audio encoded! %s uploading...', key);

                async.parallel([
                    function (callback) {
                        uploadToS3(bucket, mp3FilePath, mp3File)
                            .then(function () {
                                callback(null);
                            })
                            .catch(function (err) {
                                handleReject(err, reject);
                            });
                    }/*,
                     function(callback) {
                     uploadToS3(bucket, accFilePath, accFile)
                     .then(function() { callback(null); })
                     .catch(function(err) { handleReject(err, reject); });
                     }*/
                ], function (err) {
                    fs.unlink(mp3FilePath, function () {
                    });
                    //fs.unlink(accFilePath, function() {});

                    if (err) handleReject(err, reject);

                    var audioKey = util.format('%s/%s.mp3', (isSystem ? 'sa' : 'ua'), key);
                    logger.debug(audioKey);
                    resolve({key: audioKey, ref: key});
                })
            })
            .run();
    });
};

// Checks for an existing file
exports.checkForFile = function (key, isSystem) {

    return Q.Promise(function (resolve, reject) {
        AWS.config.update(config.aws);
        var s3 = new AWS.S3();

        var params = {
            Bucket: (isSystem ? config.aws.buckets.assets : config.aws.buckets.userAssets),
            Key: key
        };
        s3.getObjectAcl(params, function (err, data) {
            if (err) {
                if (err.code == 'NoSuchKey') return resolve({exists: false});
                return handleReject(err, reject);
            }
            resolve({exists: true});
        });
    });
};

// Save a resource
exports.saveResource = function (file, isSystem) {
    return Q.Promise(function (resolve, reject) {

        var phyPath = config.tmp;

        var key = uuid.v4();
        var rmtFile = config.aws.paths.resources + '/' + key + path.extname(file.name);

        var bucket = (isSystem ? config.aws.buckets.assets : config.aws.buckets.userAssets);

        uploadToS3(bucket, file.path, rmtFile)
            .then(function () {
                resolve({
                    url: util.format('%s/%s%s', (isSystem ? 'sr' : 'ur'), key, path.extname(file.name)),
                    ref: key
                });
            })
            .catch(function (err) {
                handleReject(err, reject);
            });
    });
};

// Convert an media ref into an media url
exports.makeMediaUrl = function (mediaRef) {
    if (!mediaRef) return null;

    var index = mediaRef.indexOf('.');
    if (index <= 0) {
        logger.warn('Bad media ref ' + mediaRef);
        return null;
    }
    mediaRef = mediaRef.substring(0, index);
    return config.web.mediaHandlerUrl + '/' + mediaRef;
};

// Convert an resource ref into an resource url
exports.makeResourceUrl = function (resourceRef) {
    if (!resourceRef) return null;
    return config.web.mediaHandlerUrl + '/' + resourceRef;
};

// Convert image url into image ref
exports.makeImageRef = function (url) {
    if (!url) return null;
    var i = url.indexOf('/ui');
    if (i < 0) {
        i = url.indexOf('/si');
        if (i < 0) return null;
    }
    return url.substring(i + 1) + '.jpg';
};

// Convert video url into video ref
exports.makeVideoRef = function (url, ext) {
    if (!url) return null;
    var i = url.indexOf('/uv');
    if (i < 0) {
        i = url.indexOf('/sv');
        if (i < 0) return null;
    }
    return url.substring(i + 1) + ext;
};

// Convert audio url into audio ref
exports.makeAudioRef = function (url, ext) {
    if (!url) return null;
    var i = url.indexOf('/ua');
    if (i < 0) {
        i = url.indexOf('/sa');
        if (i < 0) return null;
    }
    return url.substring(i + 1) + ext;
};

// Convert resource url into resource ref
exports.makeResourceRef = function (url) {
    if (!url) return null;
    var i = url.indexOf('/ur');
    if (i < 0) {
        i = url.indexOf('/sr');
        if (i < 0) return null;
    }
    return url.substring(i + 1);
};

exports.releaseProgramPreviews = function (linkId, userId, t) {
    return Q.Promise(function (resolve, reject) {

        var where = {status: 'preview'};

        //have to have a linkid, we aren't allowing deleting previews for all programs for all clients
        where.linkId = linkId;

        //If no userId then delete previews for all users
        if (userId > 0) where.createdById = userId;

        // Destroy all existing previews
        models.Program.destroy({force: false, where: where},
            {transaction: t})
            .then(function () {
                resolve();
            })
            .catch(function (err) {
                handleReject(err, reject);
            });
    });
};
exports.makeToken = function (len) {
    var _getRandomInt = function (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };
    var buf = [];
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charLen = chars.length;

    for (var i = 0; i < len; ++i) buf.push(chars[_getRandomInt(0, charLen - 1)]);
    return buf.join('');
};


var crypto = require('crypto'),
    algorithm = 'aes-256-ctr',
    _encKey = 'hHcKz/<86FZ3.USL';

// Encrypts a string
exports.encrypt = function encrypt(text, encKey) {
    var cipher = crypto.createCipher(algorithm, encKey ? encKey : _encKey);
    var c = cipher.update(text, 'utf8', 'hex');
    c += cipher.final('hex');
    return c;
};

// Decrypts a string
exports.decrypt = function decrypt(text, encKey) {
    var decipher = crypto.createDecipher(algorithm, encKey ? encKey : _encKey);
    var d = decipher.update(text, 'hex', 'utf8');
    d += decipher.final('utf8');
    return d;
};
