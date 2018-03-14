var controllers = require('../controllers/user');
var util = require('util');
var express = require('express');

var router = express.Router();


var authAndSetClient = function (req, res, next) {
    if (!req.isAuth()) return;

    var parts = req.get('host').split('.');
    if (parts.length < 3) {
        return res.redirect(util.format('//%s.%s.%s%s',
            req.user.clients[0].slug, parts[0], parts[1], req.originalUrl));
    }
    next();
};



// GET: /
router.get('/', authAndSetClient, controllers.program.getHome);

// GET: /program/preview
router.get('/program/preview', authAndSetClient, controllers.program.getPreview);

// GET: /program/:slug/quests
router.get('/program/:slug/quests', authAndSetClient, controllers.quests.getQuests);
// GET: /program/:slug/quest/:id([0-9]+)
router.get('/program/:slug/quest-player/quest/:id', authAndSetClient, controllers.quests.getQuestPlayer);

// GET: /program/:slug/network
router.get('/program/:slug/network', authAndSetClient, controllers.network.getHome);

// GET: /program/:slug/todo-management
router.get('/program/:slug/todo-management', authAndSetClient, controllers.discussion.getTodoManagement);

// GET: /program/:slug/discussion
router.get('/program/:slug/discussion', authAndSetClient, controllers.discussion.getForum);
////// GET: /program/:slug/discussion/:topicId([0-9]+)
//router.get('/program/:slug/discussion#/:topicId([0-9]+)', authAndSetClient, controllers.discussion.getTopic);

// GET: /program/:slug/activity
router.get('/program/:slug/activity', authAndSetClient, controllers.activity.getHome);
// GET: /program/:slug/leader-board
router.get('/program/:slug/leaderboard', authAndSetClient, controllers.leaderBoard.getHome);
// GET: /program/:slug/resources
router.get('/program/:slug/resources', authAndSetClient, controllers.resources.getHome);

// GET: /program/:slug/dashboard
router.get('/program/:slug/dashboard', authAndSetClient, controllers.dashboard.getHome);

// GET: /Profile 
router.get('/profile', authAndSetClient, controllers.profile.getHome);

// GET: /Profile
router.get('/program/:slug/network-profile/:userId([0-9]+)', authAndSetClient, controllers.profile.getNetworkProfile);


module.exports = router;
