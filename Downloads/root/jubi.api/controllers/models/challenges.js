var models = require('../../models');
var services = require('../../services');
var controllerBase = require('./controllerBase');
var util = require('util');
var async = require('async');
var _ = require('underscore');
var Q = require('q');


function ChallengeController(model) {
    controllerBase.call(this, model);
}

util.inherits(ChallengeController, controllerBase);

module.exports = new ChallengeController(models.Challenge);

//Define ChallengeController Prototype.
ChallengeController.prototype.retrieveByActivity = function (req, res) {

    var id = request.params.id;

    this.context.findAndCountAll({
            where: {activity_id: id}
        })
        .success(function (result) {
            if (result == null) return res.sendSuccess({count: 0, data: null});
            res.sendSuccess({count: result.count, data: result.rows});
        });
};

ChallengeController.prototype.createResult = function (req, res) {
    models.sequelize.transaction().then(function (t) {
        var questId;
        var originalChallenge;
        async.waterfall([

                // Get the challenge
                function (callback) {
                    models.Challenge.find({
                        where: {id: req.params.id},
                        include: [
                            {
                                model: models.ChallengeQuestion,
                                as: 'questions',
                                include: [
                                    {
                                        model: models.ChallengeQuestionType,
                                        as: 'type'
                                    }
                                ]
                            },
                            {
                                model: models.Quest,
                                as: 'quest',
                                required: true,
                                include: [
                                    {
                                        model: models.Program,
                                        as: 'program',
                                        attributes: ['linkId', 'status']
                                    }
                                ]
                            },
                            {
                                model: models.ChallengeResult,
                                as: 'results',
                                where: {
                                    userId: req.user.id
                                },
                                required: false
                            }
                        ]
                    }).then(function (challenge) {
                            if (req.body.resultItems
                                && req.body.resultItems[0]
                                && req.body.resultItems[0].score != null
                                && req.body.resultItems[0].score < challenge.points) {
                                pointsEarned = req.body.resultItems[0].score;
                            }else{
                                pointsEarned = challenge.points;
                            }

                            originalChallenge = challenge;
                            questId = challenge.questId;
                            callback(null, challenge);
                        })
                        .catch(function (err) {
                            services.helpers.handleReject(err, callback);
                        })
                },
                // Create the challenge result
                function (challenge, callback) {
                    if (challenge.results.length == 0) {
                       
                        models.ChallengeResult.create({
                            points: pointsEarned,
                                challengeId: challenge.id,
                                userId: req.user.id
                            }, {transaction: t})
                            .then(function (result) {
                                logger.info('Result for challenge [%d] %s and user [%d] %s %s created.  Points earned [%d]',
                                    challenge.id, challenge.title, req.user.id, req.user.firstName, req.user.lastName, pointsEarned);
                                callback(null, challenge, result);
                            })
                            .catch(function (err) {
                                services.helpers.handleReject(err, callback);
                            });
                    } else {
                        callback(null, challenge, null)
                    }
                },
                // Create the challenge result items
                function (challenge, result, callback) {
                    if (result) {
                        async.eachSeries(req.body.resultItems,
                            function (resultItem, callback) {
                                //If the question is a narrative, find the related forum item and add a comment to it with the answer
                                if (challenge.questions.length > 0 && challenge.questions[0].type.id == services.helpers.QuestionTypes.Narrative) {
                                    models.ForumItem.find({
                                        where: {
                                            challengeId: challenge.id,
                                            title: challenge.questions[0].question,
                                            questId: challenge.quest.id
                                        }
                                    }).then(function (item) {
                                        if (item) {
                                            services.forum.comment(req.user, item.forumId, item.id, resultItem.data)
                                        } else {
                                            models.Forum.find({
                                                where: {
                                                    linkId: challenge.quest.program.linkId
                                                },
                                                include: [
                                                    {
                                                        model: models.ForumItemCategory,
                                                        as: 'categories'
                                                    }
                                                ]
                                            }).then(function (forum) {
                                                models.ForumItem.create({
                                                    type: 'topic',
                                                    forumId: forum.id,
                                                    questId: challenge.questId,
                                                    challengeId: challenge.id,
                                                    categoryId: _.findWhere(forum.categories, {name: 'Narrative Responses'}).id,
                                                    title: challenge.questions[0].question,
                                                    content: null,
                                                    contentLink: null,
                                                    contentLinkType: null,
                                                    createdById: req.user.id
                                                }).then(function (item) {
                                                    services.forum.comment(req.user, item.forumId, item.id, resultItem.data)
                                                })
                                            })
                                        }
                                    })
                                }

                                models.ChallengeResultItem.create({
                                        questionId: resultItem.questionId,
                                        answerId: resultItem.answerId,
                                        data: resultItem.data,
                                        resultId: result.id
                                    }, {transaction: t})
                                    .then(function (result) {
                                        logger.info('Result item for challenge [%d] %s created.', challenge.id, challenge.title);
                                        callback(null);
                                    })
                                    .catch(function (err) {
                                        services.helpers.handleReject(err, callback);
                                    });
                            },
                            function (err) {
                                callback(err);
                            });
                    } else {
                        callback(null);
                    }
                }
            ],
            function (err) {
                if (err) {
                    t.rollback().then(function() { res.sendError(err) });
                    return null;
                }
                t.commit().then(function() {
                    res.sendSuccess();

                    if (originalChallenge.results.length == 0) {
                        //Badges and Todos fulfillment logic
                        models.Quest.find({
                            where: {
                                id: questId
                            },
                            include: [
                                {
                                    model: models.Level,
                                    as: 'level',
                                    required: false,
                                    include: {
                                        model: models.Quest,
                                        as: 'levelQuests',
                                        include: [
                                            {
                                                model: models.Challenge,
                                                as: 'challenges',
                                                include: [
                                                    {
                                                        model: models.ChallengeResult,
                                                        as: 'results',
                                                        where: {
                                                            userId: req.user.id
                                                        },
                                                        required: false
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                },
                                {
                                    model: models.Challenge,
                                    as: 'challenges',
                                    include: [
                                        {
                                            model: models.ChallengeResult,
                                            as: 'results',
                                            where: {
                                                userId: req.user.id
                                            },
                                            required: false
                                        }
                                    ]
                                }
                            ]
                        }).then(function (quest) {
                            var badgesJustEarned = [];
                            Q.all([
                                models.UserBadge.findAll({
                                    where: {
                                        userId: req.user.id,
                                        earned: false
                                    },
                                    include: [
                                        {
                                            model: models.Badge,
                                            as: 'badge',
                                            where: {
                                                programId: quest.dataValues.programId
                                            },
                                            required: true
                                        },
                                        {
                                            model: models.UserBadgeRequirementsFulfillment,
                                            as: 'requirements',
                                            where: {
                                                fulfilled: false
                                            },
                                            include: [
                                                {
                                                    model: models.BadgeRequirement,
                                                    as: 'badgeRequirement'
                                                }
                                            ],
                                            required: false
                                        }
                                    ]

                                }),
                                models.UserTodo.findAll({
                                    where: {
                                        userId: req.user.id,
                                        status: 'locked'
                                    },
                                    include: [
                                        {
                                            model: models.Todo,
                                            as: 'todo',
                                            where: {
                                                programId: quest.dataValues.programId
                                            },
                                            required: true
                                        },
                                        {
                                            model: models.UserTodoRequirementsFulfillment,
                                            as: 'requirements',
                                            where: {
                                                fulfilled: false
                                            },
                                            include: [
                                                {
                                                    model: models.TodoRequirement,
                                                    as: 'todoRequirement'
                                                }
                                            ],
                                            required: false
                                        }
                                    ]

                                })
                            ]).spread(function (userBadges, userTodos) {
                                _.each(userBadges, function (userBadge) {
                                    _.each(userBadge.requirements, function (requirement) {
                                        if (requirement.dataValues.badgeRequirement.dataValues.requirementRef == 'Quest' && requirement.dataValues.badgeRequirement.dataValues.requirementRefId == quest.dataValues.id) {
                                            var notCompleteChallenge = _.find(quest.dataValues.challenges, function (challenge) {
                                                if (challenge.results.length == 0 && challenge.type != 'finish') {
                                                    return true;
                                                }
                                            });

                                            if (!notCompleteChallenge) {
                                                requirement.fulfilled = true;
                                                requirement.save();
                                            }
                                        }
                                        else if (quest.dataValues.level && requirement.dataValues.badgeRequirement.dataValues.requirementRef == 'Level' && requirement.dataValues.badgeRequirement.dataValues.requirementRefId == quest.dataValues.level.id) {
                                            if (quest.dataValues.level) {
                                                var hasNotCompleteQuest = false;
                                                _.find(quest.dataValues.level.levelQuests, function (quest) {
                                                    var notCompleteChallenge = _.find(quest.dataValues.challenges, function (challenge) {
                                                        if (challenge.results.length == 0 && challenge.type != 'finish') {
                                                            return true;
                                                        }
                                                    });

                                                    if (notCompleteChallenge) {
                                                        hasNotCompleteQuest = true;
                                                        return true;
                                                    }
                                                });

                                                if (!hasNotCompleteQuest) {
                                                    requirement.fulfilled = true;
                                                    requirement.save();
                                                }
                                            }
                                        }
                                    });
                                    var notCompleteRequirement = _.find(userBadge.requirements, function (requirement) {
                                        if (!requirement.fulfilled) {
                                            return true;
                                        }
                                    });

                                    if (!notCompleteRequirement && userBadge.requirements.length > 0) {
                                        if (!userBadge.earned) {
                                            badgesJustEarned.push(userBadge);
                                        }
                                        userBadge.earned = true;
                                        userBadge.save();
                                    }
                                });
                                _.each(userTodos, function (userTodo) {
                                    _.each(userTodo.requirements, function (requirement) {
                                        if (requirement.dataValues.todoRequirement.dataValues.requirementRef == 'Quest' && requirement.dataValues.todoRequirement.dataValues.requirementRefId == quest.dataValues.id) {
                                            var notCompleteChallenge = _.find(quest.dataValues.challenges, function (challenge) {
                                                if (challenge.results.length == 0 && challenge.type != 'finish') {
                                                    return true;
                                                }
                                            });

                                            if (!notCompleteChallenge) {
                                                requirement.fulfilled = true;
                                                requirement.save();
                                            }
                                        }
                                        else if (quest.dataValues.level && requirement.dataValues.todoRequirement.dataValues.requirementRef == 'Level' && requirement.dataValues.todoRequirement.dataValues.requirementRefId == quest.dataValues.level.id) {
                                            if (quest.dataValues.level) {
                                                var hasNotCompleteQuest = false;
                                                _.find(quest.dataValues.level.levelQuests, function (quest) {
                                                    var notCompleteChallenge = _.find(quest.dataValues.challenges, function (challenge) {
                                                        if (challenge.results.length == 0 && challenge.type != 'finish') {
                                                            return true;
                                                        }
                                                    });

                                                    if (notCompleteChallenge) {
                                                        hasNotCompleteQuest = true;
                                                        return true;
                                                    }
                                                });

                                                if (!hasNotCompleteQuest) {
                                                    requirement.fulfilled = true;
                                                    requirement.save();
                                                }
                                            }
                                        }
                                    });
                                    var notCompleteRequirement = _.find(userTodo.requirements, function (requirement) {
                                        if (!requirement.fulfilled) {
                                            return true;
                                        }
                                    });

                                    if (!notCompleteRequirement && userTodo.requirements.length > 0) {
                                        userTodo.status = 'unlocked';
                                        userTodo.save();
                                    }
                                });
                            }).then(function () {
                                // ************************************
                                // Point calculation and stats logging
                                // ************************************
                                //Checking original challenge to ensure this is the first time this challenge was completed
                                if (originalChallenge.quest.program.status != 'preview') {
                                    //HOOK: Challenge is complete                        
                                    services.stats.logChallengeComplete(req.user.id, originalChallenge.id, pointsEarned).then(function () {
                                        //HOOK: Badge earned
                                        async.eachSeries(badgesJustEarned,
                                            function (userBadge, callback) {
                                                //HOOK: Badge earned
                                                services.stats.logBadgeEarned(userBadge.userId, userBadge.badgeId).then(function () {
                                                    callback();
                                                });
                                            });

                                        // Check for Quest completion.
                                        var isQuestComplete = true;
                                        var questPoints = 0;
                                        _.each(quest.challenges, function (challenge) {

                                            if (challenge.results.length > 0) {
                                                questPoints += challenge.results[0].points;
                                            }
                                            else {
                                                questPoints += challenge.points;
                                            }

                                            if (challenge.results.length == 0 && challenge.type != 'finish') {
                                                isQuestComplete = false;
                                            }
                                        });

                                        if (isQuestComplete) {
                                            //HOOK: Quest is complete
                                            services.stats.logQuestComplete(req.user.id, questId, questPoints).then(function () {
                                                // Check for Level completion.
                                                var isLevelComplete = true;
                                                var levelPoints = 0;
                                                if (quest.level) {
                                                    _.each(quest.level.levelQuests, function (quest) {
                                                        var isQuestComplete = true;
                                                        _.each(quest.challenges, function (challenge) {
                                                            levelPoints += challenge.points;
                                                            if (challenge.results.length == 0 && challenge.type != 'finish') {
                                                                isQuestComplete = false;
                                                            }
                                                        });

                                                        if (!isQuestComplete) {
                                                            isLevelComplete = false;
                                                        }
                                                    });

                                                    if (isLevelComplete) {
                                                        //HOOK: Level is complete
                                                        services.stats.logLevelComplete(req.user.id, quest.level.id, levelPoints);
                                                    }
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        });
                    }
                });



            });
    });
};