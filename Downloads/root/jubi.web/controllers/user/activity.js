var app = require('../../app');
var services = require('../../services');

// Render quest board
exports.getHome = function(req, res) {
    res.render('Collaborate | Powered by: ' + config.appName, 'user/views/activity', {
        slug: req.params.slug
    }, 'user');
};
