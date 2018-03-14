var models = require('../models');
var services = require('../services');

var util = require('util');
var _ = require('underscore');
var path = require('path');
var formidable = require('formidable');
var request = require('request');

var saveImage = function (req, res, isSystem) {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        if (err) return res.sendError(err);
        services.helpers.saveImage(files.file, isSystem)
            .then(function (images) {
                res.sendSuccess({url: services.helpers.makeMediaUrl(images[0].key)});
            })
            .catch(function (err) {
                res.sendError(err);
            });
    });
};

exports.postSystemImage = function (req, res) {
    saveImage(req, res, true);
};
exports.postUserImage = function (req, res) {
    saveImage(req, res, false);
};

var saveSquareImage = function (req, res, isSystem) {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        if (err) return res.sendError(err);
        services.helpers.saveSquareImages(files.file, JSON.parse(fields.sizes), isSystem)
            .then(function (images) {
                res.sendSuccess({
                    url: services.helpers.makeMediaUrl(images[0].key),
                    ref: images[0].ref
                });
            })
            .catch(function (err) {
                res.sendError(err);
            });
    });
};

exports.postSystemSquareImage = function (req, res) {
    saveSquareImage(req, res, true);
};
exports.postUserSquareImage = function (req, res) {
    saveSquareImage(req, res, false);
};

exports.renderImage = function (req, res, isSystem, size) {
    var url = isSystem ?
        util.format('%s/%s/%s.jpg', config.aws.urls.assets, config.aws.paths.images, req.params.key) :
        util.format('%s/%s/%s.jpg', config.aws.urls.userAssets, config.aws.paths.images, req.params.key);

    if (!size) {
        logger.debug('Mapped image %s to %s', req.params.key, url);
        return res.status(307).redirect(url);
    }

    var parts = req.params.size.split('x');
    if (parts.length == 1) {
        url = isSystem ?
            util.format('%s/%s/%s-%sx%s.jpg', config.aws.urls.assets, config.aws.paths.images, req.params.key, parts[0], parts[0]) :
            util.format('%s/%s/%s-%sx%s.jpg', config.aws.urls.userAssets, config.aws.paths.images, req.params.key, parts[0], parts[0]);
    }
    else if (parts.length == 2) {
        url = isSystem ?
            util.format('%s/%s/%s-%sx%s.jpg', config.aws.urls.assets, config.aws.paths.images, req.params.key, parts[0], parts[1]) :
            util.format('%s/%s/%s-%sx%s.jpg', config.aws.urls.userAssets, config.aws.paths.images, req.params.key, parts[0], parts[1]);
    }
    logger.debug('Mapped image %s to %s', req.params.key, url);
    res.status(307).redirect(url);
};

var saveVideo = function (req, res, isSystem) {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        if (err) return res.sendError(err);
        services.helpers.saveVideo(files.file, isSystem)
            .then(function (result) {
                res.sendSuccess({
                    url: services.helpers.makeMediaUrl(result.key),
                    ref: result.ref
                });
            })
            .catch(function (err) {
                res.sendError(err);
            });
    });
};

exports.postSystemVideo = function (req, res) {
    saveVideo(req, res, true);
};
exports.postUserVideo = function (req, res) {
    saveVideo(req, res, false);
};

var isVideoEncoded = function (req, res, isSystem) {

    var urlParts = req.query.url.split('/');
    var ref = urlParts[urlParts.length - 1];

    models.Encoding.findAll({where: {ref: ref, status: 'ready'}})
        .then(function (encodings) {
            res.sendSuccess({
                encodings: _.map(encodings, function (encoding) {
                    return encoding.type;
                })
            });
        })
        .catch(function (err) {
            res.sendError(err);
        });
};

exports.isSystemVideoEncoded = function (req, res) {
    isVideoEncoded(req, res, true);
};
exports.isUserVideoEncoded = function (req, res) {
    isVideoEncoded(req, res, false);
};

exports.getAvailableFormats = function (req, res) {
    var url = services.helpers.makeMediaUrl('uv/' + req.params.data + '.mp4');

    var availableFormats = [];
    var returnedCount = 0;

    request.get(url + '.mp4', { rejectUnauthorized: false })
        .on('response', function(response) {
            if(response.statusCode == 200){
                availableFormats.push('.mp4');
            }
            returnedCount++;
            if(returnedCount == 3){
                res.sendSuccess(availableFormats);
            }
        })
        .on('error', function(response) {
            console.log(response);
            //console.log(response.statusCode) // 200
            //console.log(response.headers['content-type']) // 'image/png'
        });

    request.get(url + '.webm', { rejectUnauthorized: false })
        .on('response', function(response) {
            if(response.statusCode == 200){
                availableFormats.push('.webm');
            }
            returnedCount++;
            if(returnedCount == 3){
                res.sendSuccess(availableFormats);
            }
        })
        .on('error', function(response) {
            console.log(response);
            //console.log(response.statusCode) // 200
            //console.log(response.headers['content-type']) // 'image/png'
        });

    request.get(url + '.ogv', { rejectUnauthorized: false })
        .on('response', function(response) {
            if(response.statusCode == 200){
                availableFormats.push('.ogv');
            }
            returnedCount++;
            if(returnedCount == 3){
                res.sendSuccess(availableFormats);
            }
        })
        .on('error', function(response) {
            console.log(response);
            //console.log(response.statusCode) // 200
            //console.log(response.headers['content-type']) // 'image/png'
        });
};

exports.renderVideo = function (req, res, isSystem) {

    var url;
    var ext = path.extname(req.params.key).toLowerCase();
    if (ext.length <= 0) {
        url = isSystem ?
            util.format('%s/%s/%s.jpg', config.aws.urls.assets, config.aws.paths.videos, req.params.key) :
            util.format('%s/%s/%s.jpg', config.aws.urls.userAssets, config.aws.paths.videos, req.params.key);

        logger.debug('Mapped video image %s to %s', req.params.key, url);
        return res.status(307).redirect(url);
    }

    url = isSystem ?
        util.format('%s/%s/%s', config.aws.urls.assets, config.aws.paths.videos, req.params.key) :
        util.format('%s/%s/%s', config.aws.urls.userAssets, config.aws.paths.videos, req.params.key);

    logger.debug('Mapped video %s to %s', req.params.key, url);
    res.status(307).redirect(url);
};

var saveAudio = function (req, res, isSystem) {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        if (err) return res.sendError(err);
        services.helpers.saveAudio(files.file, isSystem)
            .then(function (result) {
                res.sendSuccess({
                    url: services.helpers.makeMediaUrl(result.key),
                    ref: result.ref
                });
            })
            .catch(function (err) {
                res.sendError(err);
            });
    });
};

exports.postSystemAudio = function (req, res) {
    saveAudio(req, res, true);
};
exports.postUserAudio = function (req, res) {
    saveAudio(req, res, false);
};

exports.renderAudio = function (req, res, isSystem) {

    var url = isSystem ?
        util.format('%s/%s/%s.mp3', config.aws.urls.assets, config.aws.paths.audio, req.params.key) :
        util.format('%s/%s/%s.mp3', config.aws.urls.userAssets, config.aws.paths.audio, req.params.key);

    logger.debug('Mapped audio %s to %s', req.params.key, url);
    res.status(301).redirect(url);
};

var saveResource = function (req, res, isSystem) {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        if (err) return res.sendError(err);
        services.helpers.saveResource(files.file, isSystem)
            .then(function (result) {
                res.sendSuccess({
                    url: services.helpers.makeResourceUrl(result.url),
                    ref: result.ref
                });
            })
            .catch(function (err) {
                res.sendError(err);
            });
    });
};

exports.postSystemResource = function (req, res) {
    saveResource(req, res, true);
};
exports.postUserResource = function (req, res) {
    saveResource(req, res, false);
};

exports.renderResource = function (req, res, isSystem) {

    var url = isSystem ?
        util.format('%s/%s/%s', config.aws.urls.assets, config.aws.paths.resources, req.params.key) :
        util.format('%s/%s/%s', config.aws.urls.userAssets, config.aws.paths.resources, req.params.key);

    logger.debug('Mapped resource %s to %s', req.params.key, url);
    res.status(301).redirect(url);
};
