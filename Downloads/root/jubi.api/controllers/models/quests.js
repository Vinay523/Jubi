var models = require('../../models');
var controllerBase = require('./controllerBase');
var services = require('../../services');

var util = require('util');
var _ = require('underscore');

function QuestController(model) { controllerBase.call(this, model); }
util.inherits(QuestController, controllerBase);
var controller = new QuestController(models.Quest);


QuestController.prototype.retrieveByProgram = function (req, res) {

    var format = function(rows) {
        if (rows.length <=0) return [];

        var quests = [];
        var quest = {id:0};

        _.each(rows, function(row) {
            if (row.id != quest.id) {
                quest = {
                    id: row.id,
                    baseOrBonus: row.baseOrBonus,
                    title: row.title,
                    objective: row.objective,
                    backgroundImageUrl: services.helpers.makeMediaUrl(row.backgroundImageRef),
                    featuredImageUrl: services.helpers.makeMediaUrl(row.featuredImageRef),
                    progress: {
                        totalChallenges: 0,
                        completeChallenges: 0
                    },
                    score: {
                        points: {
                            total: 0,
                            earned: 0
                        },
                        jems: {
                            total: 0,
                            earned: 0
                        },
                        badges: {
                            total: 0,
                            earned: 0
                        }
                    }
                };
                quests.push(quest);
            }
            if (row.challengeId) {
                quest.progress.totalChallenges++;
                quest.score.points.total = row.challengePoints;

                if (row.resultId) {
                    quest.progress.completeChallenges++;
                    quest.score.points.earned = row.resultPoints;
                }
            }
        });

        return quests;
    };

    models.sequelize.query('CALL get_program_quests(?,?)', {
        raw: true,
        replacements: [req.params.ref, 0]
    })
        .then(function(rows) { res.sendSuccess(format(rows)); })
        .catch(function(err) { req.sendError(err); });
};

module.exports = controller;