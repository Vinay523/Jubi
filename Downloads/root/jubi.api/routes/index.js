var express = require('express');
var util = require('util');
var router = express.Router();


var controllers = {
    auth: require('../controllers/auth'),
    badges: require('../controllers/models/badges'),
    todos: require('../controllers/models/todos'),
    challenges: require('../controllers/models/challenges'),
    challengeQuestionTypes: require('../controllers/models/challengeQuestionType'),
    clients: require('../controllers/models/clients'),
    clientRoles: require('../controllers/models/clientRoles'),
    forum: require('../controllers/forum'),
    authoring: require('../controllers/models/authoring'),
    login: require('../controllers/login'),
    media: require('../controllers/media'),
    passwordReset: require('../controllers/models/passwordReset'),
    programs: require('../controllers/models/programs'),
    quests: require('../controllers/models/quests'),
    roles: require('../controllers/models/roles'),
    users: require('../controllers/models/users'),
    stats: require('../controllers/stats'),
    distributionPartner: require('../controllers/models/distributionPartner')
};

//******************************
// Root Routing
//******************************
router.route('/')
    .all(function (req, res) {
        res.json({version: config.version});
    });

//******************************
// Distribution Partner Routing
//******************************
router.route('/distribution').post(controllers.distributionPartner.PurchaseProgram);

//******************************
// Media Routing
//******************************

router.route('/ui').post(controllers.auth.isAuthenticated, controllers.media.postUserImage);
router.route('/si').post(controllers.auth.isAuthenticated, controllers.media.postSystemImage);
router.route('/ui/square').post(controllers.auth.isAuthenticated, controllers.media.postUserSquareImage);
router.route('/si/square').post(controllers.auth.isAuthenticated, controllers.media.postSystemSquareImage);

router.route('/uv').post(controllers.auth.isAuthenticated, controllers.media.postUserVideo);
router.route('/sv').post(controllers.auth.isAuthenticated, controllers.media.postSystemVideo);
router.route('/uv/encoded').get(controllers.auth.isAuthenticated, controllers.media.isUserVideoEncoded);
router.route('/sv/encoded').get(controllers.auth.isAuthenticated, controllers.media.isSystemVideoEncoded);
router.route('/sv/get-available-formats/:data').get(controllers.auth.isAuthenticated, controllers.media.getAvailableFormats);

router.route('/ua').post(controllers.auth.isAuthenticated, controllers.media.postUserAudio);
router.route('/sa').post(controllers.auth.isAuthenticated, controllers.media.postSystemAudio);

router.route('/ui/:key').get(function (req, res) {
    controllers.media.renderImage(req, res, false, null);
});
router.route('/si/:key').get(function (req, res) {
    controllers.media.renderImage(req, res, true, null);
});
router.route('/ui/:key/:size').get(function (req, res) {
    controllers.media.renderImage(req, res, false, req.params.size);
});
router.route('/si/:key/:size').get(function (req, res) {
    controllers.media.renderImage(req, res, true, req.params.size);
});

router.route('/uv/:key').get(function (req, res) {
    controllers.media.renderVideo(req, res, false);
});
router.route('/sv/:key').get(function (req, res) {
    controllers.media.renderVideo(req, res, true);
});

router.route('/ua/:key').get(function (req, res) {
    controllers.media.renderAudio(req, res, false);
});
router.route('/sa/:key').get(function (req, res) {
    controllers.media.renderAudio(req, res, true);
});

router.route('/ur').post(controllers.auth.isAuthenticated, controllers.media.postUserResource);
router.route('/sr').post(controllers.auth.isAuthenticated, controllers.media.postSystemResource);

router.route('/ur/:key').get(function (req, res) {
    controllers.media.renderResource(req, res, false);
});
router.route('/sr/:key').get(function (req, res) {
    controllers.media.renderResource(req, res, true);
});


//******************************
// Auth and Security
//******************************
router.route('/login')
    .post(controllers.login.authenticate);

router.route('/session-auth/:key/:sessionId')
    .post(controllers.login.authenticateUserWithSession);

router.route('/get-authenticate-session-link/:key')
    .get(controllers.login.getAuthenticateSessionLink);

router.route('/login-with-code')
    .post(controllers.login.authenticateWithCode);

router.route('/me')
    .get(controllers.auth.isAuthenticated, controllers.login.me);

router.route('/forgot-password')
    .post(controllers.login.postForgotPassword);

router.route('/reset-password')
    .post(controllers.login.postResetPassword);


router.route('/restart-session/:id([0-9]+)')
    .get(controllers.auth.isAuthenticated, controllers.login.restartSession);

router.route('/logout')
    .delete(controllers.auth.isAuthenticated, controllers.login.logout);

router.route('/change-password/:userData')
    .post(controllers.passwordReset.changePassword);

router.route('/clients')
    .get(controllers.auth.isAuthenticated, controllers.clients.action('retrieveClientListing'));

router.route('/clients/content-consumers')
    .get(controllers.auth.isAuthenticated, controllers.clients.action('retrieveContentConsumersClients'));

router.route('/clients')
    .post(controllers.auth.isAuthenticated, controllers.clients.action('createClient'));

router.route('/clients/:id([0-9]+)')
    .get(controllers.auth.isAuthenticated, controllers.clients.action('retrieveClient'));

router.route('/clients/:id([0-9]+)')
    .put(controllers.auth.isAuthenticated, controllers.clients.action('updateClient'))
    .delete(controllers.auth.isAuthenticated, controllers.clients.action('deleteItem'));

router.route('/clients/:id([0-9]+)/users')
    .get(controllers.auth.isAuthenticated, controllers.clients.getClientUsers);

router.route('/clients/:id([0-9]+)/programs')
    .get(controllers.auth.isAuthenticated, controllers.clients.getClientPrograms);

router.route('/clients/:clientId([0-9]+)/programs/:programId([0-9]+)/licenses')
    .get(controllers.auth.isAuthenticated, controllers.clients.getClientProgramLicenses);

router.route('/clients/:id([0-9]+)/users/:userId([0-9]+)')
    .delete(controllers.auth.isAuthenticated, controllers.clients.deleteUser);

router.route('/clients/:id([0-9]+)/users/import')
    .post(controllers.auth.isAuthenticated, controllers.clients.importUsers);

router.route('/clients/count/deleted')
    .get(controllers.auth.isAuthenticated, controllers.clients.action('retrieveDeletedCount'));

router.route('/clients/:id([0-9]+)/restore')
    .post(controllers.auth.isAuthenticated, controllers.clients.action('restore'));

router.route('/clients/check-slug')
    .post(controllers.auth.isAuthenticated, controllers.clients.action('checkSlug'));

router.route('/clients/:id([0-9]+)/programs/check-slug')
    .post(controllers.auth.isAuthenticated, controllers.clients.action('checkProgramSlug'));

router.route('/client/programs/:id([0-9]+)/check-title')
    .post(controllers.auth.isAuthenticated, controllers.clients.action('checkProgramTitle'));

router.route('/clients/:clientId([0-9]+)/get-client-assign-programs')
    .get(controllers.auth.isAuthenticated, controllers.clients.action('getClientProgramsForAssign'));

router.route('/client-roles')
    .get(controllers.auth.isAuthenticated, controllers.clientRoles.action('retrieveAll'));

router.route('/content-providers/:id/programs')
    .get(controllers.auth.isAuthenticated, controllers.programs.action('retrieveByContentProvider'));


router.route('/programs')
    .get(controllers.auth.isAuthenticated, controllers.programs.action('retrieveProgramListing'));
router.route('/programs/all')
    .get(controllers.auth.isAuthenticated, controllers.programs.action('retrieveProgramListingAll'));

router.route('/programs')
    .post(controllers.auth.isAuthenticated, controllers.programs.action('create'));

router.route('/programs/create')
    .post(controllers.auth.isAuthenticated, controllers.programs.action('createSimple'));

router.route('/programs/license-to-client')
    .post(controllers.auth.isAuthenticated, controllers.programs.action('licenseProgramToClient'));

router.route('/programs/duplicate')
    .post(controllers.auth.isAuthenticated, controllers.programs.action('duplicateProgram'));

router.route('/programs/update-license')
    .post(controllers.auth.isAuthenticated, controllers.programs.action('updateProgramLicense'));

router.route('/programs/remove-license')
    .post(controllers.auth.isAuthenticated, controllers.programs.action('removeProgramLicense'));

router.route('/programs/remove-autosaved')
    .post(controllers.auth.isAuthenticated, controllers.programs.action('removeAutoSavedProgram'));

router.route('/programs/user')
    .get(controllers.auth.isAuthenticated, controllers.programs.action('retrieveProgramListingUser'));

router.route('/programs-simple/user')
    .get(controllers.auth.isAuthenticated, controllers.programs.action('retrieveProgramListingSimpleUser'));

router.route('/program-detail/:slug/user')
    .get(controllers.auth.isAuthenticated, controllers.programs.action('retrieveProgramDetailUser'));

router.route('/programs/:ref')
    .get(controllers.auth.isAuthenticated, controllers.programs.action('retrieveProgramEdit'))
    .put(controllers.auth.isAuthenticated, controllers.programs.action('update'))
    .delete(controllers.auth.isAuthenticated, controllers.programs.action('deleteProgram'));

router.route('/programs/:ref/user')
    .get(controllers.auth.isAuthenticated, controllers.programs.action('retrieveProgramUser'));

router.route('/programs/:ref/user-by-progress')
    .get(controllers.auth.isAuthenticated, controllers.programs.action('retrieveProgramUserByProgress'));

router.route('/programs/:ref/published')
    .put(controllers.auth.isAuthenticated, controllers.programs.action('updatePublished'));

router.route('/programs/:ref/quests')
    .get(controllers.auth.isAuthenticated, controllers.quests.action('retrieveByProgram'));

router.route('/programs/:ref/forum')
    .get(controllers.auth.isAuthenticated, controllers.programs.action('retrieveProgramForum'))
    .post(controllers.auth.isAuthenticated, controllers.programs.action('updateProgramForum'));

router.route('/programs/:linkId([0-9]+)/version-cleanup')
    .post(controllers.auth.isAuthenticated, controllers.programs.action('cleanupProgramVersions'));

router.route('/programs/resequence')
    .post(controllers.auth.isAuthenticated, controllers.programs.action('resequence'));

router.route('/program/:programId([0-9]+)/todos/buddy')
    .get(controllers.auth.isAuthenticated, controllers.todos.action('getBuddyTodos'));

router.route('/quests')
    //.get(controllers.auth.isAuthenticated, controllers.quests.action('retrieveAll'))
    .post(controllers.auth.isAuthenticated, controllers.quests.action('create'));

router.route('/quests/:id')
    .get(controllers.auth.isAuthenticated, controllers.quests.action('retrieve'))
    .put(controllers.auth.isAuthenticated, controllers.quests.action('update'))
    .delete(controllers.auth.isAuthenticated, controllers.quests.action('deleteItem'));

router.route('/quests/resequence')
    .post(controllers.auth.isAuthenticated, controllers.quests.action('resequence'));

router.route('/activities/:id/challenges')
    .get(controllers.auth.isAuthenticated, controllers.challenges.action('retrieveByActivity'));

router.route('/challenges')
    //.get(controllers.auth.isAuthenticated, controllers.challenges.action('retrieveAll'))
    .post(controllers.auth.isAuthenticated, controllers.challenges.action('create'));

router.route('/challenges/:id')
    .get(controllers.auth.isAuthenticated, controllers.challenges.action('retrieve'))
    .put(controllers.auth.isAuthenticated, controllers.challenges.action('update'))
    .delete(controllers.auth.isAuthenticated, controllers.challenges.action('deleteItem'));

router.route('/challenges/:id/complete')
    .post(controllers.auth.isAuthenticated, controllers.challenges.action('createResult'));

router.route('/challenges/resequence')
    .post(controllers.auth.isAuthenticated, controllers.challenges.action('resequence'));

router.route('/challenge-question-types')
    .get(controllers.challengeQuestionTypes.action('retrieveAll'))
    .post(controllers.auth.isAuthenticated, controllers.challengeQuestionTypes.action('create'));

router.route('/challenge-question-types/:id')
    .get(controllers.challengeQuestionTypes.action('retrieve'))
    .put(controllers.auth.isAuthenticated, controllers.challengeQuestionTypes.action('update'))
    .delete(controllers.auth.isAuthenticated, controllers.challengeQuestionTypes.action('deleteItem'));

router.route('/badges/award-badges')
    .post(controllers.auth.isAuthenticated, controllers.badges.action('awardBadges'));

router.route('/badges/quest-badge')
    .post(controllers.auth.isAuthenticated, controllers.badges.action('getQuestBadge'));

router.route('/todos')
    .get(controllers.auth.isAuthenticated, controllers.todos.action('getUserTodos'));



router.route('/todo/update')
    .post(controllers.auth.isAuthenticated, controllers.todos.action('updateUserTodo'));


router.route('/todo/mark-as-read')
    .post(controllers.auth.isAuthenticated, controllers.todos.action('markUserTodoRead'));

router.route('/todo/result/:resultId([0-9]+)/delete')
    .post(controllers.auth.isAuthenticated, controllers.todos.action('removeTodoChallengeResult'));

router.route('/program-users/:id([0-9]+)/add-buddy')
    .post(controllers.auth.isAuthenticated, controllers.users.action('addBuddy'));

router.route('/program-users/:id([0-9]+)/remove-buddy')
    .post(controllers.auth.isAuthenticated, controllers.users.action('removeBuddy'));

router.route('/users')
    .get(controllers.auth.isAuthenticated, controllers.users.action('retrieveAll'))
    .post(controllers.auth.isAuthenticated, controllers.users.action('create'));

router.route('/users/table')
    .get(controllers.auth.isAuthenticated, controllers.users.action('retrieveAllPagedFilteredAndSorted'));

router.route('/client/users/table')
    .get(controllers.auth.isAuthenticated, controllers.users.action('retrieveByClientPagedFilteredAndSorted'));

router.route('/users/get-assign-programs')
    .get(controllers.auth.isAuthenticated, controllers.users.action('getProgramsForAssign'));


router.route('/program/:programId([0-9]+)/network/:linkId([0-9]+)')
    .get(controllers.auth.isAuthenticated, controllers.users.action('retrieveUsersForNetwork'));

router.route('/program/:programId([0-9]+)/network-users/:linkId([0-9]+)')
    .get(controllers.auth.isAuthenticated, controllers.users.action('retrieveUsersForNetworkSimple'));

router.route('/program/:programId([0-9]+)/networkUser/:id')
    .get(controllers.auth.isAuthenticated, controllers.users.action('retrieveNetworkUser'));

router.route('/users/:id')
    .get(controllers.auth.isAuthenticated, controllers.users.action('retrieve'))
    .put(controllers.auth.isAuthenticated, controllers.users.action('update'))
    .delete(controllers.auth.isAuthenticated, controllers.users.action('deleteUser'));

router.route('/users/count/deleted')
    .get(controllers.auth.isAuthenticated, controllers.users.action('retrieveDeletedCount'));

router.route('/auth/get-security-code')
    .get(controllers.auth.isAuthenticated, controllers.users.getSecurityCode);

router.route('/auth/redirect/:code')
    .get(controllers.users.redirectToUi);

router.route('/users/:id([0-9]+)/restore')
    .post(controllers.auth.isAuthenticated, controllers.users.action('restore'));

router.route('/users/check-email')
    .post(controllers.auth.isAuthenticated, controllers.users.action('checkEmail'));

router.route('/users/cancel-email-update')
    .post(controllers.auth.isAuthenticated, controllers.users.action('cancelEmailUpdate'));

router.route('/users/validate-email-update-token/:token')
    .post(controllers.users.action('validateEmailUpdate'));

router.route('/users/assign-program-user')
    .post(controllers.auth.isAuthenticated, controllers.users.action('assignProgramUser'));

router.route('/client/users/bulk-assign-program-users')
    .post(controllers.auth.isAuthenticated, controllers.users.action('bulkAssignProgramUsers'));

router.route('/client/users/bulk-unassign-program-users')
    .post(controllers.auth.isAuthenticated, controllers.users.action('bulkUnassignProgramUsers'));

router.route('/users/remove-program-user')
    .post(controllers.auth.isAuthenticated, controllers.users.action('unassignProgramUser'));

router.route('/program-user-group/create')
    .post(controllers.auth.isAuthenticated, controllers.users.action('createProgramUserGroup'));

router.route('/program-user-group/:groupId([0-9]+)/delete')
    .post(controllers.auth.isAuthenticated, controllers.users.action('deleteProgramUserGroup'));

router.route('/program-user-groups/:linkId([0-9]+)')
    .get(controllers.auth.isAuthenticated, controllers.users.action('getProgramUserGroups'));

router.route('/roles')
    .get(controllers.auth.isAuthenticated, controllers.roles.action('retrieveAll'))
    .post(controllers.auth.isAuthenticated, controllers.roles.action('create'));

router.route('/roles/:id')
    .get(controllers.auth.isAuthenticated, controllers.roles.action('retrieve'))
    .put(controllers.auth.isAuthenticated, controllers.roles.action('update'))
    .delete(controllers.auth.isAuthenticated, controllers.roles.action('deleteItem'));

router.route('/programandquest/:id')
    .get(controllers.auth.isAuthenticated, controllers.programs.action('retrieveProgramEdit'));

router.route('/forum/create')
    .post(controllers.auth.isAuthenticated, controllers.forum.createForum);

router.route('/forum/category/:categoryId([0-9]+)/has-topics')
    .get(controllers.auth.isAuthenticated, controllers.forum.checkIfCategoryHasTopics);

router.route('/forum/:forumId([0-9]+)/topics/:topicId([0-9]+)')
    .get(controllers.auth.isAuthenticated, controllers.forum.getTopic)
    .delete(controllers.auth.isAuthenticated, controllers.forum.deleteTopic);

router.route('/forum/:forumId([0-9]+)/comments/:commentId([0-9]+)')
    .delete(controllers.auth.isAuthenticated, controllers.forum.deleteComment);



router.route('/forum/:forumId([0-9]+)/topics/:topicId([0-9]+)/comments')
    .post(controllers.auth.isAuthenticated, controllers.forum.postComment)
    .delete(controllers.auth.isAuthenticated, controllers.forum.deleteComment);

router.route('/forum/:forumId([0-9]+)/topics')
    .get(controllers.auth.isAuthenticated, controllers.forum.getTopics)
    .post(controllers.auth.isAuthenticated, controllers.forum.postTopic);

router.route('/forum/:forumId([0-9]+)/categories')
    .get(controllers.auth.isAuthenticated, controllers.forum.getCategories);


router.route('/program/:programId([0-9]+)/forum/:forumId([0-9]+)/user-content')
    .get(controllers.auth.isAuthenticated, controllers.forum.getUserAvailableContent);

router.route('/forum/:forumId([0-9]+)/like')
    .post(controllers.auth.isAuthenticated, controllers.forum.postLike);

router.route('/forum/:forumId([0-9]+)/dislike')
    .post(controllers.auth.isAuthenticated, controllers.forum.postDislike);


router.route('/authoring/configurations')
    .get(controllers.auth.isAuthenticated, controllers.authoring.action('getConfigurations'))
    .post(controllers.auth.isAuthenticated, controllers.authoring.action('saveConfigurations'));


//******************************
// Stats Routing
//******************************
router.route('/stats/program-user-stats')
    .post(controllers.auth.isAuthenticated, controllers.stats.getProgramUserStats);

router.route('/stats/program-poll-questions')
    .post(controllers.auth.isAuthenticated, controllers.stats.getProgramPollQuestions);

router.route('/stats/poll-results')
    .post(controllers.auth.isAuthenticated, controllers.stats.getPollResults);

router.route('/stats/completed-challenges')
    .post(controllers.auth.isAuthenticated, controllers.stats.getCompletedChallenges);


/**************************************/
    //Check Corrupt Todo Routing
/*************************************/

//router.route('/corruptTodo')
//    .post(controllers.auth.isAuthenticated, controllers.programs.action('checkCorruptTodo'));


module.exports = router;
