var app = require('../../app');
var services = require('../../services');
var session = require('../../services/session');
var request = require('request');

var util = require('util');

var _title = function(title) {
    if (!title) return config.appName;
    return title + ' | Powered by ' + config.appName;
};


exports.getSSOAuthenticate = function(req, res) {
    request.get(config.web.apiUrl + '/get-authenticate-session-link/' + req.params.key,
        function (err, response, result) {
            var resultObj = JSON.parse(result);
            var url = resultObj.url;
            var sessionId = resultObj.sessionId;

            res.redirect(url + config.web.appUrl
                + "/authenticate"
                + "/" + req.params.key
                + "/authenticated/"
                + sessionId);
        });
};

exports.authenticateWithSession = function(req, res) {
    var data = {
        sessionId: req.params.sessionId,
        key: req.params.key
    };

    request.post(config.web.apiUrl + '/session-auth/'
        + req.params.key + '/'
        + req.params.sessionId,
        function(err, response, result) {
            if (err) {
                return services.helpers.handleReject(err, reject);
            }

             res.redirect('/auth/redirect/' + JSON.parse(result).securityCode);
        });
};


// Handle login get.
exports.getLogin = function(req, res) {
    var model = { email: null };
    model.rememberMeChecked = (req.cookies[config.cookies.rememberMeChecked] == 'yes');
    res.render(_title('Login'), 'app/session/login', model, 'app');
};

// Handle login post back.
exports.postLoginReset = function(req, res) {


    req.auth({
        userName: req.body.email,
        password: req.body.password,
        tzOffset: parseInt(req.body.tzOffset)
    })
        .then(function(response) {

            var user = response.user;

            // Was user found?
            if (!user) {
                logger.warn('Login reset failed, user not found: %s', req.body.email);
                return res.status(404).send('FAILED');
            }

            // Cache the api key
            user.apiKey = new Buffer(user.email + ':' + req.body.password).toString('base64');
            user.authHeader = { 'Authorization': ('Basic ' + user.apiKey) };

            // Log user in!
            req.login(user, function() {
                logger.info('Login reset (%d) %s %s - Logged in.', user.id, user.firstName, user.lastName);
                res.status(200).send({
                    'apiUrl': config.web.apiUrl,
                    'user': user ? user : false
                });
            });
        })
        .catch(function(err) {
            logger.error(err);
            return res.status(500).send('FAILED');
        });
};

// Handle login post back.
exports.postLogin = function(req, res) {

    var model = {email: req.body.email};

    var redirectAsNeeded = function(req, res, user) {
        if (req.query.r) return res.redirect(req.query.r);

        if (config.web.usePortInRedirect) {
            var url = util.format('%s://%s.%s:%s/user', req.protocol, user.clients[0].slug, config.web.host, config.web.port);

            res.cookie(config.cookies.userName, user.firstName);
            res.cookie(config.cookies.userpic, user.avatarUrl);

            res.redirect(url);
        }
        else {
            var url = util.format('%s://%s.%s/user', req.protocol, user.clients[0].slug, config.web.host);

            res.redirect(url);
        }

        //if (user.roles[0].name == 'Client Admin' || user.roles[0].name == 'Client Author') {
        //    var url = util.format('%s://%s.%s:%s/', req.protocol, user.clients[0].slug, config.web.host, config.web.port);
        //    res.redirect(url);
        //} else {
        //    var url = util.format('%s://%s.%s:%s/user', req.protocol, user.clients[0].slug, config.web.host, config.web.port);
        //    res.redirect(url);
        //}
        
    };

    if(req.params.code){
        var auth = req.authWithCode;
        var model = {
            code: req.params.code
        }
    }else{
        var auth = req.auth;
        var model = {
            userName: req.body.email,
            password: req.body.password,
            tzOffset: parseInt(req.body.tzOffset)
        }
    }

    auth(model)
        .then(function(response) {

            var user = response.user;

            // Was user found? Render sign in form with error.
            if (!user) {
                // if this user isn't associated with any clients, do not allow them to log in
                if(response.noClient){
                     logger.warn('No associated client: %s', req.body.email);
                    model.flashError = 'You are not associated with any clients.';
                    return res.render(_title('Login'), 'app/session/login', model, 'app');
                }

                // all other log in failures...
                logger.warn('User failed to login: %s', req.body.email);
                model.flashError = 'Invalid user name or password.';
                return res.render(_title('Login'), 'app/session/login', model, 'app');
            }


            if(req.body.email && req.body.password) {
                // Cache the api key
                user.apiKey = new Buffer(req.body.email + ':' + req.body.password).toString('base64');
                user.authHeader = {'Authorization': ('Basic ' + user.apiKey)};
            }
            else{
                user.apiKey = user.accessToken;
                user.accessToken = undefined;
                user.authHeader =  {'Authorization': ('Bearer ' + user.apiKey)};
            }

            // Log user in!
            req.login(user, function() {

                logger.info('User (%d) %s %s - Logged in.', user.id, user.firstName, user.lastName);

                if (!req.body.rememberMe || req.body.rememberMe != 'on') {
                    res.clearCookie(config.cookies.rememberMe);
                    res.clearCookie(config.cookies.rememberMeChecked);

                    return redirectAsNeeded(req, res, user);
                }

                // Issue the remember me token
                services.session.issueRememberMeToken(user, function(err, token) {
                    if (err) { return next(err); }
                    res.cookie(config.cookies.rememberMe, token, { domain: '.' + config.web.host ,path: '/', httpOnly: true, maxAge: 604800000 * 4 });
                    res.cookie(config.cookies.rememberMeChecked, 'yes', { domain: '.' + config.web.host, path: '/', httpOnly: false, maxAge: 604800000 * 4 });
                    redirectAsNeeded(req, res, user);
                })
            });
        })
        .catch(function(err) {
            logger.error(err);
            model.flashError = 'Cannot sign in at this time.';
            res.render(_title('Login'), 'app/session/login', model, 'app');
        });
};

// Handle logout.
exports.logout = function(req) {
    req.logoutEx();
};

// Touch session
exports.touch = function(req, res) {
    res.end('OK');
};

// Touch session
exports.refresh = function(req, res) {
    req.session.passport.user.avatarUrl = req.query.avatarUrl;
    req.login(req.session.passport.user, function(err) {
            if (err) return next(err);
            res.end('OK');
        });
};