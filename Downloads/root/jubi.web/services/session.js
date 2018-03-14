var services = require('../services');

var Q = require('q');
var _ = require('underscore');
var request = require('request');
var util = require('util');

// Role ids
exports.roleIds = {
    SystemAdmin: 1,
    ClientAdmin: 2,
    ClientAuthor: 3,
    ClientUser: 4
};

// Authenticate the user using the provided credentials.
exports.auth = _auth = function (req, userName, password, tzOffset) {
    console.log("auth in /services/sessions.js ");
    return Q.Promise(function(resolve, reject) {

        var data = {
            email: userName,
            password: password,
            tzOffset: tzOffset
        };

        request.post(config.web.apiUrl + '/login', { json: data, rejectUnauthorized: false },
            function(err, response, user) {
                if (err) {
                    return services.helpers.handleReject(err, reject);
                }
                // was there a problem authenticating this user???
                if (response.statusCode != 200) {
                    // user not associated with any clients
                    if(response.body.noClient){
                        return resolve({user: null, noClient: true, loginFailed: false});
                    }
                    else {
                        // all other failures
                        logger.error('Login failed with status: %d', response.statusCode);
                        return resolve({user: null, noClient: false, loginFailed: true});
                    }
                }

                // Log user in!
                req.login(user, function() {
                    logger.info('User (%d) %s - Logged in.', user.id, user.email);
                    resolve({user: user, noClient: false, loginFailed: false});
                });
            });
    });
};

// Authenticate the user using the provided credentials.
exports.auth = _authWithCode = function (req, code) {
    console.log("auth in /services/sessions.js ");
    return Q.Promise(function(resolve, reject) {

        var data = {
            code: code
        };

        request.post(config.web.apiUrl + '/login-with-code', { json: data, rejectUnauthorized: false },
            function(err, response, user) {
                if (err) return services.helpers.handleReject(err, reject);
                // was there a problem authenticating this user???
                if (response.statusCode != 200) {
                    // user not associated with any clients
                    if(response.body.noClient){
                        return resolve({user: null, noClient: true, loginFailed: false});
                    }
                    else {
                        // all other failures
                        logger.error('Login failed with status: %d', response.statusCode);
                        return resolve({user: null, noClient: false, loginFailed: true});
                    }
                }

                // Log user in!
                req.login(user, function() {
                    logger.info('User (%d) %s - Logged in.', user.id, user.email);
                    resolve({user: user, noClient: false, loginFailed: false});
                });
            });
    });
};

// Called to inject stuff into pipeline.
exports.initialize = function () {
    console.log("initialize in /services/sessions.js ");
    return function(req, res, next) {

        // Inject auth method
        req.auth = function(model) {
            return _auth(req, model.userName, model.password, model.tzOffset);
        };
        req.authWithCode = function(model){
            return _authWithCode(req, model.code)
        };

        // Inject logoutEx method
        req.logoutEx = function() {
            if (!req.user) return res.redirect('/');

            request.del(config.web.apiUrl + '/logout', {
                json: { userId: req.user.id },
                headers: req.user.authHeader,
                rejectUnauthorized: false
            }, function(err, httpRes) {
                if (err) {
                    logger.error(err);
                    req.logout();
                    return res.redirect('/');
                }
                if (httpRes.statusCode != 200) {
                    logger.error('Bad response %d', httpRes.statusCode);
                    req.logout();
                    return res.redirect('/');
                }
                logger.info('User (%d) %s %s - Logged out.', req.user.id, req.user.firstName, req.user.lastName);
                req.logout();

                // Clear the remember me token, as needed
                //logger.info("logout rem" + config.cookies.rememberMe);
                //logger.info("logout session name " + config.session.name + " " + '.' + config.web.host);
                //logger.info("logout cookie name " + config.cookies.userName );

                res.clearCookie(config.cookies.rememberMe);
                res.clearCookie(config.cookies.userName, { path: '/' });
                res.clearCookie(config.cookies.userpic, { path: '/' });
                res.clearCookie(config.session.name, { path: '/' });
                res.clearCookie(config.session.name, { path: '/' });
                res.redirect('/');
            });
        };

        // Test if user is authenticated
        req.isAuth = function() {
            if (!req.isAuthenticated()) {
                logger.warn('Not Authenticated: %s. Client: %s - %s',
                    services.helpers.getFullUrl(req),
                    services.helpers.getClientIp(req),
                    services.helpers.getClientAgent(req));
                req.session.flashWarning = 'Your session has ended. Please login.';
                res.redirect(util.format('/login?r=%s', encodeURIComponent(req.originalUrl)));
                return false;
            }
            return true;
        };

        // Authorize user
        req.authorize = function(roles) {
            if (!req.isAuth()) return false;

            var result = _.some(req.user.roles, function(r) {
                return _.some(roles, function(r2) { return r.name==r2.name });
            });
            if (result) return true;

            logger.warn('Not Authorized: %s. Client: %s - %s',
                services.helpers.getFullUrl(req),
                services.helpers.getClientIp(req),
                services.helpers.getClientAgent(req));
            req.session.flashWarning = 'You are not authorized to access the requested resource.';
            res.redirect(util.format('/login?r=%s', encodeURIComponent(req.originalUrl)));
            return false;
        };

        req.authorizeById = function(maxRoleId) {
            if (!req.isAuth()) return false;

            var result = _.some(req.user.roles, function(r) { return (r.id <= maxRoleId); });
            if (result) return true;

            logger.warn('Not Authorized: %s. Client: %s - %s',
                services.helpers.getFullUrl(req),
                services.helpers.getClientIp(req),
                services.helpers.getClientAgent(req));
            req.session.flashWarning = 'You are not authorized to access the requested resource.';
            res.redirect(util.format('/login?r=%s', encodeURIComponent(req.originalUrl)));
            return false;
        };

        next();
    };
};


// Authenticate the user using the provided credentials.
exports.restartSession = _restartSession = function (id) {
    console.log("restartSession in /services/sessions.js ");
    return Q.Promise(function(resolve) {

        request.get(config.web.apiUrl + '/restart-session/' + id, { rejectUnauthorized: false },
            function(err, response, user) {
                if (err) return services.helpers.handleReject(err, reject);
                if (response.statusCode != 200) return resolve(null);

                // Log user in!
                req.login(user, function() {
                    logger.info('User (%d) %s - Remembered and logged in.', user.id, user.email);
                    resolve(user);
                });
            });
    });
};

var tokens = {};

exports.consumeRememberMeToken = function (token, callback) {
    console.log("consumeRememberMeToken in /services/sessions.js ");
    var uid = tokens[token];
    // Invalidate the single-use token
    delete tokens[token];
    return callback(null, uid);
};

exports.saveRememberMeToken = _saveRememberMeToken = function (uid, callback) {
    console.log("saveRememberMeToken in /services/sessions.js ");

    var _makeToken = function(len) {
        var _getRandomInt = function(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        };
        var buf = [];
        var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charLen = chars.length;

        for (var i = 0; i < len; ++i) buf.push(chars[_getRandomInt(0, charLen - 1)]);
        return buf.join('');
    };

    var token = _makeToken(64);
    tokens[token] = uid;
    return callback(null, token);
};

exports.issueRememberMeToken = function (user, callback) {
    console.log("issueRememberMeToken in /services/sessions.js ");

    _saveRememberMeToken(user.id, function(err, token) {
        if (err) { return callback(err); }
        return callback(null, token);
    });
};



