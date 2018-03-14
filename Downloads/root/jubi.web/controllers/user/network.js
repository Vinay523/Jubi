var app = require('../../app');
var services = require('../../services');

// Render quest board
exports.getHome = function(req, res) {
    res.render('Network | Powered by: ' + config.appName, 'user/views/network', {
        slug: req.params.slug
    }, 'user');
};
