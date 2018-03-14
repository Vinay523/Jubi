var app = require('../../app');
var services = require('../../services');

// Render quest board
exports.getHome = function(req, res) {
    res.render('Resources | Powered by: ' + config.appName, 'user/views/resources', {
        slug: req.params.slug
    }, 'user');
};
