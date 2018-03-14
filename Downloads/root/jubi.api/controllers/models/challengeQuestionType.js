var models = require('../../models');

var controllerBase = require('./controllerBase');
var util = require('util');

function ChallengeQuestionTypeController(model) { controllerBase.call(this, model); }

util.inherits(ChallengeQuestionTypeController, controllerBase);

var controller = new ChallengeQuestionTypeController(models.ChallengeQuestionType);

ChallengeQuestionTypeController.prototype.retrieveAll = function(req, res) {


    this.context.findAndCountAll({
        order: 'sequence'
    })
        .then(function(result) {
            if (result == null) return res.sendSuccess({count: 0, data: null});
            res.sendSuccess({count: result.count, data: result.rows});
        })
        .catch(function(err) { res.sendError(err); });

};

module.exports = controller;