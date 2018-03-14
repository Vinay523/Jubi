var app = require('../../app');
var services = require('../../services');
var util = require('util');


var makeTitle = function(title) {
    return util.format('%s | Powered by: %s', title, config.appName);
};

// Get authoring suite home page
exports.getHome = function(req, res) {
    res.render(makeTitle('Authoring Suite'), 'manage/views/authoringSuite/index', null, 'manage');
};

// End preview and return to authoring suite
exports.getEndPreview = function(req, res) {
    var parts = req.query.preview.split('/');

    var url = '/manage/authoring-suite/program/' + parts[2] + '/edit#/program';
    if (parts.length >= 5) url += '/quest/' + parts[4];
    //else if (parts.length == 7) url += '/quest/' + parts[4];

    res.redirect(url);
};

// Get authoring suite programs page
exports.getPrograms = function(req, res) {
    res.render(makeTitle('Programs'), 'manage/views/authoringSuite/index', null, 'manage');
};

// Get authoring suite program edit page
exports.getEditProgram = function(req, res) {
    var slug = req.params.slug;
    var restore = req.query.restore ? parseInt(req.query.restore) : 0;

    res.render(makeTitle('Edit Program'), 'manage/views/authoringSuite/program/editProgram', {
        slug: slug,
        restore: restore
    }, 'manage');
};

// Get authoring suite program edit page
exports.getEditQuests = function(req, res) {
    var slug = req.params.slug;
    var restore = req.query.restore ? parseInt(req.query.restore) : 0;

    res.render(makeTitle('Edit Activity'), 'manage/views/authoringSuite/program/editQuests', {
        slug: slug,
        restore: restore
    }, 'manage');
};
// Get authoring suite scoring page
exports.getScoring = function(req, res) {
    var slug = req.params.slug;
    var restore = req.query.restore ? parseInt(req.query.restore) : 0;
    res.render(makeTitle('Scoring'), 'manage/views/authoringSuite/scoring/scoring', { slug: slug, restore: restore }, 'manage');
};

// Get authoring suite badges page
exports.getBadges = function(req, res) {
    var slug = req.params.slug;
    var restore = req.query.restore ? parseInt(req.query.restore) : 0;
    res.render(makeTitle('Badges'), 'manage/views/authoringSuite/badges/badges', { slug: slug, restore: restore }, 'manage');
};

// Get authoring suite levels page
exports.getLevels = function(req, res) {
    var slug = req.params.slug;
    var restore = req.query.restore ? parseInt(req.query.restore) : 0;

    res.render(makeTitle('Levels'), 'manage/views/authoringSuite/levels/levels', { slug: slug, restore: restore }, 'manage');
};

// Get authoring suite Todos page
exports.getTodos = function(req, res) {
    var slug = req.params.slug;
    var restore = req.query.restore ? parseInt(req.query.restore) : 0;
    res.render(makeTitle('Do Activity'), 'manage/views/authoringSuite/todos/todos', { slug: slug, restore: restore }, 'manage');
};

// Get authoring suite discussion page
exports.getDiscussion = function(req, res) {
    var slug = req.params.slug;
    var restore = req.query.restore ? parseInt(req.query.restore) : 0;
    res.render(makeTitle('Discussion'), 'manage/views/authoringSuite/discussion/discussion', { slug: slug, restore: restore }, 'manage');
};

// Get authoring suite discussion page
exports.getInspiration = function(req, res) {
    var slug = req.params.slug;
    var restore = req.query.restore ? parseInt(req.query.restore) : 0;
    res.render(makeTitle('Inspiration'), 'manage/views/authoringSuite/inspiration/inspiration', { slug: slug, restore: restore }, 'manage');
};


// Get authoring suite inspirations page
exports.getInspirations = function(req, res) {
    res.render(makeTitle('Inspirations'), 'manage/views/authoringSuite/inspirations', null, 'manage');
};

// Get authoring suite achievements page
exports.getAchievements = function(req, res) {
    res.render(makeTitle('Achievements'), 'manage/views/authoringSuite/achievements', null, 'manage');
};



// Get authoring suite activities page ( this is redundant. We are going to rename Quests page and reskin that. )
//exports.getActivities = function (req, res) {
//    var slug = req.params.slug;
//    var restore = req.query.restore ? parseInt(req.query.restore) : 0;
//    res.render(makeTitle('Activities'), 'manage/views/authoringSuite/activities/activities', { slug: slug, restore: restore }, 'manage');
//};

