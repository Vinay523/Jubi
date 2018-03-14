var app = require('../../app');
var services = require('../../services');

// Render quest board
exports.getHome = function(req, res) {
    res.render('Leaderboard | Powered by: ' + config.appName, 'user/views/leaderBoard', {
        slug: req.params.slug
    }, 'user');
};
