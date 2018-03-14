var models = require('../models');
var services = require('../services');

var util = require('util');
var _ = require('underscore');
var Q = require('q');

exports.getCategories = function (req, res) {
    services.forum.getCategories(parseInt(req.params.forumId))
        .then(function (categories) {
            res.sendSuccess(categories);
        })
        .catch(function (err) {
            res.sendError(err);
        });
};

exports.getUserAvailableContent = function (req, res) {

    var formatForumResponse = function (categories, forum, program) {
        forum = JSON.stringify(forum);
        forum = JSON.parse(forum);
        categories = JSON.stringify(categories);
        categories = JSON.parse(categories);

        if(program) {
            program = JSON.stringify(program);
            program = JSON.parse(program);
        }

        var formatQuest = function (quest, program) {
            quest.challengeCount = 0;
            quest.challengesComplete = 0;
            _.each(quest.challenges, function (challenge) {
                if (challenge.results.length > 0) {
                    challenge.result = challenge.results[0];
                    challenge.complete = true;
                }
                challenge.results = undefined;
                if (challenge.type != 'finish') {
                    quest.challengeCount++;
                    if (challenge.complete) {
                        quest.challengesComplete++;
                    }
                }
            });
            if (quest.challengesComplete >= quest.challengeCount) {
                program.questsComplete++;
                quest.complete = true;
            }
        };



        //Formats each program

        var formatProgram = function (program) {
            program.quests = program.programQuests;
            program.programQuests = undefined;
            program.questsComplete = 0;
            program.sequencingParameters = program.sequencingParameters ? JSON.parse(program.sequencingParameters) : null;
            var questsToAssignToLevels = [];
            _.each(program.quests, function (quest) {
                if (quest.levelId) {
                    questsToAssignToLevels.push(quest);
                }
            });
            _.each(questsToAssignToLevels, function (quest) {
                program.quests = _.without(program.quests, quest);
                var level = _.findWhere(program.levels, {id: Number(quest.levelId)});
                if (!level.quests) {
                    level.quests = [];
                }
                level.quests.push(quest);
            });
            _.each(program.levels, function (level) {
                if (!level.quests) {
                    level.quests = [];
                }
                level.sequencingParameters = level.sequencingParameters ? JSON.parse(level.sequencingParameters) : null;
                _.each(level.quests, function (quest) {
                    formatQuest(quest, program);
                });
            });
            _.each(program.quests, function (quest) {
                formatQuest(quest, program);
            });
        };

        if(program) {
            formatProgram(program);
        }

        var userHasCompletedQuest = function (quest) {
            var matchingQuest = _.findWhere(program.quests, {id: quest.id});
            if (!matchingQuest) {
                _.each(program.levels, function (level) {
                    if (!matchingQuest) {
                        matchingQuest = _.findWhere(level.quests, {id: quest.id});
                    }
                })
            }
            if (!matchingQuest) return false;
            return matchingQuest.complete ? true : false;
        };

        var userHasCompletedChallenge = function (challenge) {
            var quest = _.findWhere(program.quests, {id: challenge.questId});
            if (!quest) {
                _.each(program.levels, function (level) {
                    if (!quest) {
                        quest = _.findWhere(level.quests, {id: challenge.questId});
                    }
                })
            }
            if (!quest) return false;
            var matchingChallenge = _.findWhere(quest.challenges, {id: challenge.id});
            if (matchingChallenge && matchingChallenge.result) {
                return true;
            }
        };

        if(program) {
            var topicsToRemove = [];
            _.each(forum.items, function (topic) {
                if (topic.users.length > 0 && _.findWhere(topic.users, {userId: req.user.id}) == null) {
                    topicsToRemove.push(topic);
                } else if (!(topic.users.length > 0) && topic.quest && topic.challenge && !userHasCompletedChallenge(topic.challenge)) {
                    topicsToRemove.push(topic);
                } else if (!(topic.users.length > 0) && topic.quest && !topic.challenge && !userHasCompletedQuest(topic.quest)) {
                    topicsToRemove.push(topic);
                }
            });
        }else{
            var topicsToRemove = [];
            _.each(forum.items, function (topic) {
                if (topic.quest && topic.quest.programId != req.params.programId) {
                    topicsToRemove.push(topic);
                }
            });
        }

        _.each(topicsToRemove, function (topic) {
            forum.items = _.without(forum.items, topic);
        });

        res.sendSuccess({categories: categories, topics: forum});
    };


    var continueLoadForum = function (isAdmin) {
        if (!isAdmin) {
            Q.all([
                services.forum.getCategories(parseInt(req.params.forumId)),
                services.forum.getTopics(parseInt(req.params.forumId)),
                models.Program.find({
                    where: {
                        id: parseInt(req.params.programId)
                    },
                    include: [
                        {
                            model: models.Quest,
                            as: 'programQuests',
                            order: [
                                ['sequence', 'ASC']
                            ],
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
                            ],
                            required: false
                        },
                        {
                            model: models.Level,
                            as: 'levels',
                            required: false
                        }
                    ]
                })
            ]).spread(function (categories, forum, program) {
                formatForumResponse(categories, forum, program);
            })
        } else {
            Q.all([
                services.forum.getCategories(parseInt(req.params.forumId)),
                services.forum.getTopics(parseInt(req.params.forumId))
            ]).spread(function (categories, forum) {
                formatForumResponse(categories, forum, null);
            })
        }
    };

    if (services.helpers.isInRole(services.helpers.roleIds.ClientAdmin, req.user) || services.helpers.isInRole(services.helpers.roleIds.SystemAdmin, req.user)) {
        continueLoadForum(true)
    } else {
        continueLoadForum();
    }
};


exports.getTopics = function (req, res) {
    services.forum.getTopics(parseInt(req.params.forumId))
        .then(function (forum) {
            res.sendSuccess(forum);
        })
        .catch(function (err) {
            res.sendError(err);
        });
};

exports.getTopic = function (req, res) {
    services.forum.getTopic(parseInt(req.params.topicId))
        .then(function (topic) {
            res.sendSuccess(topic);
        })
        .catch(function (err) {
            res.sendError(err);
        });
};


exports.deleteTopic = function (req, res) {
    services.forum.deleteForumItem(parseInt(req.params.topicId), true)
        .then(function (topic) {
            res.sendSuccess(topic);
        })
        .catch(function (err) {
            res.sendError(err);
        });
};

exports.deleteComment = function (req, res) {
    services.forum.deleteForumItem(parseInt(req.params.commentId), false)
        .then(function (topic) {
            res.sendSuccess(topic);
        })
        .catch(function (err) {
            res.sendError(err);
        });
};


exports.createForum = function (req, res) {
    services.forum.createForumIfNeeded(req.body.programLinkId, 'Default Program Forum')
        .then(function (forumId) {

            models.Forum.findOne({
                    attributes: ['id', 'name'],
                    where: {id: forumId}
                })
                .then(function (forum) {
                    res.sendSuccess(forum);
                })
                .catch(function (err) {
                    res.sendError(err);
                });
        })
        .catch(function (err) {
            res.sendError(err);
        });
};

exports.checkIfCategoryHasTopics = function (req, res) {
    models.ForumItem.findOne({
        attributes: ['id'],
        where: {
            categoryId: req.params.categoryId,
            type: 'topic'
        }
    }).then(function (item) {
        res.sendSuccess(item ? true : false);
    }).catch(function (err) {
        res.sendError(err);
    });
};

exports.postTopic = function (req, res) {
    services.forum.topic(req.user, req.params.forumId,
        req.body.quest ? req.body.quest.id : null,
        req.body.challenge ? req.body.challenge.id : null,
        req.body.category ? req.body.category.id : null,
        req.body.title, req.body.content,
        req.body.contentLink, req.body.contentLinkType,
        req.body.allowDuplicate, req.body.networkUsers,
        req.body.bonusPoints, req.body.subType,
        req.body.media)
        .then(function (existingItems) {
            res.sendSuccess(existingItems);
        })
        .catch(function (err) {
            res.sendError(err);
        });
};

exports.postComment = function (req, res) {
    services.forum.comment(req.user, req.params.forumId, req.params.topicId, req.body.comment, req.body.media)
        .then(function () {
            services.forum.getTopic(parseInt(req.params.topicId))
                .then(function (topic) {
                    res.sendSuccess(topic);
                })
                .then(function (err) {
                    res.sendError(err);
                });
        })
        .catch(function (err) {
            res.sendError(err);
        });
};

exports.postLike = function (req, res) {
    services.forum.like(req.user, req.body.forumItemId)
        .then(function () {
            res.sendSuccess('OK');
        })
        .catch(function (err) {
            res.sendError(err);
        });
};

exports.postDislike = function (req, res) {
    services.forum.dislike(req.user, req.body.forumItemId)
        .then(function () {
            res.sendSuccess('OK');
        })
        .catch(function (err) {
            res.sendError(err);
        });
};

