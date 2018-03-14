var app = require('../../app');
var services = require('../../services');

// Get manage dashboard
exports.getDashboard = function(req, res) {
    res.render(config.appName, 'manage/views/dashboard', null, 'manage');
};

