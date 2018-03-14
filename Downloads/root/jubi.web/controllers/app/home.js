var app = require('../../app');
var services = require('../../services');
var request = require('request');

var _title = function(title) {
    if (!title) return config.appName;
    return title + ' | Powered by ' + config.appName;
};


// Handle home page route.
exports.getHome = function(req, res) {
    if (req.query.token) {
        request.post(config.web.apiUrl + '/users/validate-email-update-token/' + req.query.token, { rejectUnauthorized: false },
            function() {
                req.logoutEx();
            });
    } else {
        
        res.render(_title(), 'app/static/home', null, 'app');
    }
};

// Handle about-us route.
exports.getAboutUs = function(req, res) {
    res.render(_title('About'), 'app/static/aboutUs', null, 'app');
};

// Handle forgotPassword route.
exports.getForgotPassword = function(req, res) {
    res.render(_title('Forgot Password'), 'app/static/forgotPassword', {email:null}, 'app');
};

// Handle forgotPassword route.
exports.postForgotPassword = function(req, res) {

    var model = { email: req.body.email };

    //request.debug = true;
    request.post(config.web.apiUrl + '/forgot-password', { json: model, rejectUnauthorized: false },
        function(err, response, result) {

            var model;

            // Was there an error?
            if (err || response.statusCode != 200) {
                logger.error(err || ('Error: ' + response.statusCode));

                req.session.flashError = '<strong>Submit Failed!</strong><br>Cannot submit information at this time.';
                return res.render(_title('Forgot Password'), 'app/static/forgotPassword', model, 'app');
            }
            // Valid user?
            if (result === 'na') {
                req.session.flashError = '<strong>Submit Failed!</strong><br>Invalid email address.';
                return res.render(_title('Forgot Password'), 'app/static/forgotPassword', model, 'app');
            }

            req.session.flashSuccess = '<strong>Success!</strong><br>An email has been sent with instructions about resetting your password.';
            res.redirect('/login');
        });
};

// Handle reset password get.
exports.getResetPassword = function(req, res) {
    if (!req.query.token) {
        req.session.flashError = 'No password reset token provided.';
        return res.render(_title('Reset Password'), 'app/static/resetPassword', null, 'app');
    }
    res.render(_title('Reset Password'), 'app/static/resetPassword', null, 'app');
};

// Handle reset password post.
exports.postResetPassword = function(req, res) {

    var model = {
        token: req.query.token,
        password: req.body.password
    };

    //request.debug = true;
    request.post(config.web.apiUrl + '/reset-password', { json: model, rejectUnauthorized: false },
        function(err, response, result) {

            var model;

            // Was there an error?
            if (err || response.statusCode != 200) {
                logger.error(err || ('Error: ' + response.statusCode));

                model.flashError = '<strong>Submit Failed!</strong><br>Cannot submit information at this time.';
                return res.render(_title('Forgot Password'), 'app/static/forgotPassword', model, 'app');
            }
            // Valid user?
            if (result !== 'ok') {
                model.flashError = '<strong>Submit Failed!</strong><br>' + result;
                return res.render(_title('Forgot Password'), 'app/static/forgotPassword', model, 'app');
            }

            req.session.flashSuccess = '<strong>Success!</strong><br>Your password has been updated.';
            res.redirect('/login');
        });
};


//corruptTodo
exports.getCorruptTodo = function (req, res) {
        res.render(_title(), 'app/static/corruptTodo', null, 'app');
};