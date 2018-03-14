var app = require('../../app');
var services = require('../../services');

// Render quest board
exports.getQuests = function (req, res) {
    res.render('Activities | Powered by: ' + config.appName, 'user/views/quests',
        {slug: req.params.slug}, 'user');
};

// Render quest player
exports.getQuestPlayer = function (req, res) {
    res.render('Activity | Powered by: ' + config.appName, 'user/views/questPlayer',
        {slug: req.params.slug, id: parseInt(req.params.id) }, 'questPlayer');
};
