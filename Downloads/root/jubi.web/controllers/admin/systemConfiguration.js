var app = require('../../app');
var services = require('../../services');

// User listing page
exports.getHome = function(req, res) {
    res.render(config.appName, 'admin/systemConfiguration/systemConfiguration', {}, 'admin');
};



