var controllers = require('../controllers/app');
var util = require('util');
var express = require('express');
var router = express.Router();

//var removeClient = function(req, res, next) {
//    var parts = req.get('host').split('.');
//    if (parts.length > 2) {
//        return res.redirect(util.format('//%s.%s%s',
//            parts[parts.length-2], parts[parts.length-1], req.originalUrl));
//    }
//    next();
//};

// GET: /
router.get('/', controllers.home.getHome);
// GET: /about-us
router.get('/about-us', controllers.home.getAboutUs);


// GET: /login
router.get('/login', controllers.session.getLogin);
// POST: /login
router.post('/login', controllers.session.postLogin);


// GET: /login-with-code
router.get('/auth/redirect/:code', controllers.session.postLogin);
// GET: /ssoAuthenticate
router.get('/authenticate/:key', controllers.session.getSSOAuthenticate);
router.get('/authenticate/:key/:authenticated/:sessionId', controllers.session.authenticateWithSession);


// GET: /logout
router.get('/logout', controllers.session.logout);

// GET: /forgot-password
router.get('/forgot-password',  controllers.home.getForgotPassword);
// POST: /forgot-password
router.post('/forgot-password',  controllers.home.postForgotPassword);

// GET: /reset-password
router.get('/reset-password', controllers.home.getResetPassword);
// POST: /reset-password
router.post('/reset-password', controllers.home.postResetPassword);

// GET: /touch-session
router.get('/touch-session', controllers.session.touch);
// GET: /touch-session
router.get('/refresh-session', controllers.session.refresh);
// POST: /login-reset
router.post('/login-reset', controllers.session.postLoginReset);

// GET: /
router.get('/corruptTodo', controllers.home.getCorruptTodo);

module.exports = router;
