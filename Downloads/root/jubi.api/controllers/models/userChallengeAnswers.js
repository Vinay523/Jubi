var models = require('../../models');
var controllerBase = require('./controllerBase');
var services = require('../../services/index');

var util = require('util');
var _ = require('underscore');
var async = require('async');
var Q = require('q');


function userChallengeAnswersController(model) { controllerBase.call(this, model); }
util.inherits(userChallengeAnswersController, controllerBase);
var controller = new userChallengeAnswersController(models.userchallengeanswers);
 
userChallengeAnswersController.prototype.create = function (req, res) {
    models.sequelize.transaction({ isolationLevel: models.sequelize.Transaction.ISOLATION_LEVELS.ISOLATION_LEVELS.READ_COMMITTED }).then(function (t) {
        async.waterfall([
                // Create the program
                function(callback) {
                    models.userChallengeAnswers.create({
						answer:req.body.data.answer,
						challengeQuestionId:req.body.data.challengequestionid,
						userId:req.body.data.userid
			        }, {transaction: t})
                        .then(function(userChallengeAnswers) { res.sendSuccess(null); callback(null, userChallengeAnswers); })
                        .catch(function(err) {services.helpers.handleReject(err, callback); });
                }
             ],
            function(err) {
                if (err) {
                    // Rollback transaction
                    t.rollback().then(function() { res.sendError(err); });
                    return null;
                }
                // Commit changes
                t.commit();
           });
    });
};
module.exports = controller;