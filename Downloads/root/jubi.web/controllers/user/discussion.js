var app = require('../../app');
var services = require('../../services');

// Render discussion page
exports.getForum = function (req, res) {
    res.render('Discussion | Powered by: ' + config.appName, 'user/views/discussion', {
        slug: req.params.slug
    }, 'user');
};

// Render do activity page
exports.getTodoManagement = function (req, res) {
    res.render('Actions | Powered by: ' + config.appName, 'user/views/todoManagement', {
        slug: req.params.slug
    }, 'user');
};

//// Render topic page
//exports.getTopic = function(req, res) {
//    res.render('Discussion | Powered by: ' + config.appName, 'user/views/forumTopic', {
//        slug: req.params.slug,
//        topicId: req.params.topicId
//    }, 'user');
//};
