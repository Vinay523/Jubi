var app = require('../../app');
var services = require('../../services');

// Handle home page route.
exports.getHome = function(req, res) {
    res.render(config.appName, 'admin/home/home', null, 'admin');
};
