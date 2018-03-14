var controllers = require('../controllers/manage');
var services = require('../services');

var util = require('util');
var express = require('express');

var router = express.Router();


var authAndSetClient = function(req, res, next) {
    if (!req.authorizeById(services.session.roleIds.ClientAuthor)) return;

    var parts = req.get('host').split('.');
    if (parts.length < 3) {
        return res.redirect(util.format('//%s.%s.%s%s',
            req.user.clients[0].slug, parts[0], parts[1], req.originalUrl));
    }
    next();
};


// GET: / or /dashboard
//router.get('/', authAndSetClient, function(req, res) { res.redirect('manage/dashboard'); });
//router.get('/manage', authAndSetClient, function(req, res) { res.redirect('dashboard'); });
router.get('/', authAndSetClient, function(req, res) { res.redirect('/manage/authoring-suite/programs'); });
router.get('/manage', authAndSetClient, function(req, res) { res.redirect('/manage/authoring-suite/programs'); });
//router.get('/dashboard', authAndSetClient, controllers.dashboard.getDashboard);
router.get('/dashboard', authAndSetClient, function(req, res) { res.redirect('/manage/authoring-suite/programs'); });


// GET: /authoring-suite
router.get('/authoring-suite', authAndSetClient, function(req, res) { res.redirect('/authoring-suite/programs'); });

// GET: /authoring-suite/end-preview
router.get('/authoring-suite/end-preview', authAndSetClient, controllers.authoringSuite.getEndPreview);

// GET: /authoring-suite/programs
router.get('/authoring-suite/programs', authAndSetClient, controllers.authoringSuite.getPrograms);

// GET: /authoring-suite/program/:slug/edit
router.get('/authoring-suite/program/:slug/edit', authAndSetClient, controllers.authoringSuite.getEditProgram);
// GET: /authoring-suite/program/:slug/edit/edit/quests
router.get('/authoring-suite/program/:slug/edit/quests', authAndSetClient, controllers.authoringSuite.getEditQuests);
// GET: /authoring-suite/program/:slug/edit/levels
router.get('/authoring-suite/program/:slug/edit/levels', authAndSetClient, controllers.authoringSuite.getLevels);
// GET: /authoring-suite/program/:slug/edit/scoring
router.get('/authoring-suite/program/:slug/edit/scoring', authAndSetClient, controllers.authoringSuite.getScoring);
// GET: /authoring-suite/program/:slug/edit/badges
router.get('/authoring-suite/program/:slug/edit/badges', authAndSetClient, controllers.authoringSuite.getBadges);
// GET: /authoring-suite/program/:slug/edit/todos
router.get('/authoring-suite/program/:slug/edit/todos', authAndSetClient, controllers.authoringSuite.getTodos);
// GET: /authoring-suite/program/:slug/edit/discussion
router.get('/authoring-suite/program/:slug/edit/discussion', authAndSetClient, controllers.authoringSuite.getDiscussion);
// GET: /program/:slug/discussion
router.get('/authoring-suite/program/:slug/edit/inspiration', authAndSetClient, controllers.authoringSuite.getInspiration);
/*// GET: /authoring-suite/inspirations
router.get('/authoring-suite/inspirations', authAndSetClient, controllers.authoringSuite.getInspirations);;*/
// GET: /authoring-suite/achievements
router.get('/authoring-suite/achievements', authAndSetClient, controllers.authoringSuite.getAchievements);

module.exports = router;