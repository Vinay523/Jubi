var app = require('../../app');
var services = require('../../services');

// Render discussion page
exports.getForum = function(req, res) {
    res.render('Discussion | Powered by: ' + config.appName, 'manage/views/inspiration', {
        slug: req.params.slug
    }, 'user');
};

