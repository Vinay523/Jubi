var app = require('../../app');
var services = require('../../services');

// Render dashboard page
exports.getHome = function(req, res) {
    res.render('Dashboard | Powered by: ' + config.appName, 'user/views/dashboard', {
        slug: req.params.slug
    }, 'user');
};