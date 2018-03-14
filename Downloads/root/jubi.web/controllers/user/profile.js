var app = require('../../app');
var services = require('../../services');

// Render profile page	
exports.getHome = function(req, res) {
	res.render('Network | Powered by: ' + config.appName, 'user/views/profile',{
        userId: 0
    },  'user');
};

exports.getNetworkProfile = function(req, res) {
    res.render('Network | Powered by: ' + config.appName, 'user/views/networkProfile',{
        userId: req.params.userId,
        slug: req.params.slug,
        ret: req.query.ret
    },  'user');
};
