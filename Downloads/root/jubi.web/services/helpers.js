var moment = require('moment');


// Called to inject stuff into pipeline.
exports.initialize = function () {
    console.log("initialize in /services/helper.js ");
    return function(req, res, next) {

        // Inject client ip helper
        req.getClientIp = function() {
            return getClientIp(req);
        };
        // Inject client agent helper
        req.getClientAgent = function() {
            return getClientAgent(req);
        };
        // Inject fill url helper
        req.getFullUrl = function() {
            return getClientAgent(req);
        };
        // Convert UTC time to local time using user's tzOffset
        req.toLocalTime = function(d) {
            if (!req.user) return d;
            return toLocalTime(d, req.user.tzOffset);
        };

        // Inject standard send error into response
        res.sendError = function(err) {
            if (!err.isLogged) {
                logger.warn(err);
                err.isLogged = true;
            }
            res.send({ status: 'error', err: err });
        };

        // Inject standard send success into response
        res.sendSuccess = function(data) {
            res.send({ status: 'ok', data: data });
        };

        // No caching!
        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        res.header('Expires', '-1');
        res.header('Pragma', 'no-cache');

        next();
    };
};

// Inject 404 handler into pipeline
exports.initialize404Handler = function() {
    console.log("initialize404Handler in /services/helper.js ");
    return function(req, res) {
        logger.warn('404: [%s] %s. Client: %s - %s',
            req.method,
            getFullUrl(req),
            getClientIp(req),
            getClientAgent(req));

        // XHR request?
        if (req.xhr) return res.sendError(new Error('Page Not found'));

        // Render page
        res.status(404)
            .render('Page Not Found', 'app/error/404', {
                fullUrl: getFullUrl(req),
                path: req.originalUrl,
                clientId: getClientIp(req),
                clientAgent: getClientAgent(req)
            }, 'app');
    };
    
};

// Inject error handler into pipeline
exports.initializeErrorHandler = function () {
    console.log("initializeErrorHandler in /services/helper.js ");
    return function(err, req, res) {
        logger.error(err);
        res.status(err.status || 500);

        // XHR request?
        if (req.xhr) return res.sendError(err);

        // Render page
        res.render('Error', 'app/error/500', err);
    };
};

// This is a helpers method to handle a promise reject in a common way.
// All promise method should use this function to handle the reject case.
exports.handleReject = handleReject = function (err, callback) {
    console.log("handleReject in /services/helper.js ");
    logger.error(err);
    callback(err);
};

// Get the request client ip address.
exports.getClientIp = getClientIp = function (req) {
    console.log("getClientIp in /services/helper.js ");
    return (
        (req.headers['x-forwarded-for'] || '').split(',')[0] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress);
};

// Get the request client agent (the browser identification string).
exports.getClientAgent = getClientAgent = function (req) {
    console.log("getClientAgent in /services/helper.js ");
    return req.headers['user-agent'];
};

// Get the request full URL.
exports.getFullUrl = getFullUrl = function (req) {
    console.log("toLocalTime in /services/helper.js ");
    return req.protocol + "://" + req.get('host') + req.originalUrl;
};

// Convert UTC date to local time
exports.toLocalTime = toLocalTime = function (d, tzOffset) {
    console.log("toLocalTime in /services/helper.js ");
    var m = moment.utc(Date.UTC(
        d.getUTCFullYear(),
        d.getUTCMonth(),
        d.getUTCDate(),
        d.getUTCHours(),
        d.getUTCMinutes()
    )).add(-tzOffset, 'm');
    return m.format('YYYY-MM-DDTHH:mm:ss');
};
