var models = require('../../models');
var controllerBase = require('./controllerBase');
var badgeController = require('./badges');
var services = require('../../services/index');
var util = require('util');
var _ = require('underscore');
var async = require('async');
var Q = require('q');
var moment = require('moment');
var uuid = require('node-uuid');
var constants = require('../../helpers/constants');


function ProgramController(model) {
    controllerBase.call(this, model);
}
util.inherits(ProgramController, controllerBase);
var controller = new ProgramController(models.Program);

// Program object creation helpers
var _listingProgram = function (row) {
    var author = null;
    if (!author && row.clientId != row.contentProviderId) author = row.contentProviderName;
    if (!author) author = row.contentAuthor;
    if (!author) author = row.updatedByFirstName + ' ' + row.updatedByLastName;

    return {
        id: row.id,
        linkId: row.linkId,
        programLicenseId: row.programLicenseId,
        slug: row.slug,
        title: row.title,
        status: row.status,
        description: row.description,
        imageUrl: services.helpers.makeMediaUrl(row.imageRef),
        published: row.published,
        createdAt: row.createdAt,
        version: {
            version: row.publishedVersion + '.' + row.version,
            publishedVersion: row.publishedVersion,
            by: {
                userId: row.updatedById,
                firstName: row.updatedByFirstName,
                lastName: row.updatedByLastName
            }
        },
        client: {
            id: row.clientId,
            slug: row.clientSlug,
            name: row.clientName
        },
        content: {
            author: author,
            description: row.contentDescription,
            provider: {
                id: row.contentProviderId,
                name: row.contentProviderName
            }
        }
    };
};

var _getCurrentProgramId = function (ref, restoreId) {

    return Q.Promise(function (resolve, reject) {
        if (restoreId && restoreId > 0) return resolve(restoreId);

        if (!isNaN(ref)) {
            models.Program.max('id', { where: { linkId: parseInt(ref) } })
                .then(resolve)
                .catch(function (err) {
                    services.helpers.handleReject(err, reject);
                });
            return;
        }

        models.Program.max('id', { where: { slug: ref } })
            .then(resolve)
            .catch(function (err) {
                services.helpers.handleReject(err, reject);
            });
    });
};

var _refToLinkId = function (ref, clientId) {

    return Q.Promise(function (resolve, reject) {
        if (!isNaN(ref)) return resolve(parseInt(ref));

        models.Program.findOne({
            attributes: ['linkId'],
            where: {
                slug: ref,
                clientId: clientId
            }
        })
            .then(function (program) {
                resolve(program.linkId);
            })
            .catch(function (err) {
                services.helpers.handleReject(err, reject);
            });
    });
};

ProgramController.prototype._retrieveProgramListing = function (user, getAll) {

    var format = function (rows) {
        var programs = [];
        _.each(rows, function (row) {
            programs.push(_listingProgram(row, user));
        });
        return programs;
    };

    return Q.Promise(function (resolve, reject) {
        models.sequelize.query('CALL get_programs(?, ?)', {
            raw: true,
            replacements: [user.id, (getAll ? 1 : 0)]
        })
            .then(function (rows) {
                resolve(format(rows));
            })
            .catch(function (err) {
                services.helpers.handleReject(err, reject);
            });
    });
};

ProgramController.prototype._retrieveProgramListingByClient = function (clientId, getAll) {

    var format = function (rows) {
        var programs = [];
        _.each(rows, function (row) {
            programs.push(_listingProgram(row));
        });
        return programs;
    };

    return Q.Promise(function (resolve, reject) {
        models.sequelize.query('CALL get_programs_by_client(?, ?)', {
            raw: true,
            replacements: [clientId, (getAll ? 1 : 0)]
        })
            .then(function (rows) {
                resolve(format(rows));
            })
            .catch(function (err) {
                services.helpers.handleReject(err, reject);
            });
    });
};

ProgramController.prototype.retrieveProgramListing = function (req, res) {
    controller._retrieveProgramListing(req.user, false)
        .then(function (programs) {
            res.sendSuccess(programs);
        })
        .catch(function (err) {
            res.sendError(err);
        });
};

ProgramController.prototype.retrieveProgramListingAll = function (req, res) {
    controller._retrieveProgramListing(req.user, true)
        .then(function (programs) {
            res.sendSuccess(programs);
        })
        .catch(function (err) {
            res.sendError(err);
        });
};

ProgramController.prototype.retrieveProgramListingUser = function (req, res) {
    var preview = (req.query.preview && req.query.preview == 'yes');
    controller._retrieveProgramListingUser(req.user, preview)
        .then(function (programs) {
            res.sendSuccess(programs);
        })
        .catch(function (err) {
            res.sendError(err);
        });
};

ProgramController.prototype._retrieveProgramListingUser = function (user, preview) {
    var result = {
        programs: [],
        programsComplete: 0
    };

    return Q.Promise(function (resolve, reject) {
        //Formats each program
        var formatProgram = function (program, todosFound, callback) {

            //Calculate the author
            var author = null;
            if (!author && program.clientId != program.contentProviderId) author = program.contentProvider ? program.contentProvider.name : null;
            if (!author) author = program.contentAuthor;
            if (!author) author = program.history.user.firstName + ' ' + program.history.user.lastName;

            //Setup the content object
            program.content = {
                provider: program.contentProvider,
                author: author,
                descriptions: program.contentDescription
            };

            var getWhereStatus = function () {
                if (preview) {
                    return { $ne: null }
                } else {
                    return { $ne: 'preview' }
                }
            };

            var userTodos = _.filter(todosFound, function (userTodo) {
                return userTodo.todo.programId == program.id
            });

            program.userTodos = userTodos ? userTodos : [];
            _.each(program.userTodos, function (userTodo) {
                _.each(userTodo.bonusPoints, function (pointsRecord) {
                    pointsRecord.user.avatarUrl = services.helpers.makeMediaUrl(pointsRecord.user.avatarUrl)
                });

                _.each(userTodo.todo.challenges, function (challenge) {
                    challenge.results = _.filter(userTodo.results, function (result) {
                        return result.challengeId == challenge.id;
                    });
                    challenge.userMedia = _.filter(userTodo.userMedia, function (media) {
                        return media.challengeId == challenge.id;
                    });

                    _.each(challenge.userMedia, function (media) {
                        if (media.type == 'image' || media.type == 'audio')
                            media.url = services.helpers.makeMediaUrl(media.data);
                        else if (media.type == 'video') {
                            if (media.source == 'system')
                                media.url = services.helpers.makeMediaUrl(media.data);
                            else if (media.source == 'youtube') {
                                media.iframe = media.data
                            }
                        }
                        else if (media.type == 'text')
                            media.text = media.data;
                        else if (media.type == 'link')
                            media.link = media.data;
                        else if (media.type == 'resource')
                            media.url = services.helpers.makeResourceUrl(media.data);
                    });

                    _.each(challenge.results, function (result) {
                        result.user.avatarUrl = services.helpers.makeMediaUrl(result.user.avatarUrl);
                    });
                });
            });


            //Go get the count of published program versions, this will be the programs version number, if not preview then don't include programs
            //with status = preview in the count
            models.Program.count({
                where: {
                    linkId: program.linkId,
                    status: getWhereStatus(),
                    published: { $ne: null }
                }
            }).then(function (count) {
                //Set the version
                program.version = count;

                //Format the program image
                program.imageUrl = services.helpers.makeMediaUrl(program.imageRef);

                result.programs.push(program);
                callback();
            });
        };

        var sql =
            'SELECT MAX(P.id) as id FROM Programs P\n' +
            'JOIN Clients C ON C.id=P.clientId\n' +
            'JOIN ClientUsers CU ON CU.clientId=C.id\n' +
            'WHERE P.deletedAt IS NULL AND CU.userId=:uid AND\n' +
            '((:preview=1 AND P.status = \'preview\') OR P.status!=\'preview\') AND\n' +
            'P.published IS NOT NULL AND\n' +
            '((:preview=1 AND P.status = \'preview\') OR (SELECT COUNT(*) FROM ProgramUsers PU1 WHERE PU1.linkId = P.linkId AND PU1.userId = :uid) > 0)\n' +
            'GROUP BY P.linkId';


        //Took this query from get_program_user stored proc to get only the most recent published programs
        models.sequelize.query(sql, {
            replacements: { uid: user.id, preview: (preview ? 1 : 0) },
            type: models.sequelize.QueryTypes.SELECT
        }).then(function (programs) {
            Q.all([
                models.Program.findAll({
                    where: {
                        id: {
                            in: _.pluck(programs, 'id')
                        }
                    },
                    include: [
                        {
                            model: models.History,
                            as: 'history',
                            include: [
                                {
                                    model: models.User,
                                    as: 'user',
                                    attributes: ['id', 'firstName', 'lastName', 'email', 'title', 'email', 'avatarUrl', 'why', 'destination']
                                }
                            ]
                        },
                        {
                            model: models.Client,
                            as: 'contentProvider'
                        },
                        {
                            model: models.Client,
                            as: 'client'
                        },
                        {
                            model: models.Badge,
                            as: 'badges',
                            include: [
                                {
                                    model: models.UserBadge,
                                    as: 'userBadges',
                                    where: {
                                        userId: user.id,
                                        earned: true
                                    },
                                    required: false
                                }
                            ]
                        }
                    ]
                }),
                models.UserTodo.findAll({
                    where: {
                        userId: user.id,
                        status: {
                            $ne: 'locked'
                        }
                    },
                    include: [
                        {
                            model: models.BonusPoints,
                            as: 'bonusPoints',
                            include: [
                                {
                                    model: models.User,
                                    as: 'user',
                                    attributes: ['id', 'firstName', 'lastName', 'avatarUrl']
                                }
                            ]
                        },
                        {
                            model: models.ChallengeResult,
                            as: 'results',
                            include: [
                                {
                                    model: models.ChallengeResultItem,
                                    as: 'items'
                                },

                                {
                                    model: models.User,
                                    as: 'user',
                                    attributes: ['id', 'firstName', 'lastName', 'email', 'title', 'email', 'avatarUrl', 'why', 'destination'],
                                    paranoid: false
                                }
                            ],
                            required: false
                        },
                        {
                            model: models.UserChallengeMedia,
                            as: 'userMedia',
                            required: false
                        },
                        {
                            model: models.Todo,
                            as: 'todo',
                            include: [
                                {
                                    model: models.Challenge,
                                    as: 'challenges',
                                    include: [
                                        {
                                            model: models.ChallengeQuestion,
                                            as: 'questions'
                                        }
                                    ]
                                },
                                {
                                    model: models.Program,
                                    as: 'program',
                                    where: {
                                        id: {
                                            in: _.pluck(programs, 'id')
                                        }
                                    },
                                    required: true
                                }
                            ]
                        }
                    ]
                })
            ])
                .spread(function (programsFound, todosFound) {
                    programsFound = JSON.stringify(programsFound);
                    programsFound = JSON.parse(programsFound);
                    todosFound = JSON.stringify(todosFound);
                    todosFound = JSON.parse(todosFound);

                    async.eachSeries(programsFound,
                        function (program, callback) {
                            formatProgram(program, todosFound, callback);
                        }, function () {
                            resolve(result);
                        });
                })
                .catch(function (err) {
                    services.helpers.handleReject(err, reject);
                });
        }).catch(function (err) {
            services.helpers.handleReject(err, reject);
        });
    });
};

ProgramController.prototype.retrieveProgramListingSimpleUser = function (req, res) {
    var preview = (req.query.preview && req.query.preview == 'yes');
    controller._retrieveProgramListingSimpleUser(req.user, preview)
        .then(function (programs) {
            res.sendSuccess(programs);
        })
        .catch(function (err) {
            res.sendError(err);
        });
};

ProgramController.prototype._retrieveProgramListingSimpleUser = function (user, preview) {
    var result = {
        programs: [],
        programsComplete: 0
    };

    return Q.Promise(function (resolve, reject) {
        //Formats each program
        var formatProgram = function (program, callback) {
            //Format the program image
            program.imageUrl = services.helpers.makeMediaUrl(program.imageRef);

            result.programs.push(program);
            callback();
        };

        var sql =
            'SELECT MAX(P.id) as id, P.linkId FROM Programs P\n' +
            'JOIN Clients C ON C.id=P.clientId\n' +
            'JOIN ClientUsers CU ON CU.clientId=C.id\n' +
            'WHERE P.deletedAt IS NULL AND CU.userId=:uid AND\n' +
            '((:preview=1 AND P.status = \'preview\') OR P.status!=\'preview\') AND\n' +
            'P.published IS NOT NULL AND\n' +
            '((:preview=1 AND P.status = \'preview\') OR (SELECT COUNT(*) FROM ProgramUsers PU1 WHERE PU1.linkId = P.linkId AND PU1.userId = :uid) > 0)\n' +
            'GROUP BY P.linkId';


        //Took this query from get_program_user stored proc to get only the most recent published programs
        models.sequelize.query(sql, {
            replacements: { uid: user.id, preview: (preview ? 1 : 0) },
            type: models.sequelize.QueryTypes.SELECT
        }).then(function (programs) {
            models.Program.findAll({
                where: {
                    id: {
                        in: _.pluck(programs, 'id')
                    }
                }
            }).then(function (programsFound) {
                programsFound = JSON.stringify(programsFound);
                programsFound = JSON.parse(programsFound);

                async.eachSeries(programsFound,
                    function (program, callback) {
                        formatProgram(program, callback);
                    }, function (err) {
                        resolve(result);
                    });
            })
        }).catch(function (err) {
            services.helpers.handleReject(err, reject);
        });
    });
};

ProgramController.prototype.retrieveProgramDetailUser = function (req, res) {
    var preview = (req.query.preview && req.query.preview == 'yes');
    controller._retrieveProgramDetailUser(req.params.slug, req.user, preview)
        .then(function (programs) {
            res.sendSuccess(programs);
        })
        .catch(function (err) {
            res.sendError(err);
        });
};

ProgramController.prototype._retrieveProgramDetailUser = function (slug, user, preview) {
    var mostRecentCompletedChallenge = null;
    var result = {
        programs: [],
        programsComplete: 0,
        badges: {
            total: 0,
            earned: 0
        },
        discussionScore: {
            newTopicPoints: 0,
            newCommentPoints: 0,
            likePoints: 0,
            topicCommentPoints: 0,
            itemLikePoints: 0,
            newEncouragePoints: 0,
            newAppreciatePoints: 0,
            newStoryPoints: 0
        }
    };

    return Q.Promise(function (resolve, reject) {

        var cycleDate = function (interval, period, now, intervalStartDate) {
            var counter = -1;
            switch (period) {
                case 'Hour':
                    while (intervalStartDate < now && counter < 10000) {
                        intervalStartDate = moment(intervalStartDate).add(interval, 'hours');
                        counter++;
                    }
                    break;
                case 'Day':
                    while (intervalStartDate < now && counter < 10000) {
                        intervalStartDate = moment(intervalStartDate).add(interval, 'days');
                        counter++;
                    }
                    break;
                case 'Week':
                    while (intervalStartDate < now && counter < 10000) {
                        intervalStartDate = moment(intervalStartDate).add(interval, 'weeks');
                        counter++;
                    }
                    break;
                case 'Month':
                    while (intervalStartDate < now && counter < 10000) {
                        intervalStartDate = moment(intervalStartDate).add(interval, 'months');
                        counter++;
                    }
                    break;
            }

            if (counter == 10000) {
                counter = 0;
            }

            return counter;
        };
        var isLevelComplete = function (level, forumItems, isAllBonus) {
            return services.quests.isLevelComplete(level, forumItems, isAllBonus);
        };
        var isQuestComplete = function (quest, forumItems) {
            return services.quests.isQuestComplete(quest, forumItems);
        };
        var programHasLevelQuests = function (program) {
            return services.quests.programHasLevelQuests(program);
        };
        var getQuestLockState = function (quest, program, callback) {
            var now = new Date();
            var isLocked = true;

            //If the quest belongs to a level
            if (quest.levelId) {
                var level = _.findWhere(program.levels, { id: Number(quest.levelId) });
                //Switch on the program sequencing type
                switch (program.sequencingTypeId) {
                    case services.helpers.sequencingTypes.inOrder.id:
                        //If the program sequencing is InOrder, switch on the level sequecing type
                        switch (level.sequencingTypeId) {
                            case services.helpers.sequencingTypes.inOrder.id:
                                //If the program sequencng is InOrder, and the level sequencing is InOrder, get the index of the current level
                                isLocked = programStatusCheck(quest, program, level);
                                break;
                            case services.helpers.sequencingTypes.parallel.id:
                                //If the program sequence is InOrder, but the level sequence is Parallel, check the index of the current level
                                var indexOfCurrentLevel = program.levels.indexOf(level);
                                if (indexOfCurrentLevel > 0) {
                                    //If this isn't the first level, check if the previous level is complete
                                    var isPreviousLevelComplete = isLevelComplete(program.levels[indexOfCurrentLevel - 1], forumItems);
                                    if (isPreviousLevelComplete || program.levels[indexOfCurrentLevel - 1].baseOrBonus == constants.QUEST_BASE_OR_BONUS_BONUS) {
                                        //If the previous level is complete, and this level sequence is parallel, then this quest must be unlocked
                                        isLocked = false;
                                    }
                                } else {
                                    //If this is the first level, and the level sequence is parallel, then this quest must be unlocked
                                    isLocked = false;
                                }
                                break;
                            case services.helpers.sequencingTypes.interval.id:
                                //If the program sequencng is InOrder, and the level sequencing is InOrder, get the index of the current level
                                var indexOfCurrentLevel = program.levels.indexOf(level);
                                //If this quest does not belong to the first level
                                if (indexOfCurrentLevel > 0) {
                                    //Check if the previous level has been completed
                                    var isPreviousLevelComplete = isLevelComplete(program.levels[indexOfCurrentLevel - 1], forumItems);
                                    if (isPreviousLevelComplete || program.levels[indexOfCurrentLevel - 1].baseOrBonus == constants.QUEST_BASE_OR_BONUS_BONUS) {
                                        //If the previous level is complete, check if this is the first quest in the level
                                        var indexOfQuestInLevel = level.quests.indexOf(quest);
                                        if (indexOfQuestInLevel == 0 && level.sequencingParameters.intervalStartTypeId != services.helpers.sequencingTypeIntervalStartTypes.onSpecificDate.id) {
                                            //If this is the first quest in the level, and the previous level is complete, then this quest is unlocked
                                            isLocked = false;
                                        } else {
                                            if (indexOfQuestInLevel == 0 && level.sequencingParameters.intervalStartTypeId == services.helpers.sequencingTypeIntervalStartTypes.onSpecificDate.id) {
                                                if (new Date(level.sequencingParameters.startDate) <= now) {
                                                    isLocked = false;
                                                }
                                            } else {
                                                //If this isn't the first quest in the level, check if the previous quest in the level is complete
                                                if (isQuestComplete(level.quests[indexOfQuestInLevel - 1], forumItems)) {
                                                    //If the previous quest in the level is complete, and the previous level is complete, then check if it is complete based on interval
                                                    var intervalStartDate;
                                                    if (level.sequencingParameters.intervalStartTypeId == services.helpers.sequencingTypeIntervalStartTypes.onStartDate.id) {
                                                        intervalStartDate = level.quests[0].challenges[0].result.createdAt;
                                                    } else {
                                                        intervalStartDate = level.sequencingParameters.startDate;
                                                    }

                                                    var startDateOriginal = new Date(intervalStartDate);

                                                    var numberOfQuestsUnlockedByInterval = cycleDate(level.sequencingParameters.interval, level.sequencingParameters.intervalPeriod, now, startDateOriginal);

                                                    if (indexOfQuestInLevel <= numberOfQuestsUnlockedByInterval && startDateOriginal <= now) {
                                                        isLocked = false;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                } else {
                                    //If this quest does belong to the first level in the program, check the index of the quest in the level
                                    var indexOfQuestInLevel = level.quests.indexOf(quest);
                                    if (indexOfQuestInLevel == 0 && level.sequencingParameters.intervalStartTypeId != services.helpers.sequencingTypeIntervalStartTypes.onSpecificDate.id) {
                                        //If this is the first quest in the first level, then it must be unlocked
                                        isLocked = false;
                                    } else {
                                        if (indexOfQuestInLevel == 0 && level.sequencingParameters.intervalStartTypeId == services.helpers.sequencingTypeIntervalStartTypes.onSpecificDate.id) {
                                            if (new Date(level.sequencingParameters.startDate) <= now) {
                                                isLocked = false;
                                            }
                                        } else {
                                            //If this is not the first quest, check if the quest before it is complete
                                            if (isQuestComplete(level.quests[indexOfQuestInLevel - 1], forumItems) || (level.quests[indexOfQuestInLevel - 1].baseOrBonus == constants.QUEST_BASE_OR_BONUS_BONUS)) {
                                                //If the previous quest in the level is complete, and the previous level is complete, then check if it is complete based on interval
                                                var intervalStartDate;
                                                if (level.sequencingParameters.intervalStartTypeId == services.helpers.sequencingTypeIntervalStartTypes.onStartDate.id) {
                                                    intervalStartDate = level.quests[0].challenges[0].result.createdAt;
                                                } else {
                                                    intervalStartDate = level.sequencingParameters.startDate;
                                                }

                                                var startDateOriginal = new Date(intervalStartDate);
                                                var numberOfQuestsUnlockedByInterval = cycleDate(level.sequencingParameters.interval, level.sequencingParameters.intervalPeriod, now, startDateOriginal);

                                                if (indexOfQuestInLevel <= numberOfQuestsUnlockedByInterval && startDateOriginal <= now) {
                                                    isLocked = false;
                                                }
                                            }
                                        }
                                    }
                                }
                                break;
                        }
                        break;
                    case services.helpers.sequencingTypes.parallel.id:
                        //If the program sequencing is Parallel, switch on the level sequencing
                        switch (level.sequencingTypeId) {
                            case services.helpers.sequencingTypes.inOrder.id:
                                //If the program sequencing is Parallel, and the level sequencing is InOrder, get the index of the current level
                                isLocked = programStatusCheck(quest, program, level);


                                //var indexOfCurrentLevel = program.levels.indexOf(level);
                                //if (indexOfCurrentLevel > 0) {
                                //    //If this is not the first level, check the if the previous level is complete
                                //    var isPreviousLevelComplete = isLevelComplete(program.levels[indexOfCurrentLevel - 1], forumItems);
                                //    if (isPreviousLevelComplete) {
                                //        //If the previous level is complete, check if this quest is the first quest in the current level
                                //        var indexOfQuestInLevel = level.quests.indexOf(quest);
                                //        if (indexOfQuestInLevel == 0) {
                                //            //If this is the first quest in the current level, and the previous level is complete, then this quest must be unlocked
                                //            isLocked = false;
                                //        } else {
                                //            //If this is not the first quest in the current level, check if the previous quest is complete
                                //            if (isQuestComplete(level.quests[indexOfQuestInLevel - 1], forumItems) || level.quests[indexOfQuestInLevel - 1].baseOrBonus == constants.QUEST_BASE_OR_BONUS_BONUS) {
                                //                //If the previous quest is complete, then this quest must be unlocked
                                //                isLocked = false;
                                //            }
                                //        }
                                //    }
                                //} else {
                                //    //If this is the first level then check the quests index in the level
                                //    var indexOfQuestInLevel = level.quests.indexOf(quest);
                                //    if (indexOfQuestInLevel == 0) {
                                //        //If this is the first quest in the first level with sequencing InOrder then the quest must be unlocked
                                //        isLocked = false;
                                //    } else {
                                //        //If this is not the first qeuest, then check if the previous quest is complete
                                //        if (isQuestComplete(level.quests[indexOfQuestInLevel - 1], forumItems) || level.quests[indexOfQuestInLevel - 1].baseOrBonus == constants.QUEST_BASE_OR_BONUS_BONUS) {
                                //            //If the previous quest is complete, then the quest must be unlocked
                                //            isLocked = false;
                                //        }
                                //    }
                                //}
                                break;
                            case services.helpers.sequencingTypes.parallel.id:
                                //If the program sequence is Parallel and the level sequence is Parallel get the index of the current level
                                var indexOfCurrentLevel = program.levels.indexOf(level);
                                if (indexOfCurrentLevel > 0) {
                                    //If this is not the first level, then check if the previous level is complete
                                    var isPreviousLevelComplete = isLevelComplete(program.levels[indexOfCurrentLevel - 1], forumItems);
                                    if (isPreviousLevelComplete || program.levels[indexOfCurrentLevel - 1].baseOrBonus == constants.QUEST_BASE_OR_BONUS_BONUS) {
                                        //If the previous level is complete, then this quest me be unlocked
                                        isLocked = false;
                                    }
                                } else {
                                    //If this is the first level and the sequence type is parallel then the quest must be unlocked
                                    isLocked = false;
                                }
                                break;
                            case services.helpers.sequencingTypes.interval.id:
                                //If the program sequencng is InOrder, and the level sequencing is InOrder, get the index of the current level
                                var indexOfCurrentLevel = program.levels.indexOf(level);
                                //If this quest does not belong to the first level
                                if (indexOfCurrentLevel > 0) {
                                    //Check if the previous level has been completed
                                    var isPreviousLevelComplete = isLevelComplete(program.levels[indexOfCurrentLevel - 1], forumItems);
                                    if (isPreviousLevelComplete) {
                                        //If the previous level is complete, check if this is the first quest in the level
                                        var indexOfQuestInLevel = level.quests.indexOf(quest);
                                        if (indexOfQuestInLevel == 0 && level.sequencingParameters.intervalStartTypeId != services.helpers.sequencingTypeIntervalStartTypes.onSpecificDate.id) {
                                            //If this is the first quest in the level, and the previous level is complete, then this quest is unlocked
                                            isLocked = false;
                                        } else {
                                            if (indexOfQuestInLevel == 0 && level.sequencingParameters.intervalStartTypeId == services.helpers.sequencingTypeIntervalStartTypes.onSpecificDate.id) {
                                                if (new Date(level.sequencingParameters.startDate) <= now) {
                                                    isLocked = false;
                                                }
                                            } else {
                                                //If this isn't the first quest in the level, check if the previous quest in the level is complete
                                                if (isQuestComplete(level.quests[indexOfQuestInLevel - 1], forumItems)) {
                                                    //If the previous quest in the level is complete, and the previous level is complete, then check if it is complete based on interval
                                                    var intervalStartDate;
                                                    if (level.sequencingParameters.intervalStartTypeId == services.helpers.sequencingTypeIntervalStartTypes.onStartDate.id) {
                                                        intervalStartDate = level.quests[0].challenges[0].result.createdAt;
                                                    } else {
                                                        intervalStartDate = level.sequencingParameters.startDate;
                                                    }

                                                    var startDateOriginal = new Date(intervalStartDate);
                                                    var numberOfQuestsUnlockedByInterval = cycleDate(level.sequencingParameters.interval, level.sequencingParameters.intervalPeriod, now, startDateOriginal);

                                                    if (indexOfQuestInLevel <= numberOfQuestsUnlockedByInterval && startDateOriginal <= now) {
                                                        isLocked = false;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                } else {
                                    //If this quest does belong to the first level in the program, check the index of the quest in the level
                                    var indexOfQuestInLevel = level.quests.indexOf(quest);
                                    if (indexOfQuestInLevel == 0 && level.sequencingParameters.intervalStartTypeId != services.helpers.sequencingTypeIntervalStartTypes.onSpecificDate.id) {
                                        //If this is the first quest in the first level, then it must be unlocked
                                        isLocked = false;
                                    } else {
                                        if (indexOfQuestInLevel == 0 && level.sequencingParameters.intervalStartTypeId == services.helpers.sequencingTypeIntervalStartTypes.onSpecificDate.id) {
                                            if (new Date(level.sequencingParameters.startDate) <= now) {
                                                isLocked = false;
                                            }
                                        } else {
                                            //If this is not the first quest, check if the quest before it is complete
                                            if (isQuestComplete(level.quests[indexOfQuestInLevel - 1], forumItems)) {
                                                //If the previous quest in the level is complete, and the previous level is complete, then check if it is complete based on interval
                                                var intervalStartDate;
                                                if (level.sequencingParameters.intervalStartTypeId == services.helpers.sequencingTypeIntervalStartTypes.onStartDate.id) {
                                                    intervalStartDate = level.quests[0].challenges[0].result.createdAt;
                                                } else {
                                                    intervalStartDate = level.sequencingParameters.startDate;
                                                }

                                                var startDateOriginal = new Date(intervalStartDate);
                                                var numberOfQuestsUnlockedByInterval = cycleDate(level.sequencingParameters.interval, level.sequencingParameters.intervalPeriod, now, startDateOriginal);

                                                if (indexOfQuestInLevel <= numberOfQuestsUnlockedByInterval && startDateOriginal <= now) {
                                                    isLocked = false;
                                                }
                                            }
                                        }
                                    }
                                }
                                break;
                        }
                        break;
                    case services.helpers.sequencingTypes.interval.id:
                        switch (level.sequencingTypeId) {
                            case services.helpers.sequencingTypes.inOrder.id:
                                //If the program sequencng is InOrder, and the level sequencing is InOrder, get the index of the current level
                                var indexOfCurrentLevel = program.levels.indexOf(level);
                                //If this quest does not belong to the first level
                                if (indexOfCurrentLevel > 0) {

                                    var previousLevel = program.levels[indexOfCurrentLevel - 1];


                                    //Check if the previous level has been completed
                                    var isPreviousLevelComplete = isLevelComplete(previousLevel, forumItems);
                                    if (isPreviousLevelComplete) {
                                        //If the previous level is complete, check if this is the first quest in the level
                                        var indexOfQuestInLevel = level.quests.indexOf(quest);
                                        if (indexOfQuestInLevel == 0) {
                                            var intervalStartDate;
                                            if (program.sequencingParameters.intervalStartTypeId == services.helpers.sequencingTypeIntervalStartTypes.onStartDate.id) {

                                                var quest = previousLevel.quests[previousLevel.quests.length - 1];
                                                var challenge = quest.challenges[quest.challenges.length - 1];
                                                if (challenge.type == 'finish') {
                                                    challenge = quest.challenges[quest.challenges.length - 2];
                                                }
                                                intervalStartDate = challenge.result.createdAt;
                                            } else {
                                                intervalStartDate = level.sequencingParameters.startDate;
                                            }

                                            var startDateOriginal = new Date(intervalStartDate);
                                            var numberOfLevelsUnlockedByInterval = cycleDate(program.sequencingParameters.interval, program.sequencingParameters.intervalPeriod, now, startDateOriginal);

                                            if (indexOfCurrentLevel <= numberOfLevelsUnlockedByInterval && startDateOriginal <= now) {
                                                isLocked = false;
                                            }
                                        } else {
                                            //If this isn't the first quest in the level, check if the previous quest in the level is complete or is a BONUS activity
                                            var previousQuest = level.quests[indexOfQuestInLevel - 1];
                                            if (previousQuest.baseOrBonus == constants.QUEST_BASE_OR_BONUS_BONUS || isQuestComplete(previousQuest, forumItems)) {
                                                //If the previous quest in the level is complete, and the previous level is complete, then this quest is unlocked
                                                isLocked = false;
                                            }
                                        }
                                    }
                                } else {
                                    //If this quest does belong to the first level in the program, check the index of the quest in the level
                                    var indexOfQuestInLevel = level.quests.indexOf(quest);
                                    if (indexOfQuestInLevel == 0) {
                                        //If this is the first quest in the first level, then it must be unlocked
                                        isLocked = false;
                                    } else {
                                        //If this is not the first quest, check if the quest before it is complete or is a BONUS activity
                                        var previousQuest = level.quests[indexOfQuestInLevel - 1];
                                        if (previousQuest.baseOrBonus == constants.QUEST_BASE_OR_BONUS_BONUS || isQuestComplete(previousQuest, forumItems)) {
                                            //If the quest before this one is complete, and this is the first level, then this quest must be unlocked
                                            isLocked = false;
                                        }
                                    }
                                }
                                break;
                            case services.helpers.sequencingTypes.parallel.id:
                                //If the program sequence is InOrder, but the level sequence is Parallel, check the index of the current level
                                var indexOfCurrentLevel = program.levels.indexOf(level);
                                if (indexOfCurrentLevel > 0) {
                                    var previousLevel = program.levels[indexOfCurrentLevel - 1];

                                    //If this isn't the first level, check if the previous level is complete
                                    var isPreviousLevelComplete = isLevelComplete(previousLevel, forumItems);
                                    if (isPreviousLevelComplete) {
                                        var intervalStartDate;
                                        if (program.sequencingParameters.intervalStartTypeId == services.helpers.sequencingTypeIntervalStartTypes.onStartDate.id) {

                                            var quest = previousLevel.quests[previousLevel.quests.length - 1];
                                            var challenge = quest.challenges[quest.challenges.length - 1];
                                            if (challenge.type == 'finish') {
                                                challenge = quest.challenges[quest.challenges.length - 2];
                                            }
                                            intervalStartDate = challenge.result.createdAt;
                                        } else {
                                            intervalStartDate = level.sequencingParameters.startDate;
                                        }

                                        var startDateOriginal = new Date(intervalStartDate);
                                        var numberOfLevelsUnlockedByInterval = cycleDate(program.sequencingParameters.interval, program.sequencingParameters.intervalPeriod, now, startDateOriginal);

                                        if (indexOfCurrentLevel <= numberOfLevelsUnlockedByInterval && startDateOriginal <= now) {
                                            isLocked = false;
                                        }
                                    }
                                } else {
                                    //If this is the first level, and the level sequence is parallel, then this quest must be unlocked
                                    isLocked = false;
                                }
                                break;
                            case services.helpers.sequencingTypes.interval.id:
                                //If the program sequencng is InOrder, and the level sequencing is InOrder, get the index of the current level
                                var indexOfCurrentLevel = program.levels.indexOf(level);
                                //If this quest does not belong to the first level
                                if (indexOfCurrentLevel > 0) {
                                    var firstLevel = program.levels[0];

                                    //Check if the previous level has been completed
                                    var isFirstLevelComplete = isLevelComplete(firstLevel, forumItems);
                                    if (isFirstLevelComplete) {
                                        //If the previous level is complete, check if this is the first quest in the level
                                        var indexOfQuestInLevel = level.quests.indexOf(quest);
                                        if (indexOfQuestInLevel == 0) {
                                            var intervalStartDate;
                                            if (program.sequencingParameters.intervalStartTypeId == services.helpers.sequencingTypeIntervalStartTypes.onStartDate.id) {
                                                intervalStartDate = firstLevel.quests[0].challenges[0].result.createdAt;
                                            } else {
                                                intervalStartDate = level.sequencingParameters.startDate;
                                            }

                                            var startDateOriginal = new Date(intervalStartDate);
                                            var numberOfLevelsUnlockedByInterval = cycleDate(program.sequencingParameters.interval, program.sequencingParameters.intervalPeriod, now, startDateOriginal);

                                            if (indexOfCurrentLevel <= numberOfLevelsUnlockedByInterval && startDateOriginal <= now) {
                                                var indexOfQuestInLevel = level.quests.indexOf(quest);
                                                if (indexOfQuestInLevel == 0 && level.sequencingParameters.intervalStartTypeId == services.helpers.sequencingTypeIntervalStartTypes.onStartDate.id) {
                                                    isLocked = false
                                                } else {
                                                    //If the previous quest in the level is complete, and the previous level is complete, then check if it is complete based on interval
                                                    var intervalStartDate;
                                                    if (level.sequencingParameters.intervalStartTypeId == services.helpers.sequencingTypeIntervalStartTypes.onStartDate.id) {
                                                        intervalStartDate = level.quests[0].challenges[0].result.createdAt;
                                                    } else {
                                                        intervalStartDate = level.sequencingParameters.startDate;
                                                    }

                                                    var startDateOriginal = new Date(intervalStartDate);
                                                    var numberOfQuestsUnlockedByInterval = cycleDate(level.sequencingParameters.interval, level.sequencingParameters.intervalPeriod, now, startDateOriginal);

                                                    if (indexOfQuestInLevel <= numberOfQuestsUnlockedByInterval && startDateOriginal <= now) {
                                                        isLocked = false;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                //If this quest does belong to the first level
                                else {
                                    //If this quest does belong to the first level in the program, check the index of the quest in the level
                                    var indexOfQuestInLevel = level.quests.indexOf(quest);
                                    if (indexOfQuestInLevel == 0 && level.sequencingParameters.intervalStartTypeId != services.helpers.sequencingTypeIntervalStartTypes.onSpecificDate.id) {
                                        //If this is the first quest in the first level, then it must be unlocked
                                        isLocked = false;
                                    } else {
                                        if (indexOfQuestInLevel == 0) {
                                            if (level.sequencingParameters.intervalStartTypeId == services.helpers.sequencingTypeIntervalStartTypes.onSpecificDate.id) {
                                                if (new Date(level.sequencingParameters.startDate) <= now) {
                                                    isLocked = false;
                                                }
                                            } else {
                                                isLocked = false;
                                            }
                                        } else {
                                            //If this is not the first quest, check if the quest before it is complete
                                            if (isQuestComplete(level.quests[indexOfQuestInLevel - 1], forumItems)) {
                                                //If the previous quest in the level is complete, and the previous level is complete, then check if it is complete based on interval
                                                var intervalStartDate;
                                                if (level.sequencingParameters.intervalStartTypeId == services.helpers.sequencingTypeIntervalStartTypes.onStartDate.id) {
                                                    intervalStartDate = level.quests[0].challenges[0].result.createdAt;
                                                } else {
                                                    intervalStartDate = level.sequencingParameters.startDate;
                                                }

                                                var startDateOriginal = new Date(intervalStartDate);
                                                var numberOfQuestsUnlockedByInterval = cycleDate(level.sequencingParameters.interval, level.sequencingParameters.intervalPeriod, now, startDateOriginal);

                                                if (indexOfQuestInLevel <= numberOfQuestsUnlockedByInterval && startDateOriginal <= now) {
                                                    isLocked = false;
                                                }
                                            }
                                        }
                                    }
                                }
                                break;
                        }
                        break;
                }
            } else {
                //The quest does not belong to a level
                switch (program.sequencingTypeId) {
                    case services.helpers.sequencingTypes.inOrder.id:
                        //The program sequencing type is InOrder, check if the program has levels
                        if (program.levels.length > 0 && programHasLevelQuests(program)) {

                            //check to see if all activity in program.quests (no level quest) is bonus
                            var isAllActivityBonus = true;
                            _.each(program.quests, function (quest) {
                                if (quest.baseOrBonus == constants.QUEST_BASE_OR_BONUS_BASE) {
                                    isAllActivityBonus = false;
                                }
                            });

                            var isLastLevelBonus = true;
                            _.each(program.levels[program.levels.length - 1].quests, function (quest) {
                                if (quest.baseOrBonus == constants.QUEST_BASE_OR_BONUS_BASE) {
                                    isLastLevelBonus = false;
                                }
                            });

                            //if last level is all bonus then we check is level before is complete. If yes then bonus level is unlocked and any non level bonus activity is unlocked. 
                            //if no then bonus level is locked and so is non level bonus activity.
                            //if last level is all bonus, but non level has base activity, then lock and unlock based on previous level before bonus level completeion. 
                            if (isLastLevelBonus) {
                                var isLevelBeforeBonusLevelComplete = isLevelComplete(program.levels[program.levels.length - 2], forumItems);
                                if (isLevelBeforeBonusLevelComplete) {
                                    //if level bwfore bonus level is complete and All non level activiy is bonus then unlock
                                    if (isAllActivityBonus) {
                                        isLocked = false;
                                    } else {
                                        //If the last level is complete, check the index of the quest
                                        var indexOfQuestInProgram = program.quests.indexOf(quest);
                                        if (indexOfQuestInProgram > 0) {
                                            //If this is not the first quest, then it is locked unless the quest before it is complete
                                            //isLocked = !isQuestComplete(program.quests[indexOfQuestInProgram - 1], forumItems);
                                            //    //If this isn't the first quest, check if the previous quest is complete or is a BONUS activity
                                            var previousQuest = program.quests[indexOfQuestInProgram - 1];
                                            if (previousQuest.baseOrBonus == constants.QUEST_BASE_OR_BONUS_BASE) {

                                                isLocked = !isQuestComplete(program.quests[indexOfQuestInProgram - 1], forumItems);

                                            } else {
                                                //previous is bonus, so need to find the preceding base. 
                                                var indexOfPrevQuestStart = indexOfQuestInProgram - 1;
                                                var precedingBaseQuestIndex = null;

                                                while (indexOfPrevQuestStart >= 0) {
                                                    if (program.quests[indexOfPrevQuestStart].baseOrBonus == constants.QUEST_BASE_OR_BONUS_BASE) {
                                                        precedingBaseQuestIndex = indexOfPrevQuestStart;
                                                        break;
                                                    } else {
                                                        indexOfPrevQuestStart--;
                                                    }
                                                }

                                                if (precedingBaseQuestIndex != null){
                                                    isLocked = !isQuestComplete(program.quests[precedingBaseQuestIndex], forumItems);
                                                } else {
                                                    isLocked = false;
                                                }
                                            }
                                        } else {
                                            //If this is the first quest, then it must be unlocked
                                            isLocked = false;
                                        }
                                    }
                                }

                            } else {
                                //If the program has levels, is the last level complete?
                                var lastLevelComplete = isLevelComplete(program.levels[program.levels.length - 1], forumItems, isLastLevelBonus);

                                if (lastLevelComplete) {
                                    if (isAllActivityBonus) {
                                        isLocked = false;
                                    } else {

                                        //If the last level is complete, check the index of the quest
                                        var indexOfQuestInProgram = program.quests.indexOf(quest);
                                        if (indexOfQuestInProgram > 0) {
                                            //If this is not the first quest, then it is locked unless the quest before it is complete
                                            //isLocked = !isQuestComplete(program.quests[indexOfQuestInProgram - 1], forumItems);
                                            //    //If this isn't the first quest, check if the previous quest is complete or is a BONUS activity
                                            var previousQuest = program.quests[indexOfQuestInProgram - 1];
                                            if (previousQuest.baseOrBonus == constants.QUEST_BASE_OR_BONUS_BASE) {

                                                isLocked = !isQuestComplete(program.quests[indexOfQuestInProgram - 1], forumItems);

                                            } else {
                                                //previous is bonus, so need to find the preceding base. 
                                                var indexOfPrevQuestStart = indexOfQuestInProgram - 1;
                                                var precedingBaseQuestIndex = null;

                                                while (indexOfPrevQuestStart >= 0) {
                                                    if (program.quests[indexOfPrevQuestStart].baseOrBonus == constants.QUEST_BASE_OR_BONUS_BASE) {
                                                        precedingBaseQuestIndex = indexOfPrevQuestStart;
                                                        break;
                                                    } else {
                                                        indexOfPrevQuestStart--;
                                                    }
                                                }
                                                if (precedingBaseQuestIndex != null) {
                                                    isLocked = !isQuestComplete(program.quests[precedingBaseQuestIndex], forumItems);
                                                } else {
                                                    isLocked = false;
                                                }
                                                
                                            }
                                        } else {
                                            //If this is the first quest, then it must be unlocked
                                            isLocked = false;
                                        }
                                    }
                                }
                            }
                        }
                        else {
                            var indexOfCurrentQuest = program.quests.indexOf(quest);
                            if (indexOfCurrentQuest > 0) {
                                //If this isn't the first quest, check if the previous quest is complete or is a BONUS activity
                                var previousQuest = program.quests[indexOfCurrentQuest - 1];
                                if (previousQuest.baseOrBonus == constants.QUEST_BASE_OR_BONUS_BASE) {

                                    isLocked = !isQuestComplete(program.quests[indexOfCurrentQuest - 1], forumItems);

                                } else {
                                    //previous is bonus, so need to find the preceding base. 
                                    var indexOfPrevQuestStart = indexOfCurrentQuest - 1;
                                    var precedingBaseQuestIndex = null;
                                    while (indexOfPrevQuestStart >= 0) {
                                        if (program.quests[indexOfPrevQuestStart].baseOrBonus == constants.QUEST_BASE_OR_BONUS_BASE) {
                                            precedingBaseQuestIndex = indexOfPrevQuestStart;
                                            break;
                                        } else {
                                            indexOfPrevQuestStart--;
                                        }
                                    }
                                    isLocked = !isQuestComplete(program.quests[precedingBaseQuestIndex], forumItems);
                                }

                            } else {
                                isLocked = false;
                            }

                        }
                        break;
                    case services.helpers.sequencingTypes.parallel.id:
                        //The program sequencing type is Parallel then quests in the program must be unlocked
                        isLocked = false;
                        break;
                    case services.helpers.sequencingTypes.interval.id:
                        //If the program does have levels
                        if (program.levels.length > 0 && programHasLevelQuests(program)) {
                            //If this is not the first quest

                            var lastLevelComplete = isLevelComplete(program.levels[program.levels.length - 1], forumItems);

                            if (lastLevelComplete) {
                                var indexOfCurrentQuest = program.quests.indexOf(quest);
                                //IF this is not the first quest, check if this quest has been unlocked by interval
                                if (indexOfCurrentQuest > 0) {
                                    if (isQuestComplete(program.quests[indexOfCurrentQuest - 1], forumItems)) {
                                        var intervalStartDate;
                                        if (program.sequencingParameters.intervalStartTypeId == services.helpers.sequencingTypeIntervalStartTypes.onStartDate.id) {
                                            if (program.levels.length > 0
                                                && program.levels[0].quests.length > 0
                                                && program.levels[0].quests[0].challenges.length > 0
                                                && program.levels[0].quests[0].challenges[0].result) {
                                                intervalStartDate = program.levels[0].quests[0].challenges[0].result.createdAt;
                                            } else {
                                                //This is not the first quest, the program interval is onStartDate, and the program hasn't been started yet, therefore this quest must be locked
                                                return true;
                                            }
                                        }
                                        else {
                                            intervalStartDate = program.sequencingParameters.startDate;
                                        }

                                        if (intervalStartDate) {
                                            var startDateOriginal = new Date(intervalStartDate);
                                            var numberOfQuestsUnlockedByInterval = cycleDate(program.sequencingParameters.interval, program.sequencingParameters.intervalPeriod, now, startDateOriginal);

                                            if ((indexOfCurrentQuest + program.levels.length) <= numberOfQuestsUnlockedByInterval && startDateOriginal <= now) {
                                                isLocked = false;
                                            }
                                        }
                                    }
                                } else {
                                    var intervalStartDate;
                                    if (program.sequencingParameters.intervalStartTypeId == services.helpers.sequencingTypeIntervalStartTypes.onStartDate.id) {
                                        if (program.levels.length > 0
                                            && program.levels[0].quests.length > 0
                                            && program.levels[0].quests[0].challenges.length > 0
                                            && program.levels[0].quests[0].challenges[0].result) {
                                            intervalStartDate = program.levels[0].quests[0].challenges[0].result.createdAt;
                                        } else {
                                            //This is not the first quest, the program interval is onStartDate, and the program hasn't been started yet, therefore this quest must be locked
                                            return true;
                                        }
                                    }
                                    else {
                                        intervalStartDate = program.sequencingParameters.startDate;
                                    }

                                    if (intervalStartDate) {
                                        var startDateOriginal = new Date(intervalStartDate);
                                        var numberOfQuestsUnlockedByInterval = cycleDate(program.sequencingParameters.interval, program.sequencingParameters.intervalPeriod, now, startDateOriginal);

                                        if ((indexOfCurrentQuest + program.levels.length) <= numberOfQuestsUnlockedByInterval && startDateOriginal <= now) {
                                            isLocked = false;
                                        }
                                    }
                                }
                            }
                        }
                        //If the program doesn't have levels
                        else {
                            //The program does't have levels, check if this is the first quest
                            var indexOfCurrentQuest = program.quests.indexOf(quest);

                            if (indexOfCurrentQuest > 0) {
                                if (isQuestComplete(program.quests[indexOfCurrentQuest - 1], forumItems)) {

                                    //The program doesn't have any levels, check if quest is complete based on interval
                                    var intervalStartDate;
                                    if (program.sequencingParameters.intervalStartTypeId == services.helpers.sequencingTypeIntervalStartTypes.onStartDate.id && indexOfCurrentQuest == 0) {
                                        //If the program interval is on Start Date and this is the first quest then the first quest must be unlocked
                                        isLocked = false;
                                    } else if (program.sequencingParameters.intervalStartTypeId == services.helpers.sequencingTypeIntervalStartTypes.onStartDate.id) {
                                        if (program.quests.length > 0
                                            && program.quests[0].challenges.length > 0
                                            && program.quests[0].challenges[0].result) {
                                            intervalStartDate = program.quests[0].challenges[0].result.createdAt;
                                        }
                                    }
                                    else {
                                        intervalStartDate = program.sequencingParameters.startDate;
                                    }

                                    if (intervalStartDate) {
                                        var startDateOriginal = new Date(intervalStartDate);
                                        var numberOfQuestsUnlockedByInterval = cycleDate(program.sequencingParameters.interval, program.sequencingParameters.intervalPeriod, now, startDateOriginal);


                                        if (indexOfCurrentQuest <= numberOfQuestsUnlockedByInterval && startDateOriginal <= now) {
                                            isLocked = false;
                                        }
                                    }
                                }
                            } else {
                                //The program doesn't have any levels, check if quest is complete based on interval
                                var intervalStartDate;
                                if (program.sequencingParameters.intervalStartTypeId == services.helpers.sequencingTypeIntervalStartTypes.onStartDate.id) {
                                    //If the program interval is on Start Date and this is the first quest then the first quest must be unlocked
                                    isLocked = false;
                                }
                                else {
                                    intervalStartDate = program.sequencingParameters.startDate;
                                }

                                if (intervalStartDate) {
                                    var startDateOriginal = new Date(intervalStartDate);
                                    var numberOfQuestsUnlockedByInterval = cycleDate(program.sequencingParameters.interval, program.sequencingParameters.intervalPeriod, now, startDateOriginal);

                                    if (indexOfCurrentQuest <= numberOfQuestsUnlockedByInterval && startDateOriginal <= now) {
                                        isLocked = false;
                                    }
                                }
                            }
                        }
                        break;
                }
            }

            if (isQuestComplete(quest, forumItems)) {
                badgeController._getQuestBadge(quest.id, user.id).then(function (badge) {
                    if (badge) {
                        quest.awardedBadge = badge;
                    }
                    callback(null);
                })
            } else {
                callback(null);
            }

            return isLocked;
        };

        var programStatusCheck = function (quest, program, level) {
            var isLocked = true;

            var indexOfCurrentLevel = program.levels.indexOf(level);
            //If this quest does not belong to the first level
            if (indexOfCurrentLevel > 0) {

                //check if this is the last level. IF yes then check previous level is cmoplete
                var isLastLevel = false;
                var getLastLevelIndex = program.levels.length - 1;
                if (getLastLevelIndex == indexOfCurrentLevel) {
                    isLastLevel = true;
                }

                //Check if the previous level has been completed
                var isPreviousLevelComplete = isLevelComplete(program.levels[indexOfCurrentLevel - 1], forumItems);

                if (isLastLevel) {

                    var isLastLevelBonus = true;

                    _.each(level.quests, function (quest) {
                        if (quest.baseOrBonus == constants.QUEST_BASE_OR_BONUS_BASE) {
                            isLastLevelBonus = false;
                        }
                    });

                    if (isLastLevelBonus) {
                        if (isPreviousLevelComplete) {
                            isLocked = false;// if last level is all bonus and previous level is complete, unlock all
                        }
                    } else {
                        if (isPreviousLevelComplete) {
                            //If the previous level is complete, check if this is the first quest in the level
                            var indexOfQuestInLevel = level.quests.indexOf(quest);
                            if (indexOfQuestInLevel == 0) {
                                //If this is the first quest in the level, and the previous level in complete, then this quest is unlocked
                                isLocked = false;
                            } else {
                                //If this isn't the first quest in the level, check if the previous quest in the level is complete
                                var previousQuest = level.quests[indexOfQuestInLevel - 1];
                                if (previousQuest.baseOrBonus == constants.QUEST_BASE_OR_BONUS_BASE) {
                                    isLocked = !isQuestComplete(previousQuest, forumItems);
                                } else {
                                    //previous is bonus
                                    var indexOfPrevLevelQuestStart = indexOfQuestInLevel - 1;
                                    var precedingBaseQuestIndex = null;

                                    while (indexOfPrevLevelQuestStart >= 0) {
                                        if (level.quests[indexOfPrevLevelQuestStart].baseOrBonus == constants.QUEST_BASE_OR_BONUS_BASE) {
                                            precedingBaseQuestIndex = indexOfPrevLevelQuestStart;
                                            break;
                                        } else {
                                            indexOfPrevLevelQuestStart--;
                                        }
                                    }
                                    isLocked = !isQuestComplete(level.quests[precedingBaseQuestIndex], forumItems);
                                }
                            }

                        }
                    }
                } else {
                    if (isPreviousLevelComplete) {
                        //If the previous level is complete, check if this is the first quest in the level
                        var indexOfQuestInLevel = level.quests.indexOf(quest);
                        if (indexOfQuestInLevel == 0) {
                            //If this is the first quest in the level, and the previous level in complete, then this quest is unlocked
                            isLocked = false;
                        } else {
                            //If this isn't the first quest in the level, check if the previous quest in the level is complete
                            var previousQuest = level.quests[indexOfQuestInLevel - 1];
                            if (previousQuest.baseOrBonus == constants.QUEST_BASE_OR_BONUS_BASE) {
                                isLocked = !isQuestComplete(previousQuest, forumItems);
                            } else {
                                //previous is bonus
                                var indexOfPrevLevelQuestStart = indexOfQuestInLevel - 1;
                                var precedingBaseQuestIndex = null;

                                while (indexOfPrevLevelQuestStart >= 0) {
                                    if (level.quests[indexOfPrevLevelQuestStart].baseOrBonus == constants.QUEST_BASE_OR_BONUS_BASE) {
                                        precedingBaseQuestIndex = indexOfPrevLevelQuestStart;
                                        break;
                                    } else {
                                        indexOfPrevLevelQuestStart--;
                                    }
                                }
                                isLocked = !isQuestComplete(level.quests[precedingBaseQuestIndex], forumItems);
                            }
                        }
                    }

                }
            } else {
                //If this quest does belong to the first level in the program, check the index of the quest in the level
                var indexOfQuestInLevel = level.quests.indexOf(quest);
                if (indexOfQuestInLevel == 0) {
                    //If this is the first quest in the first level, then it must be unlocked
                    isLocked = false;
                } else {
                    //If this is not the first quest, check if the quest before it is complete
                    var previousQuest = level.quests[indexOfQuestInLevel - 1];
                    if (previousQuest.baseOrBonus == constants.QUEST_BASE_OR_BONUS_BASE) {
                        isLocked = !isQuestComplete(previousQuest, forumItems);
                    } else {
                        //previous is bonus
                        var indexOfPrevLevelQuestStart = indexOfQuestInLevel - 1;
                        var precedingBaseQuestIndex = null;

                        while (indexOfPrevLevelQuestStart >= 0) {
                            if (level.quests[indexOfPrevLevelQuestStart].baseOrBonus == constants.QUEST_BASE_OR_BONUS_BASE) {
                                precedingBaseQuestIndex = indexOfPrevLevelQuestStart;
                                break;
                            } else {
                                indexOfPrevLevelQuestStart--;
                            }
                        }
                        isLocked = !isQuestComplete(level.quests[precedingBaseQuestIndex], forumItems);
                    }
                }
            }
            return isLocked;
        };

        //Formats the quest images and updates the scoring based on completed challenges
        var formatQuest = function (quest, program, callback) {
            quest.challengeCount = 0;
            quest.challengesComplete = 0;
            quest.score = {
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
            };
            quest.complete = services.quests.isQuestComplete(quest, forumItems);
            if (quest.type == 'T') {
                if (quest.notReallyComplete) {
                    quest.complete = false;
                }
            }

            quest.backgroundImageUrl = services.helpers.makeMediaUrl(quest.backgroundImageRef);
            quest.featuredImageUrl = services.helpers.makeMediaUrl(quest.featuredImageRef);

            if (quest.type == 'L') {
                _.each(quest.challenges, function (challenge) {
                    if (challenge.results.length > 0) {
                        challenge.result = challenge.results[0];
                        if (!mostRecentCompletedChallenge || challenge.result.createdAt > mostRecentCompletedChallenge.result.createdAt) {
                            mostRecentCompletedChallenge = challenge;
                            program.currentLevelOrQuest = quest.levelId == null ? quest.title : _.findWhere(program.levels, { id: Number(quest.levelId) }).title;
                        }
                        challenge.complete = true;
                    }
                    if (challenge.result != null) challenge.complete = true;
                    challenge.score = {
                        points: {
                            total: challenge.points,
                            earned: challenge.result ? (challenge.result.points ? challenge.result.points : 0) : 0
                        },
                        jems: {
                            total: 0,
                            earned: 0
                        },
                        badges: {
                            total: 0,
                            earned: 0
                        }
                    };

                    if (challenge.type != 'finish') {
                        quest.challengeCount++;
                        if (challenge.complete) {
                            quest.challengesComplete++;
                        }
                    }
                    quest.score.points.total += challenge.score.points.total;
                    quest.score.points.earned += challenge.score.points.earned;

                    challenge.recentFinishers = [];
                    challenge.totalFinishers = challenge.results.length;

                    var sortedResults = _.sortBy(challenge.results, function (r) {
                        return -r.createdAt
                    });
                    var topRecentFinishers = _.first(sortedResults, Math.min(sortedResults.length, 3));
                    _.each(topRecentFinishers, function (result) {
                        var avatarUrl = services.helpers.makeMediaUrl(result.user.avatarUrl);
                        challenge.recentFinishers.push(avatarUrl);
                    });


                    challenge.results = undefined;

                    program.score.points.total += challenge.score.points.total;
                    program.score.points.earned += challenge.score.points.earned;
                    if (quest.challengesComplete >= quest.challengeCount) {
                        program.questsComplete++;
                        quest.complete = true;
                    }

                    if (program.questsComplete >= program.quests.length) result.programsComplete++;

                });
            }
            else if (quest.type == 'I') {
                //if (program.forum) {

                //}
                program.score.points.total += quest.inspirePoints;
                quest.score.points.total += quest.inspirePoints;
                if (quest.complete) {
                    quest.score.points.earned += quest.inspirePoints;
                    program.score.points.earned += quest.inspirePoints;
                    program.questsComplete++;
                }
            }
            else if (quest.type == 'T') {
                if (program.forum && quest.todos && quest.todos.length > 0) {
                    quest.score.points.total += quest.todos[0].points;
                    if (quest.complete) {
                        //to-do points are added to program score in formatProgram()
                        quest.score.points.earned += quest.todos[0].points;
                        program.questsComplete++;

                        _.each(quest.todos[0].userTodos[0].bonusPoints, function (bonusPoints) {
                            //bonus points are added the the program at the end where forum items points are calced
                            quest.score.points.earned += bonusPoints.points;
                        });
                    }
                }
            }

            callback(null);
        };

        //Formats each program
        var formatProgram = function (program, todosFound, callback) {
            mostRecentCompletedChallenge = null;

            var badgeCount = _.countBy(program.badges, function (badge) {
                return badge.userBadges.length > 0 ? 'earned' : 'not'
            }).earned;

            if (badgeCount > 0) {
                result.badges.earned += badgeCount;
            }


            program.score = {
                points: {
                    total: 0,
                    earned: 0
                },
                jems: {
                    total: 0,
                    earned: 0
                },
                badges: {
                    total: program.badges.length,
                    earned: badgeCount > 0 ? badgeCount : 0
                },
                bonusPointsUsed: 0
            };


            //Calculate the author
            var author = null;
            if (!author && program.clientId != program.contentProviderId) author = program.contentProvider ? program.contentProvider.name : null;
            if (!author) author = program.contentAuthor;
            if (!author) author = program.history.user.firstName + ' ' + program.history.user.lastName;

            //Setup the content object
            program.content = {
                provider: program.contentProvider,
                author: author,
                descriptions: program.contentDescription
            };

            var getWhereStatus = function () {
                if (preview) {
                    return { $ne: null }
                } else {
                    return { $ne: 'preview' }
                }
            };

            var userTodos = todosFound;

            var unlockedUserTodos = _.filter(userTodos, function (userTodo) {
                return userTodo.status != 'locked';
            });

            program.userTodos = unlockedUserTodos ? unlockedUserTodos : [];

            _.each(userTodos, function (userTodo) {
                //if (userTodo.todo.requirements.length > 0) {
                program.score.points.total += userTodo.todo.points;
                //}
            });

            _.each(program.userTodos, function (userTodo) {
                _.each(userTodo.bonusPoints, function (pointsRecord) {
                    pointsRecord.user.avatarUrl = services.helpers.makeMediaUrl(pointsRecord.user.avatarUrl)
                });

                _.each(userTodo.todo.challenges, function (challenge) {
                    challenge.results = _.filter(userTodo.results, function (result) {
                        return result.challengeId == challenge.id;
                    });
                    challenge.userMedia = _.filter(userTodo.userMedia, function (media) {
                        return media.challengeId == challenge.id;
                    });

                    _.each(challenge.userMedia, function (media) {
                        if (media.type == 'image' || media.type == 'audio')
                            media.url = services.helpers.makeMediaUrl(media.data);
                        else if (media.type == 'video') {
                            if (media.source == 'system')
                                media.url = services.helpers.makeMediaUrl(media.data);
                            else if (media.source == 'youtube') {
                                media.iframe = media.data
                            }
                        }
                        else if (media.type == 'text')
                            media.text = media.data;
                        else if (media.type == 'link')
                            media.link = media.data;
                        else if (media.type == 'resource')
                            media.url = services.helpers.makeResourceUrl(media.data);
                    });

                    _.each(challenge.results, function (result) {
                        result.user.avatarUrl = services.helpers.makeMediaUrl(result.user.avatarUrl);
                    });
                });
            });

            Q.all([
                //Go get the count of published program versions, this will be the programs version number, if not preview then don't include programs
                //with status = preview in the count
                models.Program.count({
                    where: {
                        linkId: program.linkId,
                        status: getWhereStatus(),
                        published: { $ne: null }
                    }
                }),
                //Took this query from get_program_user stored proc to get only the most recent published programs
                models.Forum.find({
                    where: {
                        linkId: program.linkId
                    }
                }),
                models.ProgramLicense.find({
                    where: {
                        linkId: program.linkId
                    }
                })
            ]).spread(function (count, forum, license) {
                program.forum = forum;
                program.editable = license ? license.type == 'edit' : true;
                //Set the version
                program.version = count;


                //In order to make sequelize load quests as a child or programs and levels a different alias must be used for each
                //I don't want these aliases propogating through the code, so when fetching programs we go through the result and rename 'programQuests'
                //and 'levelQuests' to 'quests'
                program.quests = program.programQuests;

                var newQuests = [];
                _.each(program.quests, function (q) {
                    if (q.type == 'L') {
                        newQuests.push(q);

                        var todos = _.filter(program.todos, function (x) {
                            if (x.requirements.length > 0) {
                                var req = _.find(x.requirements, function (y) {
                                    return y.requirementRefId == q.id && y.requirementRef == 'Quest'
                                });
                                if (req) {
                                    return true;
                                }
                            }
                        });

                        if (todos.length) {
                            _.each(todos, function (todo) {
                                var quest = _.find(program.quests, function (x) {
                                    return x.id == todo.questId
                                });
                                if (quest) {
                                    newQuests.push(quest);
                                }
                            })
                        }
                    }
                    if (!q.levelId && q.type == 'T') {
                        var todo = _.find(program.todos, function (t) {
                            return t.questId == q.id
                        });
                        if (todo && todo.requirements.length == 0) {
                            newQuests.push(q);
                        }
                    }
                    if (q.type == 'I') {
                        newQuests.push(q);
                    }
                });

                program.quests = newQuests;

                program.questsComplete = 0;

                result.badges.total += program.badges.length;


                //Format the program image
                program.imageUrl = services.helpers.makeMediaUrl(program.imageRef);
                program.sequencingParameters = program.sequencingParameters ? JSON.parse(program.sequencingParameters) : null;


                //Move the quests that belong to levels into their level, originally this was part of the query but the extra joins slowed things to a crawl
                var questsToAssignToLevels = [];

                _.each(program.programQuests, function (quest) {
                    if (quest.levelId) {
                        questsToAssignToLevels.push(quest);
                    }
                });
                program.programQuests = undefined;

                _.each(program.userTodos, function (userTodo) {
                    if (userTodo.todo.resourceUrl) {
                        userTodo.todo.resourceUrl = services.helpers.makeResourceUrl(userTodo.todo.resourceUrl);
                    }
                });


                _.each(questsToAssignToLevels, function (quest) {
                    program.quests = _.without(program.quests, quest);
                    var level = _.findWhere(program.levels, { id: Number(quest.levelId) });
                    if (!level.quests) {
                        level.quests = [];
                    }
                    level.quests.push(quest);
                });

                _.each(program.levels, function (level) {
                    var levelQuests = [];
                    var todoQuests = [];
                    _.each(level.quests, function (q) {
                        if (q.type == 'L' || q.type == 'I') {
                            levelQuests.push(q);
                        } else if (q.type == 'T') {
                            var todo = _.find(program.todos, function (t) {
                                return t.questId == q.id
                            });
                            if (todo && todo.requirements.length == 0) {
                                levelQuests.push(q);
                            } else if (todo && todo.requirements.length > 0 && todo.requirements[0].requirementRef == 'Level') {
                                todoQuests.push(q);
                            } else if (todo) {
                                levelQuests.push(q);
                            }
                        }
                    });

                    level.quests = levelQuests;
                    level.quests = level.quests.concat(todoQuests);
                });


                program.levels = _.filter(program.levels, function (level) {
                    return level.quests && level.quests.length > 0;
                });


                //Format the level quests and the program quests
                Q.all([
                    Q.Promise(function (resolve, reject) {
                        async.eachSeries(program.levels,
                            function (level, callback) {
                                if (!level.quests) {
                                    level.quests = [];
                                }
                                level.sequencingParameters = level.sequencingParameters ? JSON.parse(level.sequencingParameters) : null;

                                async.eachSeries(level.quests,
                                    function (quest, callback) {
                                        /*TK*/
                                        formatQuest(quest, program, callback);
                                        // callback();
                                    },
                                    function () {
                                        callback(null);
                                    })
                            }, function () {
                                resolve();
                            })
                    }),
                    Q.Promise(function (resolve, reject) {
                        async.eachSeries(program.quests,
                            function (quest, callback) {
                                formatQuest(quest, program, callback);
                            },
                            function () {
                                resolve();
                            })
                    })
                ]).then(function () { //When all quest formatting is complete push the program into the collection
                    Q.all([
                        Q.Promise(function (resolve, reject) {
                            async.eachSeries(program.quests,
                                function (quest, callback) {
                                    quest.isLocked = getQuestLockState(quest, program, callback);
                                },
                                function () {
                                    resolve();
                                })
                        }),
                        Q.Promise(function (resolve, reject) {
                            async.eachSeries(program.levels,
                                function (level, callback) {
                                    async.eachSeries(level.quests,
                                        function (quest, callback) {
                                            quest.isLocked = getQuestLockState(quest, program, callback);
                                        },
                                        function () {
                                            callback(null);
                                        })
                                },
                                function () {
                                    resolve();
                                })
                        })

                    ]).then(function () {
                        result.programs.push(program);
                        callback(null);
                    })
                });
            }
                );
        };

        var sql =
            'SELECT MAX(P.id) as id, P.linkId FROM Programs P\n' +
            'JOIN Clients C ON C.id=P.clientId\n' +
            'JOIN ClientUsers CU ON CU.clientId=C.id\n' +
            'WHERE P.deletedAt IS NULL AND CU.userId=:uid AND P.slug = :slug AND\n' +
            '((:preview=1 AND P.status = \'preview\') OR P.status!=\'preview\') AND\n' +
            'P.published IS NOT NULL AND\n' +
            '((:preview=1 AND P.status = \'preview\') OR (SELECT COUNT(*) FROM ProgramUsers PU1 WHERE PU1.linkId = P.linkId AND PU1.userId = :uid) > 0)\n' +
            'GROUP BY P.linkId';

        //var sql = 'SELECT MAX(P.id) AS maxId FROM Programs P\n' +
        //    'WHERE P.deletedAt IS NULL AND P.slug=:slug AND P.clientId=:cid AND\n' +
        //    '((:preview=1 AND P.status = \'preview\')  OR P.status!=\'preview\') AND\n' +
        //    'P.published IS NOT NULL AND\n' +
        //    '((:preview=1 AND P.status = \'preview\') OR (SELECT COUNT(*) FROM ProgramUsers PU WHERE PU.userId=:uid AND PU.linkId = P.linkId) > 0)\n';

        //Took this query from get_program_user stored proc to get only the most recent published programs
        models.sequelize.query(sql, {
            replacements: {
                uid: user.id,
                preview: (preview ? 1 : 0),
                slug: slug
                //cid: user.clients[0].id
            },
            type: models.sequelize.QueryTypes.SELECT
        }).then(function (id) {
            var programId = id[0].id;
            var programLinkId = id[0].linkId;
            if (programId) {
                Q.all([
                    models.Program.find({
                        where: {
                            id: programId
                        },
                        include: [
                            {
                                model: models.History,
                                as: 'history',
                                include: [
                                    {
                                        model: models.User,
                                        as: 'user',
                                        attributes: ['id', 'firstName', 'lastName', 'email', 'title', 'email', 'avatarUrl', 'why', 'destination']
                                    }
                                ]
                            },
                            {
                                model: models.Client, as: 'contentProvider'
                            },
                            {
                                model: models.Client,
                                as: 'client'
                            }
                        ]
                    }),
                    models.Program.find({
                        where: {
                            linkid: programLinkId,
                            published: {
                                $ne: null
                            }
                        }
                    }),
                    models.Level.findAll({
                        where: {
                            programId: programId
                        }
                    }),
                    models.Badge.findAll({
                        where: {
                            programId: programId
                        },
                        include: [
                            {
                                model: models.UserBadge,
                                as: 'userBadges',
                                where: { userId: user.id, earned: true },
                                required: false
                            },
                            {
                                model: models.BadgeRequirement,
                                as: 'requirements'
                            }
                        ]
                    }),
                    models.Todo.findAll({
                        where: {
                            programId: programId,
                            questId: {
                                $ne: null
                            }
                        },
                        include: [
                            {
                                model: models.TodoRequirement,
                                as: 'requirements'
                            }
                        ]
                    }),
                    models.Quest.findAll({
                        where: {
                            programId: programId
                        },
                        order: [['sequence', 'ASC']],
                        include: [
                            {
                                model: models.Todo,
                                as: 'todos',
                                include: [
                                    {
                                        model: models.UserTodo,
                                        as: 'userTodos',
                                        include: [
                                            {
                                                model: models.UserTodoRequirementsFulfillment,
                                                as: 'requirements'
                                            },
                                            {
                                                model: models.BonusPoints,
                                                as: 'bonusPoints'
                                            }
                                        ],
                                        where: { userId: user.id },
                                        required: false
                                    },
                                    {
                                        model: models.TodoRequirement,
                                        as: 'requirements',
                                        required: false
                                    }
                                ],
                                required: false
                            },
                            {
                                model: models.Challenge,
                                as: 'challenges',
                                include: [
                                    {
                                        model: models.ChallengeResult,
                                        as: 'results',
                                        where: { userId: user.id },
                                        required: false,
                                        include: [
                                            {
                                                model: models.User,
                                                as: 'user'
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    })
                ]).spread(function (programFound, allProgramRecords, levels, badges, todos, programQuests) {
                    programFound = JSON.stringify(programFound);
                    programFound = JSON.parse(programFound);
                    firstProgramCreated = JSON.stringify(allProgramRecords);
                    firstProgramCreated = JSON.parse(firstProgramCreated);
                    levels = JSON.stringify(levels);
                    levels = JSON.parse(levels);
                    badges = JSON.stringify(badges);
                    badges = JSON.parse(badges);
                    todos = JSON.stringify(todos);
                    todos = JSON.parse(todos);
                    programQuests = JSON.stringify(programQuests);
                    programQuests = JSON.parse(programQuests);
                    var program = programFound;
                    program.firstCreated = firstProgramCreated.createdAt;
                    program.firstPublished = firstProgramCreated.published;
                    program.levels = levels;
                    program.badges = badges;
                    program.todos = todos;
                    program.programQuests = programQuests;
                    forumItems = [];
                    Q.all([
                        Q.Promise(function (resolve, reject) {
                            //Below code sets up the userTodos and userBadges, we can return the response before these are done and let them finish in background
                            var badges = _.clone(program.badges);
                            var badgeIds = _.pluck(badges, 'id');
                            var questIds = _.pluck(programQuests, 'id');
                            models.Forum.findOne({
                                where: {
                                    linkId: program.linkId
                                }
                            }).then(function (forum) {
                                program.forum = forum;
                            }),
                                models.ForumItem.findAll({
                                    where: {
                                        questId: {
                                            $in: questIds
                                        },
                                        createdById: user.id
                                    },
                                    include: [
                                        {
                                            model: models.Forum,
                                            as: 'forum'
                                        }
                                    ]
                                }).then(function (lforumItems) {
                                    if (lforumItems && lforumItems.length > 0) {
                                        forumItems = lforumItems;
                                    }
                                }),
                                models.UserBadge.findAll({
                                    where: {
                                        badgeId: {
                                            $in: badgeIds
                                        },
                                        userId: user.id
                                    },
                                    raw: true
                                }).then(function (userBadges) {
                                    if (!userBadges || userBadges.length != badgeIds.length) {
                                        // Loop through the work answers
                                        async.eachSeries(badgeIds,
                                            function (badgeId, callback) {
                                                var matchingBadge = _.find(badges, { id: badgeId });
                                                if (!userBadges || !_.find(userBadges, { id: badgeId })) {
                                                    models.UserBadge.create({
                                                        earned: false,
                                                        badgeId: badgeId,
                                                        userId: user.id
                                                    }).then(function (newUserBadge) {
                                                        var badgeRequirements = matchingBadge.requirements;
                                                        if (badgeRequirements.length > 0) {
                                                            _.each(badgeRequirements, function (requirement) {
                                                                models.UserBadgeRequirementsFulfillment.create({
                                                                    fulfilled: false,
                                                                    userBadgeId: newUserBadge.id,
                                                                    badgeRequirementId: requirement.id
                                                                }).then(function () {
                                                                    callback(null);
                                                                });
                                                            })
                                                        } else {
                                                            callback();
                                                        }
                                                    })
                                                } else {
                                                    callback();
                                                }
                                            },
                                            function (err) {
                                                if (err) reject(err);
                                                resolve();
                                            });
                                    } else {
                                        resolve()
                                    }
                                });
                        }),
                        Q.Promise(function (resolve, reject) {
                            var todos = _.clone(program.todos);
                            var todoIds = _.pluck(todos, 'id');

                            models.UserTodo.findAll({
                                where: {
                                    todoId: {
                                        $in: todoIds
                                    },
                                    userId: user.id
                                },
                                raw: true
                            }).then(function (userTodos) {
                                if (!userTodos || userTodos.length != todoIds.length) {
                                    // Loop through the work answers
                                    async.eachSeries(todoIds,
                                        function (todoId, callback) {
                                            var matchingTodo = _.find(todos, { id: todoId });
                                            if (!userTodos || !_.find(userTodos, { todoId: todoId })) {
                                                models.UserTodo.create({
                                                    status: 'locked',
                                                    todoId: todoId,
                                                    userId: user.id
                                                }).then(function (newUserTodo) {
                                                    var todoRequirements = matchingTodo.requirements;
                                                    if (todoRequirements.length > 0) {
                                                        _.each(todoRequirements, function (requirement) {
                                                            models.UserTodoRequirementsFulfillment.create({
                                                                fulfilled: false,
                                                                userTodoId: newUserTodo.id,
                                                                todoRequirementId: requirement.id
                                                            }).then(function () {
                                                                callback(null);
                                                            });
                                                        })
                                                    } else {
                                                        callback(null)
                                                    }
                                                })
                                            } else {
                                                callback(null);
                                            }
                                        },
                                        function (err) {
                                            if (err) return reject(err);
                                            resolve();
                                        });
                                } else {
                                    resolve();
                                }
                            });
                        })
                    ]).then(function () {
                        models.UserTodo.findAll({
                            where: {
                                userId: user.id
                            },
                            include: [
                                {
                                    model: models.BonusPoints,
                                    as: 'bonusPoints',
                                    include: [
                                        {
                                            model: models.User,
                                            as: 'user',
                                            attributes: ['id', 'firstName', 'lastName', 'avatarUrl']
                                        }
                                    ]
                                },
                                {
                                    model: models.ChallengeResult,
                                    as: 'results',
                                    include: [
                                        {
                                            model: models.ChallengeResultItem,
                                            as: 'items'
                                        },

                                        {
                                            model: models.User,
                                            as: 'user',
                                            attributes: ['id', 'firstName', 'lastName', 'email', 'title', 'email', 'avatarUrl', 'why', 'destination'],
                                            paranoid: false
                                        }
                                    ],
                                    required: false
                                },
                                {
                                    model: models.UserChallengeMedia,
                                    as: 'userMedia',
                                    required: false
                                },
                                {
                                    model: models.Todo,
                                    as: 'todo',
                                    include: [
                                        {
                                            model: models.Challenge,
                                            as: 'challenges',
                                            include: [
                                                {
                                                    model: models.ChallengeQuestion,
                                                    as: 'questions'
                                                }
                                            ]
                                        },
                                        {
                                            model: models.Program,
                                            as: 'program',
                                            where: {
                                                id: programId
                                            },
                                            required: true
                                        },
                                        {
                                            model: models.TodoRequirement,
                                            as: 'requirements'
                                        }
                                    ]
                                }
                            ]
                        }).then(function (todosFound) {
                            todosFound = JSON.stringify(todosFound);
                            todosFound = JSON.parse(todosFound);

                            var questIds = [];
                            _.each(programFound.programQuests, function (quest) {
                                questIds.push(quest.id);
                            });


                            Q.all([
                                Q.Promise(function (resolve, reject) {
                                    //Loop through each found program to format it, when done resolve the result
                                    async.eachSeries([programFound],
                                        function (program, callback) {
                                            formatProgram(program, todosFound, callback);
                                        },
                                        function () {
                                            resolve();
                                        })
                                }),
                                models.ForumItem.findAll({
                                    attributes: ['id', 'createdById', 'type', 'subType', 'createdAgainstId', 'questId'],
                                    where: {
                                        createdById: user.id
                                    },
                                    include: [
                                        {
                                            model: models.Forum,
                                            as: 'forum',
                                            where: {
                                                linkId: programFound.linkId
                                            }
                                        },
                                        {
                                            model: models.BonusPoints,
                                            as: 'bonusPoints'
                                        },
                                        {
                                            model: models.ForumItem,
                                            as: 'parent'
                                        }
                                    ]
                                }),
                                models.ForumItem.findAll({
                                    attributes: ['id', 'createdAgainstId', 'type', 'subType', 'createdById', 'questId'],
                                    where: {
                                        createdAgainstId: user.id
                                    },
                                    include: [
                                        {
                                            model: models.Forum,
                                            as: 'forum',
                                            where: {
                                                linkId: programFound.linkId
                                            }
                                        },
                                        {
                                            model: models.BonusPoints,
                                            as: 'bonusPoints'
                                        },
                                        {
                                            model: models.ForumItem,
                                            as: 'parent'
                                        }
                                    ]
                                }),
                                models.ForumItemLike.findAll({
                                    where: {
                                        createdById: user.id,
                                        createdAgainstId: {
                                            $ne: user.id
                                        }
                                    },
                                    include: [
                                        {
                                            model: models.ForumItem,
                                            as: 'forumItem',
                                            include: [
                                                {
                                                    model: models.Forum,
                                                    as: 'forum',
                                                    where: {
                                                        linkId: programFound.linkId
                                                    }
                                                },
                                                {
                                                    model: models.ForumItem,
                                                    as: 'parent'
                                                }
                                            ]
                                        }
                                    ],
                                    attributes: ['id', 'createdById', 'createdAgainstId']
                                }),
                                models.ForumItemLike.findAll({
                                    where: {
                                        createdAgainstId: user.id,
                                        createdById: {
                                            $ne: user.id
                                        }
                                    },
                                    include: [
                                        {
                                            model: models.ForumItem,
                                            as: 'forumItem',
                                            include: [
                                                {
                                                    model: models.Forum,
                                                    as: 'forum',
                                                    where: {
                                                        linkId: programFound.linkId
                                                    }
                                                },
                                                {
                                                    model: models.ForumItem,
                                                    as: 'parent'
                                                }
                                            ]
                                        }
                                    ],
                                    attributes: ['id', 'createdAgainstId', 'createdById']
                                }),
                                models.ForumItemDislike.findAll({
                                    where: {
                                        createdById: user.id,
                                        createdAgainstId: {
                                            $ne: user.id
                                        }
                                    },
                                    include: [
                                        {
                                            model: models.ForumItem,
                                            as: 'forumItem',
                                            include: [
                                                {
                                                    model: models.Forum,
                                                    as: 'forum',
                                                    where: {
                                                        linkId: programFound.linkId
                                                    }
                                                },
                                                {
                                                    model: models.ForumItem,
                                                    as: 'parent'
                                                }
                                            ]
                                        }
                                    ],
                                    attributes: ['id', 'createdById', 'createdAgainstId']
                                }),
                                models.ForumItemDislike.findAll({
                                    where: {
                                        createdAgainstId: user.id,
                                        createdById: {
                                            $ne: user.id
                                        }
                                    },
                                    include: [
                                        {
                                            model: models.ForumItem,
                                            as: 'forumItem',
                                            include: [
                                                {
                                                    model: models.Forum,
                                                    as: 'forum',
                                                    where: {
                                                        linkId: programFound.linkId
                                                    }
                                                },
                                                {
                                                    model: models.ForumItem,
                                                    as: 'parent'
                                                }
                                            ]
                                        }
                                    ],
                                    attributes: ['id', 'createdAgainstId', 'createdById']
                                }),
                                models.UserBadge.findAll({
                                    where: {
                                        userId: user.id,
                                        earned: true
                                    },
                                    include: [
                                        {
                                            model: models.Badge,
                                            as: 'badge',
                                            where: {
                                                programId: programFound.id
                                            }
                                        }
                                    ],
                                    attributes: ['id', 'userId', 'earned']
                                }),
                                models.UserTodo.findAll({
                                    where: {
                                        userId: user.id,
                                        hasBeenCompleted: true
                                    },
                                    attributes: ['id', 'userId', 'status', 'hasBeenCompleted'],
                                    include: [
                                        {
                                            model: models.Todo,
                                            as: 'todo',
                                            where: {
                                                programId: programFound.id
                                            }
                                        },
                                        {
                                            model: models.BonusPoints,
                                            as: 'bonusPoints'
                                        }
                                    ]
                                }),
                                models.BonusPoints.findAll({
                                    where: {
                                        userId: user.id
                                    },
                                    include: [
                                        {
                                            model: models.UserTodo,
                                            as: 'userTodo',
                                            include: [
                                                {
                                                    model: models.Todo,
                                                    as: 'todo',
                                                    where: {
                                                        programId: programFound.id
                                                    }
                                                }
                                            ]
                                        }
                                    ]
                                }),
                                models.BonusPoints.findAll({
                                    where: {
                                        userId: user.id
                                    },
                                    include: [
                                        {
                                            model: models.ForumItem,
                                            as: 'forumItem',
                                            include: [
                                                {
                                                    model: models.Forum,
                                                    as: 'forum',
                                                    where: {
                                                        linkId: programFound.linkId
                                                    }
                                                }
                                            ]
                                        }
                                    ]
                                }),
                                models.ForumItem.findAll({
                                    where: {
                                        createdById: {
                                            $ne: user.id
                                        },
                                        subType: 'appreciation'
                                    },
                                    include: [
                                        {
                                            model: models.ForumItemUser,
                                            as: 'users',
                                            where: {
                                                userId: user.id
                                            }
                                        },
                                        {
                                            model: models.BonusPoints,
                                            as: 'bonusPoints'
                                        },
                                        {
                                            model: models.Forum,
                                            as: 'forum',
                                            where: {
                                                linkId: programFound.linkId
                                            }
                                        }
                                    ]
                                })
                            ]).spread(function (programsResult, createdForumItems, recievedForumItems, createdForumLikes, recievedForumLikes, createdForumDislikes, recievedForumDislikes, userBadges, userTodos, usedTodoBonusPoints, userInspirationBonusPoints, recievedAppreciations) {
                                createdForumItems = JSON.stringify(createdForumItems);
                                createdForumItems = JSON.parse(createdForumItems);
                                recievedForumItems = JSON.stringify(recievedForumItems);
                                recievedForumItems = JSON.parse(recievedForumItems);
                                createdForumLikes = JSON.stringify(createdForumLikes);
                                createdForumLikes = JSON.parse(createdForumLikes);
                                recievedForumLikes = JSON.stringify(recievedForumLikes);
                                recievedForumLikes = JSON.parse(recievedForumLikes);
                                createdForumDislikes = JSON.stringify(createdForumDislikes);
                                createdForumDislikes = JSON.parse(createdForumDislikes);
                                recievedForumDislikes = JSON.stringify(recievedForumDislikes);
                                recievedForumDislikes = JSON.parse(recievedForumDislikes);
                                userBadges = JSON.stringify(userBadges);
                                userBadges = JSON.parse(userBadges);
                                userTodos = JSON.stringify(userTodos);
                                userTodos = JSON.parse(userTodos);

                                _.each(usedTodoBonusPoints, function (pointsRecord) {
                                    result.programs[0].score.bonusPointsUsed += pointsRecord.points;
                                });

                                _.each(userInspirationBonusPoints, function (pointsRecord) {
                                    result.programs[0].score.bonusPointsUsed += pointsRecord.points;
                                });


                                _.each(recievedAppreciations, function (recAppreciation) {
                                    _.each(recAppreciation.bonusPoints, function (pointsRecord) {
                                        result.programs[0].score.points.earned += pointsRecord.points;
                                    })
                                });

                                _.each(userTodos, function (userTodo) {
                                    if (userTodo.hasBeenCompleted) {
                                        result.programs[0].score.points.earned += userTodo.todo.points;
                                        if (userTodo.bonusPoints) {
                                            _.each(userTodo.bonusPoints, function (pointsRecord) {
                                                result.programs[0].score.points.earned += pointsRecord.points;
                                            })
                                        }
                                    }
                                });

                                _.each(userBadges, function (userBadge) {
                                    if (userBadge.earned) {
                                        result.programs[0].score.badges.earned++;
                                    }
                                });


                                var topicsCreatedByUser = _.filter(createdForumItems, function (forumItem) {
                                    return forumItem.type == 'topic' && forumItem.subType == null;
                                });

                                _.each(topicsCreatedByUser, function (topic) {
                                    if (topic.questId == null || questIds.indexOf(topic.questId) != -1) {
                                        if (!topic.forum.newTopicPointsMax || (result.discussionScore.newTopicPoints + topic.forum.newTopicPoints) <= topic.forum.newTopicPointsMax) {
                                            result.programs[0].score.points.earned += topic.forum.newTopicPoints ? topic.forum.newTopicPoints : 0;
                                            result.discussionScore.newTopicPoints += topic.forum.newTopicPoints ? topic.forum.newTopicPoints : 0;
                                        }
                                    }
                                });


                                var encouragementFromUser = _.filter(createdForumItems, function (forumItem) {
                                    return forumItem.type == 'topic' && forumItem.subType == 'encouragement';
                                });
                                _.each(encouragementFromUser, function (cat) {
                                    if (!cat.forum.newEncouragePointsMax || (result.discussionScore.newEncouragePoints + cat.forum.newEncouragePoints) <= cat.forum.newEncouragePointsMax) {
                                        result.programs[0].score.points.earned += cat.forum.newEncouragePoints ? cat.forum.newEncouragePoints : 0;
                                        result.discussionScore.newEncouragePoints += cat.forum.newEncouragePoints ? cat.forum.newEncouragePoints : 0;
                                    }
                                });


                                var appreciationFromUser = _.filter(createdForumItems, function (forumItem) {
                                    return forumItem.type == 'topic' && forumItem.subType == 'appreciation';
                                });
                                _.each(appreciationFromUser, function (cat) {
                                    if (!cat.forum.newAppreciatePointsMax || (result.discussionScore.newAppreciatePoints + cat.forum.newAppreciatePoints) <= cat.forum.newAppreciatePointsMax) {
                                        result.programs[0].score.points.earned += cat.forum.newAppreciatePoints ? cat.forum.newAppreciatePoints : 0;
                                        result.discussionScore.newAppreciatePoints += cat.forum.newAppreciatePoints ? cat.forum.newAppreciatePoints : 0;
                                    }
                                });


                                var storiesFromUser = _.filter(createdForumItems, function (forumItem) {
                                    return forumItem.type == 'topic' && forumItem.subType == 'story';
                                });
                                _.each(storiesFromUser, function (cat) {
                                    if (!cat.forum.newStoryPointsMax || (result.discussionScore.newStoryPoints + cat.forum.newStoryPoints) <= cat.forum.newStoryPointsMax) {
                                        result.programs[0].score.points.earned += cat.forum.newStoryPoints ? cat.forum.newStoryPoints : 0;
                                        result.discussionScore.newStoryPoints += cat.forum.newStoryPoints ? cat.forum.newStoryPoints : 0;
                                    }
                                });


                                var commentCreatedByUser = _.filter(createdForumItems, function (forumItem) {
                                    return forumItem.type == 'comment';
                                });
                                _.each(commentCreatedByUser, function (comment) {
                                    if (comment.parent.questId == null || questIds.indexOf(comment.parent.questId) != -1) {
                                        if (!comment.forum.newCommentPointsMax || (result.discussionScore.newCommentPoints + comment.forum.newCommentPoints) <= comment.forum.newCommentPointsMax) {
                                            result.programs[0].score.points.earned += comment.forum.newCommentPoints ? comment.forum.newCommentPoints : 0;
                                            result.discussionScore.newCommentPoints += comment.forum.newCommentPoints ? comment.forum.newCommentPoints : 0;
                                        }
                                    }
                                });


                                var commentCreatedAgainstUser = _.filter(recievedForumItems, function (forumItem) {
                                    return forumItem.type == 'comment' && forumItem.createdAgainstId != user.id;
                                });

                                _.each(commentCreatedAgainstUser, function (comment) {
                                    if (comment.parent.questId == null || questIds.indexOf(comment.parent.questId) != -1) {
                                        if (!comment.forum.topicCommentPointsMax || (result.discussionScore.topicCommentPoints + comment.forum.topicCommentPoints) <= comment.forum.topicCommentPointsMax) {
                                            result.programs[0].score.points.earned += comment.forum.topicCommentPoints ? comment.forum.topicCommentPoints : 0;
                                            result.discussionScore.topicCommentPoints += comment.forum.topicCommentPoints ? comment.forum.topicCommentPoints : 0;
                                        }
                                    }
                                });

                                _.each(createdForumLikes, function (like) {
                                    if ((like.forumItem.parent && (like.forumItem.parent.questId == null || questIds.indexOf(like.forumItem.parent.questId) != -1))
                                        || (!like.forumItem.parent && (like.forumItem.questId == null || questIds.indexOf(like.forumItem.questId) != -1))) {
                                        if (!like.forumItem.forum.likePointsMax || (result.discussionScore.likePoints + like.forumItem.forum.likePoints) <= like.forumItem.forum.likePointsMax) {
                                            result.programs[0].score.points.earned += like.forumItem.forum.likePoints ? like.forumItem.forum.likePoints : 0;
                                            result.discussionScore.likePoints += like.forumItem.forum.likePoints ? like.forumItem.forum.likePoints : 0;
                                        }
                                    }
                                });

                                _.each(createdForumDislikes, function (dislike) {
                                    if ((dislike.forumItem.parent && (dislike.forumItem.parent.questId == null || questIds.indexOf(dislike.forumItem.parent.questId) != -1))
                                        || (!dislike.forumItem.parent && (dislike.forumItem.questId == null || questIds.indexOf(dislike.forumItem.questId) != -1))) {
                                        if (!dislike.forumItem.forum.likePointsMax || (result.discussionScore.likePoints + dislike.forumItem.forum.likePoints) <= dislike.forumItem.forum.likePointsMax) {
                                            result.programs[0].score.points.earned += dislike.forumItem.forum.likePoints ? dislike.forumItem.forum.likePoints : 0;
                                            result.discussionScore.likePoints += dislike.forumItem.forum.likePoints ? dislike.forumItem.forum.likePoints : 0;
                                        }
                                    }
                                });

                                _.each(recievedForumLikes, function (like) {
                                    if ((like.forumItem.parent && (like.forumItem.parent.questId == null || questIds.indexOf(like.forumItem.parent.questId) != -1))
                                        || (!like.forumItem.parent && (like.forumItem.questId == null || questIds.indexOf(like.forumItem.questId) != -1))) {
                                        if (!like.forumItem.forum.itemLikePointsMax || (result.discussionScore.itemLikePoints + like.forumItem.forum.itemLikePoints) <= like.forumItem.forum.itemLikePointsMax) {
                                            result.programs[0].score.points.earned += like.forumItem.forum.itemLikePoints ? like.forumItem.forum.itemLikePoints : 0;
                                            result.discussionScore.itemLikePoints += like.forumItem.forum.itemLikePoints ? like.forumItem.forum.itemLikePoints : 0;
                                        }
                                    }
                                });

                                _.each(recievedForumDislikes, function (dislike) {
                                    if ((dislike.forumItem.parent && (dislike.forumItem.parent.questId == null || questIds.indexOf(dislike.forumItem.parent.questId) != -1))
                                        || (!dislike.forumItem.parent && (dislike.forumItem.questId == null || questIds.indexOf(dislike.forumItem.questId) != -1))) {
                                        if (!dislike.forumItem.forum.itemLikePointsMax || (result.discussionScore.itemLikePoints + dislike.forumItem.forum.itemLikePoints) <= dislike.forumItem.forum.itemLikePointsMax) {
                                            result.programs[0].score.points.earned += dislike.forumItem.forum.itemLikePoints ? dislike.forumItem.forum.itemLikePoints : 0;
                                            result.discussionScore.itemLikePoints += dislike.forumItem.forum.itemLikePoints ? dislike.forumItem.forum.itemLikePoints : 0;
                                        }
                                    }
                                });

                                resolve(result);
                            });
                        })
                    })
                })
            } else {
                resolve(null)
            }
        })
    })
};

ProgramController.prototype._retrieveProgramEdit = function (ref, restore, user) {

    return Q.Promise(function (resolve, reject) {

        var highestProgramId;
        var allRelatedProgramIds;
        var programsWithPublished;

        var getProgram = function () {
            Q.all([
                models.Program.find({
                    where: {
                        id: highestProgramId
                    },
                    include: [
                        {
                            model: models.Client,
                            as: 'client'
                        }
                    ]
                }),
                models.Todo.findAll({
                    where: {
                        programId: highestProgramId,
                        questId: {
                            $ne: null
                        }
                    },
                    include: [
                        {
                            model: models.TodoRequirement,
                            as: 'requirements'
                        },
                        {
                            model: models.Challenge,
                            as: 'challenges',
                            include: [
                                {
                                    model: models.ChallengeQuestion,
                                    as: 'questions'
                                }
                            ]
                        }
                    ]
                }),
                models.Badge.findAll({
                    include: [
                        {
                            model: models.BadgeRequirement,
                            as: 'requirements'
                        }
                    ],
                    where: {
                        programId: highestProgramId
                    }
                }),
                models.Level.findAll({
                    where: {
                        programId: highestProgramId
                    },
                    required: false
                }),
                //Get the sequencing types for the dropdown
                models.SequencingType.findAll({ raw: true }),
                models.SystemConfiguration.findAll({
                    raw: true,
                    where: {
                        key: 'TODO-VERIFICATION-QUESTION'
                    }
                }),
                models.Quest.findAll({
                    where: {
                        programId: highestProgramId
                    },
                    order: [['sequence', 'ASC']],
                    include: [{
                        model: models.Challenge,
                        as: 'challenges',
                        include: [
                            {
                                model: models.ChallengeQuestion,
                                as: 'questions',
                                include: [
                                    {
                                        model: models.ChallengeHint,
                                        as: 'hints',
                                        required: false
                                    },
                                    {
                                        model: models.ChallengeAnswer,
                                        as: 'answers'
                                    },
                                    {
                                        model: models.ChallengeQuestionType,
                                        as: 'type'
                                    }]
                            },
                            {
                                model: models.ChallengeMedia,
                                as: 'media'
                            }]
                    }],
                    required: false
                })
            ]).spread(function (program, todos, badges, levels, sequencingTypes, todoVerificationQuestions, quests) {
                if (!program) {
                    reject('Cannot find program!');
                }
                program = JSON.stringify(program);
                program = JSON.parse(program);
                todos = JSON.stringify(todos);
                todos = JSON.parse(todos);
                badges = JSON.stringify(badges);
                badges = JSON.parse(badges);
                levels = JSON.stringify(levels);
                levels = JSON.parse(levels);
                quests = JSON.stringify(quests);
                quests = JSON.parse(quests);
                program.programQuests = quests;

                program.todos = [];

                _.each(quests, function (quest) {
                    _.each(todos, function (todo) {

                        if (todo.questId == quest.id) {

                            program.todos.push(todo);
                        }
                    });
                });

                program.badges = badges;
                program.levels = levels;

                program.todoVerificationQuestionTemplates = todoVerificationQuestions;

                models.ProgramLicense.find({
                    where: {
                        linkId: program.linkId
                    },
                    raw: true
                }).then(function (license) {

                    if (license && license.type == 'readOnly') {
                        resolve(null);
                    }

                    //In order to make sequelize load quests as a child or programs and levels a different alias must be used for each
                    //I don't want these aliases propogating through the code, so when fetching programs we go through the result and rename 'programQuests'
                    //and 'levelQuests' to 'quests'
                    program.quests = program.programQuests;

                    var newQuests = [];
                    _.each(program.quests, function (q) {
                        if (q.type == 'L') {
                            var todos = _.filter(program.todos, function (x) {
                                if (x.requirements.length > 0) {
                                    var req = _.find(x.requirements, function (y) {
                                        return y.requirementRefId == q.id && y.requirementRef == 'Quest'
                                    });
                                    if (req) {
                                        return true;
                                    }
                                }
                            });

                            newQuests.push(q);

                            if (todos.length) {
                                _.each(todos, function (todo) {
                                    var todo = _.find(program.quests, function (x) {
                                        return x.id == todo.questId
                                    });
                                    if (todo) {
                                        newQuests.push(todo);
                                    }
                                })
                            }
                        }
                        if (!q.levelId && q.type == 'T') {
                            var todo = _.find(program.todos, function (t) {
                                return t.questId == q.id
                            });
                            if (todo && todo.requirements.length == 0) {
                                newQuests.push(q);
                            }
                        }
                        if (q.type == 'I') {
                            newQuests.push(q);
                        }
                    });

                    program.quests = newQuests;

                    program.sequencingParameters = program.sequencingParameters ? JSON.parse(program.sequencingParameters) : null;

                    var formatMedia = function (quest) {
                        quest.backgroundImageUrl = services.helpers.makeMediaUrl(quest.backgroundImageRef);
                        quest.featuredImageUrl = services.helpers.makeMediaUrl(quest.featuredImageRef);
                        _.each(quest.challenges, function (challenge) {
                            _.each(challenge.media, function (media) {
                                if (media.type == 'image' || media.type == 'audio')
                                    media.url = services.helpers.makeMediaUrl(media.data);
                                else if (media.type == 'video') {
                                    if (media.source == 'system')
                                        media.url = services.helpers.makeMediaUrl(media.data);
                                    else if (media.source == 'youtube') {
                                        media.iframe = media.data
                                    }
                                }
                                else if (media.type == 'text')
                                    media.text = media.data;
                                else if (media.type == 'link')
                                    media.link = media.data;
                                else if (media.type == 'resource')
                                    media.url = services.helpers.makeResourceUrl(media.data);
                            })

                        })

                    };

                    program.imageUrl = services.helpers.makeMediaUrl(program.imageRef);
                    program.sequencingTypes = sequencingTypes;

                    var questsToAssignToLevels = [];

                    _.each(program.quests, function (quest) {
                        if (!quest.levelId) {
                            formatMedia(quest);
                        }
                    });

                    _.each(program.programQuests, function (quest) {
                        if (quest.levelId) {
                            questsToAssignToLevels.push(quest);
                        }
                    });

                    program.programQuests = undefined;

                    _.each(questsToAssignToLevels, function (quest) {
                        program.quests = _.without(program.quests, quest);
                        var level = _.findWhere(program.levels, { id: Number(quest.levelId) });
                        if (!level.quests) {
                            level.quests = [];
                        }
                        level.quests.push(quest);
                    });

                    _.each(program.levels, function (level) {
                        var levelQuests = [];
                        var todoQuests = [];
                        _.each(level.quests, function (q) {
                            if (q.type == 'L' || q.type == 'I') {
                                levelQuests.push(q);
                            } else if (q.type == 'T') {
                                var todo = _.find(program.todos, function (t) {
                                    return t.questId == q.id
                                });
                                if (todo && todo.requirements.length == 0) {
                                    levelQuests.push(q);
                                } else if (todo && todo.requirements.length > 0 && todo.requirements[0].requirementRef == 'Level') {
                                    todoQuests.push(q);
                                } else if (todo) {
                                    levelQuests.push(q);
                                }
                            }
                        });

                        level.quests = levelQuests;
                        level.quests = level.quests.concat(todoQuests);
                    });

                    _.each(program.levels, function (level) {
                        if (!level.quests) {
                            level.quests = [];
                        }
                        level.sequencingParameters = level.sequencingParameters ? JSON.parse(level.sequencingParameters) : null;
                        _.each(level.quests, function (quest) {
                            formatMedia(quest);
                        })
                    });

                    _.each(program.badges, function (badge) {
                        if (badge.imageUrl) {
                            badge.imageUrl = services.helpers.makeMediaUrl(badge.imageUrl);
                        }
                    });

                    _.each(program.todos, function (todo) {
                        if (todo.resourceUrl) {
                            todo.resourceUrl = services.helpers.makeResourceUrl(todo.resourceUrl);
                        }
                    });

                    //We will call this function once we make sure we have the related programIds below
                    var continueLoadHistories = function () {

                        models.History.findAll({
                            where: {
                                programId: {
                                    $in: allRelatedProgramIds
                                }
                            },
                            include: [{
                                model: models.User,
                                as: 'user',
                                attributes: ['id', 'firstName', 'lastName', 'email', 'title', 'email', 'avatarUrl', 'why', 'destination'],
                                paranoid: false
                            }, {
                                model: models.Program,
                                as: 'program',
                                attributes: ['status']
                            }]
                        })
                            .then(function (histories) {
                                histories = JSON.stringify(histories);
                                histories = JSON.parse(histories);
                                var highestVersion = null;
                                var highestRow = null;

                                //flattening out the history user information
                                _.each(histories, function (row, index) {
                                    row.by =
                                        {
                                            userId: row.user.id,
                                            firstName: row.user.firstName,
                                            lastName: row.user.lastName
                                        };

                                    //Go get the history program's published date if it has one
                                    var matchingProgram = _.findWhere(programsWithPublished, { id: row.programId });
                                    row.published = matchingProgram ? matchingProgram.published : null;
                                    row.status = matchingProgram ? matchingProgram.status : null;
                                    row.cancelMigrateResultsOnPublish = matchingProgram ? matchingProgram.cancelMigrateResultsOnPublish : null;


                                    if (row.published) {
                                        if (!highestVersion) { //If this is the first published row, it is version 1
                                            row.version = 1;
                                        } else {
                                            //If there are already published rows, this row's version is the version of the last one plus 1
                                            row.version = highestVersion + 1;
                                        }
                                        highestVersion = row.version;
                                        highestRow = row;
                                    } else {
                                        //If the row isn't published, and it's the first row it get's version 0 subVersion 1
                                        if (index == 0) {
                                            row.version = 0;
                                            row.subVersion = 1;
                                        } else {
                                            //If it isn't the first row, it's version is the same as the row before it
                                            row.version = histories[index - 1].version;

                                            //Subversion is the number of versions since the last published version if there is one
                                            if (highestVersion > 0) {
                                                var numberSinceLastPublish = 0;
                                                for (var i = histories.indexOf(row); i > histories.indexOf(highestRow); i--) {
                                                    if (histories[i].program.status != 'autoSaved') {
                                                        numberSinceLastPublish++;
                                                    }
                                                }
                                                row.subVersion = numberSinceLastPublish;
                                            } else {
                                                //Otherwise subVersion is the history index
                                                row.subVersion = index + 1;
                                            }
                                        }
                                    }
                                });


                                //Reverse the collection because we want the most recent record first
                                histories.reverse();

                                //Remove the published dates for all histories but the most recent one that has it, or any histores with status = preview
                                var foundFirstPublished = false;
                                _.each(histories, function (row, index) {
                                    if (row.published && row.status != 'preview') {
                                        if (!foundFirstPublished) {
                                            foundFirstPublished = true;
                                        } else {
                                            row.published = null;
                                        }
                                    }
                                });

                                //Set the prorgram history
                                program.history = histories;

                                if (!restore) {
                                    //Get the most recent history to be the current program version
                                    program.version = histories[0];
                                } else {
                                    //If doing a restore, get the current version from the restoreId
                                    program.version = _.filter(histories, function (history) {
                                        return history.programId <= restore
                                    })[0];
                                }

                                resolve(program);
                            })
                    };

                    //Checking to see if we already know the related program Ids, these would have been added if ref was a linkId, (they would be skipped if ref is a slug, or if restore has a value causing us to ignore ref)
                    //otherwise we have to use the current programs linkId to get all programIds to get history for.
                    if (!allRelatedProgramIds) {
                        models.Program.findAll({
                            where: {
                                linkId: program.linkId
                            },
                            attributes: ['id', 'status', 'published', 'cancelMigrateResultsOnPublish']
                        }).then(function (programs) {
                            allRelatedProgramIds = [];
                            programsWithPublished = [];
                            _.each(programs, function (program) {
                                allRelatedProgramIds.push(program.id);
                                programsWithPublished.push({
                                    id: program.id,
                                    published: program.published,
                                    status: program.status,
                                    cancelMigrateResultsOnPublish: program.cancelMigrateResultsOnPublish
                                });
                            });

                            continueLoadHistories()
                        });
                    } else {
                        continueLoadHistories();
                    }

                }).catch(function (err) {
                    services.helpers.handleReject(err, reject);
                });
            });
        };


        //If this is a restore, ignore the ref and use the restore param as the programId to restore
        if (restore) {
            highestProgramId = restore;
            getProgram();
        } else {
            //If the ref is not an int it must be the program slug/name, get the program by slug
            if (isNaN(ref)) {
                models.Program.findAll({
                    where: {
                        slug: ref,
                        clientId: user.clients[0].id
                    },
                    attributes: ['id'],
                    raw: true
                }).then(function (programs) {
                    //If there are programs with that name, get the highest program ID (most recent) and get that program
                    if (programs.length > 0) {
                        highestProgramId = _.max(programs, function (o) {
                            return o.id;
                        }).id;
                        getProgram();
                    } else {
                        resolve(null);
                    }
                });
            } else {
                //If the ref is a linkId then get all programs sharing its linkId, get the highest program Id (most recent),
                //and get the program with that, also go ahead and save all of the programIds that come back to use later for fetching history
                models.Program.findAll({
                    where: {
                        linkId: ref
                    },
                    attributes: ['id', 'status', 'published'],
                    raw: true
                }
                ).then(function (programs) {
                    if (programs.length > 0) {
                        allRelatedProgramIds = [];
                        programsWithPublished = [];
                        _.each(programs, function (program) {
                            allRelatedProgramIds.push(program.id);
                            programsWithPublished.push({
                                id: program.id,
                                published: program.published,
                                status: program.status
                            });
                        });

                        highestProgramId = _.max(programs, function (o) {
                            return o.id;
                        }).id;
                        getProgram();
                    } else {
                        resolve(null);
                    }
                });
            }
        }
    }
    );
};

ProgramController.prototype.retrieveProgramEdit = function (req, res) {

    controller._retrieveProgramEdit(req.params.ref, (req.query.restore ? parseInt(req.query.restore) : 0), req.user)
        .then(function (program) {
            res.sendSuccess(program);
        })
        .catch(function (err) {
            res.sendError(err);
        });
};

ProgramController.prototype._cleanupProgramVersions = function (linkId) {

    return Q.Promise(function (resolve, reject) {
        var allRelatedProgramIds;
        var programsWithPublished;
        var continueLoadHistories = function () {
            models.History.findAll({
                where: {
                    programId: {
                        $in: allRelatedProgramIds
                    }
                },
                include: [{
                    model: models.Program,
                    as: 'program',
                    attributes: ['status', 'id'],
                    include: [
                        {
                            model: models.ProgramLicense,
                            as: 'licenses',
                            attributes: ['id']
                        }
                    ]
                }]
            })
                .then(function (histories) {
                    histories = JSON.stringify(histories);
                    histories = JSON.parse(histories);
                    var highestVersion = null;
                    var highestRow = null;

                    //flattening out the history user information
                    _.each(histories, function (row, index) {
                        //Go get the history program's published date if it has one
                        var matchingProgram = _.findWhere(programsWithPublished, { id: row.programId });
                        row.published = matchingProgram ? matchingProgram.published : null;
                        row.status = matchingProgram ? matchingProgram.status : null;

                        if (row.published) {
                            if (!highestVersion) { //If this is the first published row, it is version 1
                                row.version = 1;
                            } else {
                                //If there are already published rows, this row's version is the version of the last one plus 1
                                row.version = highestVersion + 1;
                            }
                            highestVersion = row.version;
                            highestRow = row;
                        } else {
                            //If the row isn't published, and it's the first row it get's version 0 subVersion 1
                            if (index == 0) {
                                row.version = 0;
                                row.subVersion = 1;
                            } else {
                                //If it isn't the first row, it's version is the same as the row before it
                                row.version = histories[index - 1].version;

                                //Subversion is the number of versions since the last published version if there is one
                                if (highestVersion > 0) {
                                    var numberSinceLastPublish = 0;
                                    for (var i = histories.indexOf(row); i > histories.indexOf(highestRow); i--) {
                                        if (histories[i].program.status != 'autoSaved') {
                                            numberSinceLastPublish++;
                                        }
                                    }
                                    row.subVersion = numberSinceLastPublish;
                                } else {
                                    //Otherwise subVersion is the history index
                                    row.subVersion = index + 1;
                                }
                            }
                        }
                    });


                    //Reverse the collection because we want the most recent record first
                    histories.reverse();

                    //Remove the published dates for all histories but the most recent one that has it, or any histores with status = preview
                    var foundFirstPublished = false;
                    _.each(histories, function (row, index) {
                        if (row.published && row.status != 'preview') {
                            if (!foundFirstPublished) {
                                foundFirstPublished = true;
                            } else {
                                row.published = null;
                            }
                        }
                    });

                    var programsToDelete = _.filter(histories, function (h) {
                        return h.version < (highestVersion - 2) && h.program.licenses.length == 0;
                    });
                    var programIdsToDelete = [];
                    _.each(programsToDelete, function (h) {
                        programIdsToDelete.push(h.program.id);
                    });

                    models.Program.destroy({
                        where: {
                            id: {
                                $in: programIdsToDelete
                            },
                            linkId: linkId
                        }
                    }).then(function () {
                        resolve();
                    }).catch(function (err) {
                        reject();
                    })
                })
        };


        models.Program.findAll({
            where: {
                linkId: linkId
            },
            attributes: ['id', 'status', 'published']
        }).then(function (programs) {
            allRelatedProgramIds = [];
            programsWithPublished = [];
            _.each(programs, function (program) {
                allRelatedProgramIds.push(program.id);
                programsWithPublished.push({
                    id: program.id,
                    published: program.published,
                    status: program.status
                });
            });

            continueLoadHistories()
        })
    }
    );
};

ProgramController.prototype.cleanupProgramVersions = function (req, res) {

    controller._cleanupProgramVersions(req.params.linkId)
        .then(function () {
            res.sendSuccess();
        })
        .catch(function (err) {
            res.sendError(err);
        });
};

ProgramController.prototype.removeAutoSavedProgram = function (req, res) {
    models.sequelize.transaction().then(function (t) {
        controller._removeAutoSavedProgram(req.body.linkId, req.user.id, t)
            .then(function (program) {
                t.commit().then(function () {
                    res.sendSuccess(program);
                });
            })
            .catch(function (err) {
                t.rollback().then(function () {
                    res.sendError(err);
                });
            });
    });
};

ProgramController.prototype._removeAutoSavedProgram = function (linkId, userId, t) {
    return Q.Promise(function (resolve, reject) {

        var where = { status: 'autoSaved' };
        where.linkId = linkId;
        if (userId > 0) where.createdById = userId;

        models.Program.findAll({ where: where }).then(function (programs) {
            async.eachSeries(programs,
                function (program, callback) {
                    // Destroy all existing previews
                    models.Program.destroy({ where: { id: program.id }, force: true },
                        { transaction: t })
                        .then(function () {
                            models.History.destroy({
                                where: {
                                    programId: program.id,
                                }
                            }).then(function () {
                                callback(null);
                            })
                        })
                        .catch(function (err) {
                            handleReject(err, reject);
                        });
                },
                function () {
                    resolve();
                });
        });
    });
};


ProgramController.prototype._retrieveProgramUser = function (ref, user, preview) {
    return Q.Promise(function (resolve, reject) {

        var highestProgramId;
        var programLinkId;
        var forumItems;

        //Gets the program by the highest programId
        var getProgram = function () {
            Q.all([
                models.Program.find({
                    where: {
                        id: highestProgramId
                    },
                    include: [
                        {
                            model: models.Client,
                            as: 'contentProvider'
                        },
                        {
                            model: models.Client,
                            as: 'client'
                        }
                    ]
                }),
                models.Program.find({
                    where: {
                        linkid: programLinkId,
                        published: {
                            $ne: null
                        }
                    }
                }),
                models.History.findOne({
                    include: [
                        {
                            model: models.User,
                            as: 'user',
                            attributes: ['id', 'firstName', 'lastName', 'email', 'title', 'email', 'avatarUrl', 'why', 'destination'],
                            paranoid: false
                        }
                    ],
                    where: {
                        programId: highestProgramId
                    },
                    required: false
                }),
                models.Level.findAll({
                    as: 'levels',
                    required: false,
                    where: {
                        programId: highestProgramId
                    }
                }),
                models.Badge.findAll({
                    where: {
                        programId: highestProgramId
                    },
                    include: {
                        model: models.BadgeRequirement,
                        as: 'requirements'
                    }
                }),
                models.Todo.findAll({
                    where: {
                        programId: highestProgramId,
                        questId: {
                            $ne: null
                        }
                    },
                    include: [
                        {
                            model: models.TodoRequirement,
                            as: 'requirements'
                        },
                        {
                            model: models.Challenge,
                            as: 'challenges',
                            include: [
                                {
                                    model: models.ChallengeQuestion,
                                    as: 'questions'
                                },
                                {
                                    model: models.ChallengeResult,
                                    as: 'results',
                                    include: [
                                        {
                                            model: models.User,
                                            as: 'user'
                                        },
                                        {
                                            model: models.ChallengeResultItem,
                                            as: 'items'
                                        }
                                    ],
                                },
                                {
                                    model: models.UserChallengeMedia,
                                    as: 'userMedia',
                                    required: false
                                }
                            ]
                        }
                    ]
                }),
                models.Quest.findAll({
                    where: {
                        programId: highestProgramId
                    },
                    order: [
                        ['sequence', 'ASC']
                    ],
                    include: [
                        {
                            model: models.Todo,
                            as: 'todos',
                            include: [
                                {
                                    model: models.UserTodo,
                                    as: 'userTodos',
                                    include: [
                                        {
                                            model: models.UserTodoRequirementsFulfillment,
                                            as: 'requirements'
                                        },
                                        {
                                            model: models.BonusPoints,
                                            as: 'bonusPoints'
                                        },
                                        {
                                            model: models.UserChallengeMedia,
                                            as: 'userMedia'
                                        }
                                    ],
                                    where: {
                                        userId: user.id
                                    },
                                    required: false
                                },
                                {
                                    model: models.TodoRequirement,
                                    as: 'requirements',
                                    required: false
                                },
                                {
                                    model: models.Challenge,
                                    as: 'challenges',
                                    include: [
                                        {
                                            model: models.ChallengeQuestion,
                                            as: 'questions',
                                            include: [
                                                {
                                                    model: models.ChallengeAnswer,
                                                    as: 'answers'
                                                },
                                                {
                                                    model: models.ChallengeQuestionType,
                                                    as: 'type'
                                                },
                                                {
                                                    model: models.ChallengeHint,
                                                    as: 'hints'
                                                }
                                            ],
                                            required: false
                                        },
                                        {
                                            model: models.UserChallengeMedia,
                                            as: 'userMedia',
                                            required: false
                                        },
                                        {
                                            model: models.ChallengeMedia,
                                            as: 'media',
                                            required: false
                                        },
                                        {
                                            model: models.ChallengeResult,
                                            as: 'results',
                                            include: [
                                                {
                                                    model: models.User,
                                                    as: 'user'
                                                },
                                                {
                                                    model: models.ChallengeResultItem,
                                                    as: 'items'
                                                }
                                            ],
                                            required: false
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            model: models.Challenge,
                            as: 'challenges',
                            include: [
                                {
                                    model: models.ChallengeQuestion,
                                    as: 'questions',
                                    include: [
                                        {
                                            model: models.ChallengeAnswer,
                                            as: 'answers'
                                        },
                                        {
                                            model: models.ChallengeQuestionType,
                                            as: 'type'
                                        },
                                        {
                                            model: models.ChallengeHint,
                                            as: 'hints'
                                        }
                                    ]
                                },
                                {
                                    model: models.ChallengeMedia,
                                    as: 'media',
                                    required: false
                                },
                                {
                                    model: models.ChallengeResult,
                                    as: 'results',
                                    where: {
                                        userId: user.id
                                    },
                                    include: [
                                        {
                                            model: models.User,
                                            as: 'user'
                                        },
                                        {
                                            model: models.ChallengeResultItem,
                                            as: 'items'
                                        }
                                    ],
                                    required: false
                                }
                            ]
                        }
                    ]
                })
            ]).spread(function (program, allProgramRecords, history, levels, badges, todos, quests) {
                program = JSON.stringify(program);
                program = JSON.parse(program);
                firstProgramCreated = JSON.stringify(allProgramRecords);
                firstProgramCreated = JSON.parse(firstProgramCreated);
                history = JSON.stringify(history);
                history = JSON.parse(history);
                levels = JSON.stringify(levels);
                levels = JSON.parse(levels);
                badges = JSON.stringify(badges);
                badges = JSON.parse(badges);
                todos = JSON.stringify(todos);
                todos = JSON.parse(todos);
                quests = JSON.stringify(quests);
                quests = JSON.parse(quests);

                program.firstCreated = firstProgramCreated.createdAt;
                program.firstPublished = firstProgramCreated.published;
                program.badges = badges;
                program.todos = todos;
                program.programQuests = quests;
                program.history = history;
                program.levels = levels;
                forumItems = [];

                // pluck badges, badgeIds, questIds then call function to trigger them. 
                var badges = _.clone(program.badges);
                var badgeIds = _.pluck(badges, 'id');
                var questIds = _.pluck(quests, 'id');
                var todos = _.clone(program.todos);
                var todoIds = _.pluck(todos, 'id');
                //use waterffall to get all data and resolve. 

                async.waterfall([
                    //first function find program forum using program.linkId
                    function (callback) {
                        functionFindForumFromProgramLinkId(program, callback);
                    },
                    //find all forumItems for all questIds and assign to var forumItems to return
                    function (program, callback) {
                        functionFindForumItemForEveryQuest(questIds, callback);
                    },
                    //Below code sets up the userTodos and userBadges, we can return the response before these are done and let them finish in background
                    //find all userbadge for userId. If userBadge not found then go ahead create them and set them to false (not earned).
                    function (callback) {
                        functionFindUserBadgesForUser(badges, badgeIds, callback);
                    },
                    //find all todo and requirements from the todo.ids and process the, 
                    function (callback) {
                        functionFindAllTodoAndProcess(program, todos, todoIds, callback);
                    },
                    //find forumItems, media, user, bonus for forumItem.id and process
                    function (callback) {
                        if (forumItems && forumItems.length > 0) {
                            functionFindAllForumItemRelatedContentByForumItemId(callback);
                        } else {
                            callback();
                        }
                    },
                    function (callback) {
                        processProgramData(program, callback);
                    }, 
                    function (program, callback) {
                        getStatusOfLevelAndActivity(program, callback);
                    }
                ],
                    function (err, program) {
                        if (err) {
                            return reject(err);
                        }
                        // Commit changes
                        resolve(program);
                    });
            });
        };

        var functionFindForumFromProgramLinkId = function (prog, callback) {
            var program = prog;
            models.Forum.findOne({
                where: {
                    linkId: program.linkId
                }
            }).then(function (forum) {
                forum = JSON.stringify(forum);
                forum = JSON.parse(forum);
                if (forum) {
                    program.forum = forum;
                    callback(null, program);
                } else {
                    callback(null, program);
                }
            });
        };

        var functionFindForumItemForEveryQuest = function (qIds, callback) {
            models.ForumItem.findAll({
                include: [
                    {
                        model: models.Forum,
                        as: 'forum'
                    }
                ],
                where: {
                    questId: {
                        $in: qIds
                    },
                    createdById: user.id
                }
            }).then(function (lforumItems) {
                lforumItems = JSON.stringify(lforumItems);
                lforumItems = JSON.parse(lforumItems);
                if (lforumItems && lforumItems.length > 0) {
                    forumItems = lforumItems;
                    callback();
                } else {
                    callback();
                }
                //
            });
        };

        var functionFindUserBadgesForUser = function (badges, badgeIds, callback) {
            models.UserBadge.findAll({
                where: {
                    badgeId: {
                        $in: badgeIds
                    },
                    userId: user.id
                },
                raw: true
            }).then(function (userBadges) {
                if (!userBadges || userBadges.length != badgeIds.length) {
                    // Loop through the work answers
                    async.eachSeries(badgeIds,
                        function (badgeId, callback) {
                            var matchingBadge = _.find(badges, { id: badgeId });
                            if (!userBadges || !_.find(userBadges, { id: badgeId })) {
                                models.UserBadge.create({
                                    earned: false,
                                    badgeId: badgeId,
                                    userId: user.id
                                }).then(function (newUserBadge) {
                                    var badgeRequirements = matchingBadge.requirements;
                                    if (badgeRequirements.length > 0) {
                                        _.each(badgeRequirements, function (requirement) {
                                            models.UserBadgeRequirementsFulfillment.create({
                                                fulfilled: false,
                                                userBadgeId: newUserBadge.id,
                                                badgeRequirementId: requirement.id
                                            }).then(function () {
                                                callback(null);
                                            });
                                        })
                                    } else {
                                        callback();
                                    }
                                })
                            } else {
                                callback();
                            }
                        },
                        function (err) {
                            if (err) reject(err);
                            callback();
                        });
                } else {
                    callback()
                }
            });
        };

        var functionFindAllTodoAndProcess = function (program, todos, todoIds, callback) {
            models.UserTodo.findAll({
                where: {
                    todoId: {
                        $in: todoIds
                    },
                    userId: user.id
                },
                include: [
                    {
                        model: models.Todo,
                        as: 'todo',
                        include: [
                            {
                                model: models.TodoRequirement,
                                as: 'requirements',
                                include: [
                                    {
                                        model: models.UserTodoRequirementsFulfillment,
                                        as: 'userFulfillments',
                                        include: [
                                            {
                                                model: models.UserTodo,
                                                as: 'userTodo'
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }).then(function (userTodos) {
                var newTodosWithRequirementsCount = _.filter(program.todos, function (t) {
                    return t.requirements.length > 0;
                }).length;
                var currentTodosWithRequirementsFulfillmentsCount = _.filter(userTodos, function (t) {
                    return _.filter(t.todo.requirements, function (r) {
                        return _.filter(r.userFulfillments, function (uf) {
                            return uf.userTodo.userId == user.id;
                        }).length > 0
                    }).length > 0;
                }).length;
                if (!userTodos || newTodosWithRequirementsCount != currentTodosWithRequirementsFulfillmentsCount) {
                    // Loop through the work answers
                    async.eachSeries(todoIds,
                        function (todoId, callback) {
                            var matchingTodo = _.find(todos, { id: todoId });
                            var userTodo = _.find(userTodos, { todoId: todoId });
                            if (!userTodo) {
                                models.UserTodo.create({
                                    status: 'locked',
                                    todoId: todoId,
                                    userId: user.id
                                }).then(function (newUserTodo) {
                                    var todoRequirements = matchingTodo.requirements;
                                    if (todoRequirements.length > 0) {
                                        _.each(todoRequirements, function (requirement) {
                                            models.UserTodoRequirementsFulfillment.create({
                                                fulfilled: false,
                                                userTodoId: newUserTodo.id,
                                                todoRequirementId: requirement.id
                                            }).then(function () {
                                                callback(null);
                                            });
                                        })
                                    } else {
                                        callback(null)
                                    }
                                })
                            } else if (matchingTodo.requirements.length !=
                                _.filter(userTodo.todo.requirements, function (r) {
                                    return _.filter(r.userFulfillments, function (uf) {
                                        return uf.userTodo.userId == user.id;
                                    }).length > 0
                                }).length) {
                                if (matchingTodo.requirements) {
                                    _.each(matchingTodo.requirements, function (requirement) {
                                        if (requirement.requirementRef == 'Quest') {
                                            var matchingQuest = _.find(program.programQuests, function (q) {
                                                return q.id == requirement.requirementRefId;
                                            });

                                            if (matchingQuest) {
                                                var challengeCount = _.filter(matchingQuest.challenges, function (c) {
                                                    return c.type != 'finish';
                                                }).length;
                                                var completedChallengeCount = _.filter(matchingQuest.challenges, function (c) {
                                                    return c.type != 'finish' && c.results.length;
                                                }).length;

                                                if (challengeCount == completedChallengeCount) {
                                                    models.UserTodoRequirementsFulfillment.create({
                                                        fulfilled: true,
                                                        userTodoId: userTodo.id,
                                                        todoRequirementId: requirement.id
                                                    }).then(function () {
                                                        callback(null);
                                                    });
                                                    userTodo.status = 'unlocked';
                                                    userTodo.save();
                                                } else {
                                                    models.UserTodoRequirementsFulfillment.create({
                                                        fulfilled: false,
                                                        userTodoId: userTodo.id,
                                                        todoRequirementId: requirement.id
                                                    }).then(function () {
                                                        callback(null);
                                                    });
                                                }
                                            }
                                        } else if (requirement.requirementRef == 'Level') {
                                            var matchingLevel = _.find(program.levels, function (q) {
                                                return q.id == requirement.requirementRefId;
                                            });
                                            matchingLevel.quests = _.filter(program.programQuests, function (q) {
                                                return q.levelId == matchingLevel.id;
                                            });
                                            var numberOfQuests = matchingLevel.quests.length;
                                            var numberOfCompletedQuests = _.filter(matchingLevel.quests, function (q) {
                                                var challengeCount = _.filter(q.challenges, function (c) {
                                                    return c.type != 'finish';
                                                });
                                                var completedChallengeCount = _.filter(q.challenges, function (c) {
                                                    return c.type != 'finish' && c.results.length;
                                                });
                                                return challengeCount == completedChallengeCount;
                                            });
                                            if (numberOfQuests == numberOfCompletedQuests) {
                                                models.UserTodoRequirementsFulfillment.create({
                                                    fulfilled: true,
                                                    userTodoId: userTodo.id,
                                                    todoRequirementId: requirement.id
                                                }).then(function () {
                                                    callback(null);
                                                });
                                                userTodo.status = 'unlocked';
                                                userTodo.save();
                                            } else {
                                                models.UserTodoRequirementsFulfillment.create({
                                                    fulfilled: false,
                                                    userTodoId: userTodo.id,
                                                    todoRequirementId: requirement.id
                                                }).then(function () {
                                                    callback(null);
                                                });
                                            }
                                        }
                                    })
                                } else {
                                    callback(null);
                                }
                            }
                            else {
                                callback(null);
                            }
                        },
                        function (err) {
                            if (err) return reject(err);
                            callback();
                        });
                } else {
                    callback();
                }
            });
        };

        var functionFindAllForumItemRelatedContentByForumItemId = function (callback) {
            async.forEach(forumItems, function (forumItem, callback) {
                Q.all([
                    models.ForumItem.findAll({
                        where: {
                            parentId: forumItem.id
                        }
                    }),
                    models.ForumItemUser.findAll({
                        where: {
                            forumItemId: forumItem.id
                        }
                    }),
                    models.ForumItemMedia.findAll({
                        where: {
                            forumItemId: forumItem.id
                        }
                    }),
                    models.BonusPoints.findAll({
                        where: {
                            forumItemId: forumItem.id
                        }
                    })
                ]).spread(function (fItemComments, fItemUser, fItemMedia, bonusPoint) {

                    fItemComments = JSON.stringify(fItemComments);
                    fItemComments = JSON.parse(fItemComments);

                    fItemUser = JSON.stringify(fItemUser);
                    fItemUser = JSON.parse(fItemUser);

                    fItemMedia = JSON.stringify(fItemMedia);
                    fItemMedia = JSON.parse(fItemMedia);

                    if (fItemMedia && fItemMedia.length > 0) {
                        //Format the challenge media
                        _.each(fItemMedia, function (media) {
                            if (media.type == 'image' || media.type == 'audio')
                                media.url = services.helpers.makeMediaUrl(media.data);
                            else if (media.type == 'video') {
                                if (media.source == 'system')
                                    media.url = services.helpers.makeMediaUrl(media.data);
                                else if (media.source == 'youtube') {
                                    media.iframe = media.data
                                }
                            }
                            else if (media.type == 'text')
                                media.text = media.data;
                            else if (media.type == 'link')
                                media.link = media.data;
                            else if (media.type == 'resource')
                                media.url = services.helpers.makeResourceUrl(media.data);
                        });
                    }

                    bonusPoint = JSON.stringify(bonusPoint);
                    bonusPoint = JSON.parse(bonusPoint);

                    forumItem.forumItemComments = fItemComments;
                    forumItem.forumItemUsers = fItemUser;
                    forumItem.forumItemMedia = fItemMedia;
                    forumItem.forumItemBonus = bonusPoint;
                    //only call back if data can come through
                    //callback();
                    }).then(function () {
                        callback();
                    });

            }, function (err) {
                if (err) return services.helpers.handleReject(err, callback);
                callback();
            });
        };

        var processProgramData = function (program, callback) {

            //In order to make sequelize load quests as a child or programs and levels a different alias must be used for each
            //I don't want these aliases propogating through the code, so when fetching programs we go through the result and rename 'programQuests'
            //and 'levelQuests' to 'quests'

            program.quests = program.programQuests;

            var newQuests = [];
            _.each(program.quests, function (q) {
                if (q.type == 'L') {
                    var todos = _.filter(program.todos, function (x) {
                        if (x.requirements.length > 0) {
                            var req = _.find(x.requirements, function (y) {
                                return y.requirementRefId == q.id && y.requirementRef == 'Quest'
                            });
                            if (req) {
                                return true;
                            }
                        }
                    });

                    newQuests.push(q);

                    if (todos.length) {
                        _.each(todos, function (todo) {
                            var todo = _.find(program.quests, function (x) {
                                return x.id == todo.questId
                            });
                            if (todo) {
                                newQuests.push(todo);
                            }
                        })
                    }
                }
                if (!q.levelId && q.type == 'T') {
                    var todo = _.find(program.todos, function (t) {
                        return t.questId == q.id
                    });
                    if (todo && todo.requirements.length == 0) {
                        newQuests.push(q);
                    }
                }
                if (q.type == 'I') {
                    newQuests.push(q);
                }
            });

            program.quests = newQuests;


            //Setup score object to keep score state
            program.questsComplete = 0;
            program.score = {
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
                },
                bonusPointsUsed: 0
            };

            //Formats the quest images and updates the scoring based on completed challenges
            var formatQuest = function (quest) {
                quest.challengeCount = 0;
                quest.challengesComplete = 0;
                quest.usersComplete = 0;
                quest.score = {
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
                };


                quest.finishers = [];
                quest.backgroundImageUrl = services.helpers.makeMediaUrl(quest.backgroundImageRef);
                quest.featuredImageUrl = services.helpers.makeMediaUrl(quest.featuredImageRef);
                quest.complete = services.quests.isQuestComplete(quest, forumItems);


                if (quest.type == 'L') {

                    _.each(quest.challenges, function (challenge) {
                        if (challenge.results.length > 0) {
                            challenge.result = challenge.results[0];
                            challenge.complete = true;
                        }

                        if (quest.finishers.length == 0) {
                            quest.finishers = challenge.results;
                        }
                        else {
                            var intersection = [];
                            _.each(quest.finishers, function (finisher) {
                                _.each(challenge.results, function (result) {
                                    if (finisher.userId == result.userId) {
                                        intersection.push(finisher);
                                    }
                                });
                            });

                            quest.finishers = intersection;
                        }


                        challenge.results = undefined;

                        challenge.score = {
                            points: {
                                total: challenge.points,
                                earned: challenge.result ? (challenge.result.points ? challenge.result.points : 0) : 0
                            },
                            jems: {
                                total: 0,
                                earned: 0
                            },
                            badges: {
                                total: 0,
                                earned: 0
                            }
                        };

                        if (challenge.type != 'finish') {
                            quest.challengeCount++;
                        }
                        quest.score.points.total += challenge.score.points.total;
                        quest.score.points.earned += challenge.score.points.earned;
                        if (challenge.complete) {
                            quest.challengesComplete++;
                        }
                        program.score.points.total += challenge.score.points.total;
                        program.score.points.earned += challenge.score.points.earned;
                        if (quest.challengesComplete >= quest.challenges.length) {
                            program.questsComplete++;
                        }

                        //Format the challenge media
                        _.each(challenge.media, function (media) {
                            media.questId = quest.id;
                            if (media.type == 'image' || media.type == 'audio')
                                media.url = services.helpers.makeMediaUrl(media.data);
                            else if (media.type == 'video') {
                                if (media.source == 'system')
                                    media.url = services.helpers.makeMediaUrl(media.data);
                                else if (media.source == 'youtube') {
                                    media.iframe = media.data
                                }
                            }
                            else if (media.type == 'text')
                                media.text = media.data;
                            else if (media.type == 'link')
                                media.link = media.data;
                            else if (media.type == 'resource')
                                media.url = services.helpers.makeResourceUrl(media.data);
                        });
                    });//end challenges loop
                }
                else if (quest.type == 'I') {
                    if (program.forum) {
                        quest.score.points.total += quest.inspirePoints;
                        if (quest.complete) {
                            program.questsComplete++;
                            quest.score.points.earned += quest.inspirePoints;

                            //look through forum items and find records with questId same as quest.id
                            _.each(forumItems, function (forumItem) {
                                if (forumItem.questId == quest.id) {
                                    quest.forumItem = forumItem;
                                }
                            });
                        }
                    }
                }
                else if (quest.type == 'T') {
                    _.each(quest.todos, function (todo) {
                        _.each(todo.challenges, function (challenge) {
                            _.each(challenge.results, function (result) {
                                if (result.user) {
                                    result.user.avatarUrl = services.helpers.makeMediaUrl(result.user.avatarUrl);
                                }
                                
                            });
                        });
                        _.each(todo.userTodos, function (userTodo) {
                            _.each(userTodo.userMedia, function (media) {
                                if (media.type == 'image' || media.type == 'audio')
                                    media.url = services.helpers.makeMediaUrl(media.data);
                                else if (media.type == 'video') {
                                    if (media.source == 'system')
                                        media.url = services.helpers.makeMediaUrl(media.data);
                                    else if (media.source == 'youtube') {
                                        media.iframe = media.data
                                    }
                                }
                                else if (media.type == 'text')
                                    media.text = media.data;
                                else if (media.type == 'link')
                                    media.link = media.data;
                                else if (media.type == 'resource')
                                    media.url = services.helpers.makeResourceUrl(media.data);
                            })
                        });
                    });

                    if (program.forum && quest.todos && quest.todos.length > 0) {
                        quest.score.points.total += quest.todos[0].points;
                        if (quest.todos.length > 0
                            && quest.todos[0].userTodos.length > 0
                            && quest.todos[0].userTodos[0].hasBeenCompleted) {
                            program.questsComplete++;
                            quest.score.points.earned += quest.todos[0].points;

                            if (quest.todos[0].userTodos[0].bonusPoints.length > 0) {
                                quest.score.points.earned += quest.todos[0].userTodos[0].bonusPoints[0].points
                            }
                        }
                    }
                }

                var finishers = [];
                _.each(quest.finishers, function (finisher) {
                    var qf = {
                        userId: finisher.user.id,
                        avatarUrl: services.helpers.makeMediaUrl(finisher.user.avatarUrl)
                    };
                    finishers.push(qf);
                });
                quest.totalFinishers = finishers.length;
                quest.finishers = _.take(finishers, Math.min(3, finishers.length));


            };

            //--------------------------------------------------------------------------------------------------

            program.history.by = {
                userId: program.history.user.id,
                firstName: program.history.user.firstName,
                lastName: program.history.user.lastName
            };

            //Calculate the author
            var author = null;
            if (!author && program.clientId != program.contentProviderId) author = program.contentProvider ? program.contentProvider.name : null;
            if (!author) author = program.contentAuthor;
            if (!author) author = program.history.user.firstName + ' ' + program.history.user.lastName;

            //Setup the content object
            program.content = {
                provider: program.contentProvider,
                author: author,
                descriptions: program.contentDescription
            };

            //Remove the contentProvider object to avoid confusion on the front end
            program.contentProvider = undefined;

            //Move the quests into their levels and format them
            var questsToAssignToLevels = [];

            _.each(program.quests, function (quest) {
                if (!quest.levelId) {
                    formatQuest(quest);
                }
            });

            _.each(program.programQuests, function (quest) {
                if (quest.levelId) {
                    questsToAssignToLevels.push(quest);
                }
            });

            program.programQuests = undefined;

            _.each(questsToAssignToLevels, function (quest) {
                program.quests = _.without(program.quests, quest);
                var level = _.findWhere(program.levels, { id: Number(quest.levelId) });
                if (!level.quests) {
                    level.quests = [];
                }
                level.quests.push(quest);
            });

            _.each(program.levels, function (level) {
                var levelQuests = [];
                var todoQuests = [];
                _.each(level.quests, function (q) {
                    if (q.type == 'L' || q.type == 'I') {
                        levelQuests.push(q);
                    } else if (q.type == 'T') {
                        var todo = _.find(program.todos, function (t) {
                            return t.questId == q.id
                        });
                        if (todo && todo.requirements.length == 0) {
                            levelQuests.push(q);
                        } else if (todo && todo.requirements.length > 0 && todo.requirements[0].requirementRef == 'Level') {
                            todoQuests.push(q);
                        } else if (todo) {
                            levelQuests.push(q);
                        }
                    }
                });

                level.quests = levelQuests;
                level.quests = level.quests.concat(todoQuests);
            });

            _.each(program.levels, function (level) {
                if (!level.quests) {
                    level.quests = [];
                }
                level.sequencingParameters = level.sequencingParameters ? JSON.parse(level.sequencingParameters) : null;
                _.each(level.quests, function (quest) {
                    formatQuest(quest);
                })
            });


            var todos = _.clone(program.todos);
            var todoIds = _.pluck(todos, 'id');

            models.UserTodo.findAll({
                where: {
                    todoId: {
                        $in: todoIds
                    },
                    userId: user.id
                }
            }).then(function (userToDos) {
                if (typeof userToDos != undefined && null != userToDos) {
                    userToDos = JSON.stringify(userToDos);
                    userToDos = JSON.parse(userToDos);

                    _.each(userToDos, function (u) {
                        _.each(program.levels, function (l) {
                            _.each(l.quests, function (q) {
                                _.each(q.todos, function (t) {
                                    if (u.todoId == t.id) {
                                        u.todo = t;
                                        _.each(t.challenges, function (c) {
                                            var applicableResults = [];
                                            _.each(c.results, function (r) {
                                                if (r.userTodoId == u.id) {
                                                    applicableResults.push(r);
                                                }
                                            });
                                            c.results = applicableResults;
                                        });
                                    }
                                });
                            });
                        });

                        _.each(program.quests, function (q) {
                            _.each(q.todos, function (t) {
                                if (u.todoId == t.id) {
                                    u.todo = t;
                                    _.each(t.challenges, function (c) {
                                        var applicableResults = [];
                                        _.each(c.results, function (r) {
                                            if (r.userTodoId == u.id) {
                                                applicableResults.push(r);
                                            }
                                        });
                                        c.results = applicableResults;
                                    });
                                }
                            });
                        });
                    });

                    _.each(program.levels, function (l) {
                        _.each(l.quests, function (q) {
                            _.each(userToDos, function (u) {
                                if (u.todo && u.todo.questId == q.id) {
                                    if (!q.userToDos)
                                        q.userToDos = [];

                                    q.userToDos.push(u);
                                }
                            });
                        });
                    });

                    _.each(program.quests, function (q) {
                        _.each(userToDos, function (u) {
                            if (u.todo && u.todo.questId == q.id) {
                                if (!q.userToDos)
                                    q.userToDos = [];

                                q.userToDos.push(u);
                            }
                        });
                    });


                }
                callback(null, program);
            }
                ).catch(function (ex) {
                    console.log(ex);
                })


        };

        /**pass the whole program and then process the lock unlock logic with quests and level.quests
         * 
         * @param {any} program
         * @param {any} callback
         */
        var getStatusOfLevelAndActivity = function (program, callback) {

            Q.all([
                Q.Promise(function (resolve, reject) {
                    async.eachSeries(program.quests,
                        function (quest, callback) {
                            quest.isLocked = getQuestLockState(quest, program, callback);
                        },
                        function () {
                            resolve();
                        })
                }),
                Q.Promise(function (resolve, reject) {
                    async.eachSeries(program.levels,
                        function (level, callback) {
                            async.eachSeries(level.quests,
                                function (quest, callback) {
                                    quest.isLocked = getQuestLockState(quest, program, callback);
                                },
                                function () {
                                    callback(null);
                                })
                        },
                        function () {
                            resolve();
                        })
                })

            ]).then(function () {
                //result.programs.push(program);
                callback(null, program);
            })

        };

        var isLevelComplete = function (level, forumItems, isAllBonus) {
            return services.quests.isLevelComplete(level, forumItems, isAllBonus);
        };
        var isQuestComplete = function (quest, forumItems) {
            return services.quests.isQuestComplete(quest, forumItems);
        };
        var programHasLevelQuests = function (program) {
            return services.quests.programHasLevelQuests(program);
        };
        var getQuestLockState = function (quest, program, callback) {
            var now = new Date();
            var isLocked = true;

            //If the quest belongs to a level
            if (quest.levelId) {
                var level = _.findWhere(program.levels, { id: Number(quest.levelId) });
                //Switch on the program sequencing type
                switch (program.sequencingTypeId) {
                    case services.helpers.sequencingTypes.inOrder.id:
                        //If the program sequencing is InOrder, switch on the level sequecing type
                        switch (level.sequencingTypeId) {
                            case services.helpers.sequencingTypes.inOrder.id:
                                //If the program sequencng is InOrder, and the level sequencing is InOrder, get the index of the current level
                                isLocked = programStatusCheck(quest, program, level);
                                break;
                            case services.helpers.sequencingTypes.parallel.id:
                                //If the program sequence is InOrder, but the level sequence is Parallel, check the index of the current level
                                var indexOfCurrentLevel = program.levels.indexOf(level);
                                if (indexOfCurrentLevel > 0) {
                                    //If this isn't the first level, check if the previous level is complete
                                    var isPreviousLevelComplete = isLevelComplete(program.levels[indexOfCurrentLevel - 1], forumItems);
                                    if (isPreviousLevelComplete || program.levels[indexOfCurrentLevel - 1].baseOrBonus == constants.QUEST_BASE_OR_BONUS_BONUS) {
                                        //If the previous level is complete, and this level sequence is parallel, then this quest must be unlocked
                                        isLocked = false;
                                    }
                                } else {
                                    //If this is the first level, and the level sequence is parallel, then this quest must be unlocked
                                    isLocked = false;
                                }
                                break;
                            case services.helpers.sequencingTypes.interval.id:
                                //If the program sequencng is InOrder, and the level sequencing is InOrder, get the index of the current level
                                var indexOfCurrentLevel = program.levels.indexOf(level);
                                //If this quest does not belong to the first level
                                if (indexOfCurrentLevel > 0) {
                                    //Check if the previous level has been completed
                                    var isPreviousLevelComplete = isLevelComplete(program.levels[indexOfCurrentLevel - 1], forumItems);
                                    if (isPreviousLevelComplete || program.levels[indexOfCurrentLevel - 1].baseOrBonus == constants.QUEST_BASE_OR_BONUS_BONUS) {
                                        //If the previous level is complete, check if this is the first quest in the level
                                        var indexOfQuestInLevel = level.quests.indexOf(quest);
                                        if (indexOfQuestInLevel == 0 && level.sequencingParameters.intervalStartTypeId != services.helpers.sequencingTypeIntervalStartTypes.onSpecificDate.id) {
                                            //If this is the first quest in the level, and the previous level is complete, then this quest is unlocked
                                            isLocked = false;
                                        } else {
                                            if (indexOfQuestInLevel == 0 && level.sequencingParameters.intervalStartTypeId == services.helpers.sequencingTypeIntervalStartTypes.onSpecificDate.id) {
                                                if (new Date(level.sequencingParameters.startDate) <= now) {
                                                    isLocked = false;
                                                }
                                            } else {
                                                //If this isn't the first quest in the level, check if the previous quest in the level is complete
                                                if (isQuestComplete(level.quests[indexOfQuestInLevel - 1], forumItems)) {
                                                    //If the previous quest in the level is complete, and the previous level is complete, then check if it is complete based on interval
                                                    var intervalStartDate;
                                                    if (level.sequencingParameters.intervalStartTypeId == services.helpers.sequencingTypeIntervalStartTypes.onStartDate.id) {
                                                        intervalStartDate = level.quests[0].challenges[0].result.createdAt;
                                                    } else {
                                                        intervalStartDate = level.sequencingParameters.startDate;
                                                    }

                                                    var startDateOriginal = new Date(intervalStartDate);

                                                    var numberOfQuestsUnlockedByInterval = cycleDate(level.sequencingParameters.interval, level.sequencingParameters.intervalPeriod, now, startDateOriginal);

                                                    if (indexOfQuestInLevel <= numberOfQuestsUnlockedByInterval && startDateOriginal <= now) {
                                                        isLocked = false;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                } else {
                                    //If this quest does belong to the first level in the program, check the index of the quest in the level
                                    var indexOfQuestInLevel = level.quests.indexOf(quest);
                                    if (indexOfQuestInLevel == 0 && level.sequencingParameters.intervalStartTypeId != services.helpers.sequencingTypeIntervalStartTypes.onSpecificDate.id) {
                                        //If this is the first quest in the first level, then it must be unlocked
                                        isLocked = false;
                                    } else {
                                        if (indexOfQuestInLevel == 0 && level.sequencingParameters.intervalStartTypeId == services.helpers.sequencingTypeIntervalStartTypes.onSpecificDate.id) {
                                            if (new Date(level.sequencingParameters.startDate) <= now) {
                                                isLocked = false;
                                            }
                                        } else {
                                            //If this is not the first quest, check if the quest before it is complete
                                            if (isQuestComplete(level.quests[indexOfQuestInLevel - 1], forumItems) || (level.quests[indexOfQuestInLevel - 1].baseOrBonus == constants.QUEST_BASE_OR_BONUS_BONUS)) {
                                                //If the previous quest in the level is complete, and the previous level is complete, then check if it is complete based on interval
                                                var intervalStartDate;
                                                if (level.sequencingParameters.intervalStartTypeId == services.helpers.sequencingTypeIntervalStartTypes.onStartDate.id) {
                                                    intervalStartDate = level.quests[0].challenges[0].result.createdAt;
                                                } else {
                                                    intervalStartDate = level.sequencingParameters.startDate;
                                                }

                                                var startDateOriginal = new Date(intervalStartDate);
                                                var numberOfQuestsUnlockedByInterval = cycleDate(level.sequencingParameters.interval, level.sequencingParameters.intervalPeriod, now, startDateOriginal);

                                                if (indexOfQuestInLevel <= numberOfQuestsUnlockedByInterval && startDateOriginal <= now) {
                                                    isLocked = false;
                                                }
                                            }
                                        }
                                    }
                                }
                                break;
                        }
                        break;
                    case services.helpers.sequencingTypes.parallel.id:
                        //If the program sequencing is Parallel, switch on the level sequencing
                        switch (level.sequencingTypeId) {
                            case services.helpers.sequencingTypes.inOrder.id:
                                //If the program sequencing is Parallel, and the level sequencing is InOrder, get the index of the current level
                                isLocked = programStatusCheck(quest, program, level);


                                //var indexOfCurrentLevel = program.levels.indexOf(level);
                                //if (indexOfCurrentLevel > 0) {
                                //    //If this is not the first level, check the if the previous level is complete
                                //    var isPreviousLevelComplete = isLevelComplete(program.levels[indexOfCurrentLevel - 1], forumItems);
                                //    if (isPreviousLevelComplete) {
                                //        //If the previous level is complete, check if this quest is the first quest in the current level
                                //        var indexOfQuestInLevel = level.quests.indexOf(quest);
                                //        if (indexOfQuestInLevel == 0) {
                                //            //If this is the first quest in the current level, and the previous level is complete, then this quest must be unlocked
                                //            isLocked = false;
                                //        } else {
                                //            //If this is not the first quest in the current level, check if the previous quest is complete
                                //            if (isQuestComplete(level.quests[indexOfQuestInLevel - 1], forumItems) || level.quests[indexOfQuestInLevel - 1].baseOrBonus == constants.QUEST_BASE_OR_BONUS_BONUS) {
                                //                //If the previous quest is complete, then this quest must be unlocked
                                //                isLocked = false;
                                //            }
                                //        }
                                //    }
                                //} else {
                                //    //If this is the first level then check the quests index in the level
                                //    var indexOfQuestInLevel = level.quests.indexOf(quest);
                                //    if (indexOfQuestInLevel == 0) {
                                //        //If this is the first quest in the first level with sequencing InOrder then the quest must be unlocked
                                //        isLocked = false;
                                //    } else {
                                //        //If this is not the first qeuest, then check if the previous quest is complete
                                //        if (isQuestComplete(level.quests[indexOfQuestInLevel - 1], forumItems) || level.quests[indexOfQuestInLevel - 1].baseOrBonus == constants.QUEST_BASE_OR_BONUS_BONUS) {
                                //            //If the previous quest is complete, then the quest must be unlocked
                                //            isLocked = false;
                                //        }
                                //    }
                                //}
                                break;
                            case services.helpers.sequencingTypes.parallel.id:
                                //If the program sequence is Parallel and the level sequence is Parallel get the index of the current level
                                var indexOfCurrentLevel = program.levels.indexOf(level);
                                if (indexOfCurrentLevel > 0) {
                                    //If this is not the first level, then check if the previous level is complete
                                    var isPreviousLevelComplete = isLevelComplete(program.levels[indexOfCurrentLevel - 1], forumItems);
                                    if (isPreviousLevelComplete || program.levels[indexOfCurrentLevel - 1].baseOrBonus == constants.QUEST_BASE_OR_BONUS_BONUS) {
                                        //If the previous level is complete, then this quest me be unlocked
                                        isLocked = false;
                                    }
                                } else {
                                    //If this is the first level and the sequence type is parallel then the quest must be unlocked
                                    isLocked = false;
                                }
                                break;
                            case services.helpers.sequencingTypes.interval.id:
                                //If the program sequencng is InOrder, and the level sequencing is InOrder, get the index of the current level
                                var indexOfCurrentLevel = program.levels.indexOf(level);
                                //If this quest does not belong to the first level
                                if (indexOfCurrentLevel > 0) {
                                    //Check if the previous level has been completed
                                    var isPreviousLevelComplete = isLevelComplete(program.levels[indexOfCurrentLevel - 1], forumItems);
                                    if (isPreviousLevelComplete) {
                                        //If the previous level is complete, check if this is the first quest in the level
                                        var indexOfQuestInLevel = level.quests.indexOf(quest);
                                        if (indexOfQuestInLevel == 0 && level.sequencingParameters.intervalStartTypeId != services.helpers.sequencingTypeIntervalStartTypes.onSpecificDate.id) {
                                            //If this is the first quest in the level, and the previous level is complete, then this quest is unlocked
                                            isLocked = false;
                                        } else {
                                            if (indexOfQuestInLevel == 0 && level.sequencingParameters.intervalStartTypeId == services.helpers.sequencingTypeIntervalStartTypes.onSpecificDate.id) {
                                                if (new Date(level.sequencingParameters.startDate) <= now) {
                                                    isLocked = false;
                                                }
                                            } else {
                                                //If this isn't the first quest in the level, check if the previous quest in the level is complete
                                                if (isQuestComplete(level.quests[indexOfQuestInLevel - 1], forumItems)) {
                                                    //If the previous quest in the level is complete, and the previous level is complete, then check if it is complete based on interval
                                                    var intervalStartDate;
                                                    if (level.sequencingParameters.intervalStartTypeId == services.helpers.sequencingTypeIntervalStartTypes.onStartDate.id) {
                                                        intervalStartDate = level.quests[0].challenges[0].result.createdAt;
                                                    } else {
                                                        intervalStartDate = level.sequencingParameters.startDate;
                                                    }

                                                    var startDateOriginal = new Date(intervalStartDate);
                                                    var numberOfQuestsUnlockedByInterval = cycleDate(level.sequencingParameters.interval, level.sequencingParameters.intervalPeriod, now, startDateOriginal);

                                                    if (indexOfQuestInLevel <= numberOfQuestsUnlockedByInterval && startDateOriginal <= now) {
                                                        isLocked = false;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                } else {
                                    //If this quest does belong to the first level in the program, check the index of the quest in the level
                                    var indexOfQuestInLevel = level.quests.indexOf(quest);
                                    if (indexOfQuestInLevel == 0 && level.sequencingParameters.intervalStartTypeId != services.helpers.sequencingTypeIntervalStartTypes.onSpecificDate.id) {
                                        //If this is the first quest in the first level, then it must be unlocked
                                        isLocked = false;
                                    } else {
                                        if (indexOfQuestInLevel == 0 && level.sequencingParameters.intervalStartTypeId == services.helpers.sequencingTypeIntervalStartTypes.onSpecificDate.id) {
                                            if (new Date(level.sequencingParameters.startDate) <= now) {
                                                isLocked = false;
                                            }
                                        } else {
                                            //If this is not the first quest, check if the quest before it is complete
                                            if (isQuestComplete(level.quests[indexOfQuestInLevel - 1], forumItems)) {
                                                //If the previous quest in the level is complete, and the previous level is complete, then check if it is complete based on interval
                                                var intervalStartDate;
                                                if (level.sequencingParameters.intervalStartTypeId == services.helpers.sequencingTypeIntervalStartTypes.onStartDate.id) {
                                                    intervalStartDate = level.quests[0].challenges[0].result.createdAt;
                                                } else {
                                                    intervalStartDate = level.sequencingParameters.startDate;
                                                }

                                                var startDateOriginal = new Date(intervalStartDate);
                                                var numberOfQuestsUnlockedByInterval = cycleDate(level.sequencingParameters.interval, level.sequencingParameters.intervalPeriod, now, startDateOriginal);

                                                if (indexOfQuestInLevel <= numberOfQuestsUnlockedByInterval && startDateOriginal <= now) {
                                                    isLocked = false;
                                                }
                                            }
                                        }
                                    }
                                }
                                break;
                        }
                        break;
                    case services.helpers.sequencingTypes.interval.id:
                        switch (level.sequencingTypeId) {
                            case services.helpers.sequencingTypes.inOrder.id:
                                //If the program sequencng is InOrder, and the level sequencing is InOrder, get the index of the current level
                                var indexOfCurrentLevel = program.levels.indexOf(level);
                                //If this quest does not belong to the first level
                                if (indexOfCurrentLevel > 0) {

                                    var previousLevel = program.levels[indexOfCurrentLevel - 1];


                                    //Check if the previous level has been completed
                                    var isPreviousLevelComplete = isLevelComplete(previousLevel, forumItems);
                                    if (isPreviousLevelComplete) {
                                        //If the previous level is complete, check if this is the first quest in the level
                                        var indexOfQuestInLevel = level.quests.indexOf(quest);
                                        if (indexOfQuestInLevel == 0) {
                                            var intervalStartDate;
                                            if (program.sequencingParameters.intervalStartTypeId == services.helpers.sequencingTypeIntervalStartTypes.onStartDate.id) {

                                                var quest = previousLevel.quests[previousLevel.quests.length - 1];
                                                var challenge = quest.challenges[quest.challenges.length - 1];
                                                if (challenge.type == 'finish') {
                                                    challenge = quest.challenges[quest.challenges.length - 2];
                                                }
                                                intervalStartDate = challenge.result.createdAt;
                                            } else {
                                                intervalStartDate = level.sequencingParameters.startDate;
                                            }

                                            var startDateOriginal = new Date(intervalStartDate);
                                            var numberOfLevelsUnlockedByInterval = cycleDate(program.sequencingParameters.interval, program.sequencingParameters.intervalPeriod, now, startDateOriginal);

                                            if (indexOfCurrentLevel <= numberOfLevelsUnlockedByInterval && startDateOriginal <= now) {
                                                isLocked = false;
                                            }
                                        } else {
                                            //If this isn't the first quest in the level, check if the previous quest in the level is complete or is a BONUS activity
                                            var previousQuest = level.quests[indexOfQuestInLevel - 1];
                                            if (previousQuest.baseOrBonus == constants.QUEST_BASE_OR_BONUS_BONUS || isQuestComplete(previousQuest, forumItems)) {
                                                //If the previous quest in the level is complete, and the previous level is complete, then this quest is unlocked
                                                isLocked = false;
                                            }
                                        }
                                    }
                                } else {
                                    //If this quest does belong to the first level in the program, check the index of the quest in the level
                                    var indexOfQuestInLevel = level.quests.indexOf(quest);
                                    if (indexOfQuestInLevel == 0) {
                                        //If this is the first quest in the first level, then it must be unlocked
                                        isLocked = false;
                                    } else {
                                        //If this is not the first quest, check if the quest before it is complete or is a BONUS activity
                                        var previousQuest = level.quests[indexOfQuestInLevel - 1];
                                        if (previousQuest.baseOrBonus == constants.QUEST_BASE_OR_BONUS_BONUS || isQuestComplete(previousQuest, forumItems)) {
                                            //If the quest before this one is complete, and this is the first level, then this quest must be unlocked
                                            isLocked = false;
                                        }
                                    }
                                }
                                break;
                            case services.helpers.sequencingTypes.parallel.id:
                                //If the program sequence is InOrder, but the level sequence is Parallel, check the index of the current level
                                var indexOfCurrentLevel = program.levels.indexOf(level);
                                if (indexOfCurrentLevel > 0) {
                                    var previousLevel = program.levels[indexOfCurrentLevel - 1];

                                    //If this isn't the first level, check if the previous level is complete
                                    var isPreviousLevelComplete = isLevelComplete(previousLevel, forumItems);
                                    if (isPreviousLevelComplete) {
                                        var intervalStartDate;
                                        if (program.sequencingParameters.intervalStartTypeId == services.helpers.sequencingTypeIntervalStartTypes.onStartDate.id) {

                                            var quest = previousLevel.quests[previousLevel.quests.length - 1];
                                            var challenge = quest.challenges[quest.challenges.length - 1];
                                            if (challenge.type == 'finish') {
                                                challenge = quest.challenges[quest.challenges.length - 2];
                                            }
                                            intervalStartDate = challenge.result.createdAt;
                                        } else {
                                            intervalStartDate = level.sequencingParameters.startDate;
                                        }

                                        var startDateOriginal = new Date(intervalStartDate);
                                        var numberOfLevelsUnlockedByInterval = cycleDate(program.sequencingParameters.interval, program.sequencingParameters.intervalPeriod, now, startDateOriginal);

                                        if (indexOfCurrentLevel <= numberOfLevelsUnlockedByInterval && startDateOriginal <= now) {
                                            isLocked = false;
                                        }
                                    }
                                } else {
                                    //If this is the first level, and the level sequence is parallel, then this quest must be unlocked
                                    isLocked = false;
                                }
                                break;
                            case services.helpers.sequencingTypes.interval.id:
                                //If the program sequencng is InOrder, and the level sequencing is InOrder, get the index of the current level
                                var indexOfCurrentLevel = program.levels.indexOf(level);
                                //If this quest does not belong to the first level
                                if (indexOfCurrentLevel > 0) {
                                    var firstLevel = program.levels[0];

                                    //Check if the previous level has been completed
                                    var isFirstLevelComplete = isLevelComplete(firstLevel, forumItems);
                                    if (isFirstLevelComplete) {
                                        //If the previous level is complete, check if this is the first quest in the level
                                        var indexOfQuestInLevel = level.quests.indexOf(quest);
                                        if (indexOfQuestInLevel == 0) {
                                            var intervalStartDate;
                                            if (program.sequencingParameters.intervalStartTypeId == services.helpers.sequencingTypeIntervalStartTypes.onStartDate.id) {
                                                intervalStartDate = firstLevel.quests[0].challenges[0].result.createdAt;
                                            } else {
                                                intervalStartDate = level.sequencingParameters.startDate;
                                            }

                                            var startDateOriginal = new Date(intervalStartDate);
                                            var numberOfLevelsUnlockedByInterval = cycleDate(program.sequencingParameters.interval, program.sequencingParameters.intervalPeriod, now, startDateOriginal);

                                            if (indexOfCurrentLevel <= numberOfLevelsUnlockedByInterval && startDateOriginal <= now) {
                                                var indexOfQuestInLevel = level.quests.indexOf(quest);
                                                if (indexOfQuestInLevel == 0 && level.sequencingParameters.intervalStartTypeId == services.helpers.sequencingTypeIntervalStartTypes.onStartDate.id) {
                                                    isLocked = false
                                                } else {
                                                    //If the previous quest in the level is complete, and the previous level is complete, then check if it is complete based on interval
                                                    var intervalStartDate;
                                                    if (level.sequencingParameters.intervalStartTypeId == services.helpers.sequencingTypeIntervalStartTypes.onStartDate.id) {
                                                        intervalStartDate = level.quests[0].challenges[0].result.createdAt;
                                                    } else {
                                                        intervalStartDate = level.sequencingParameters.startDate;
                                                    }

                                                    var startDateOriginal = new Date(intervalStartDate);
                                                    var numberOfQuestsUnlockedByInterval = cycleDate(level.sequencingParameters.interval, level.sequencingParameters.intervalPeriod, now, startDateOriginal);

                                                    if (indexOfQuestInLevel <= numberOfQuestsUnlockedByInterval && startDateOriginal <= now) {
                                                        isLocked = false;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                //If this quest does belong to the first level
                                else {
                                    //If this quest does belong to the first level in the program, check the index of the quest in the level
                                    var indexOfQuestInLevel = level.quests.indexOf(quest);
                                    if (indexOfQuestInLevel == 0 && level.sequencingParameters.intervalStartTypeId != services.helpers.sequencingTypeIntervalStartTypes.onSpecificDate.id) {
                                        //If this is the first quest in the first level, then it must be unlocked
                                        isLocked = false;
                                    } else {
                                        if (indexOfQuestInLevel == 0) {
                                            if (level.sequencingParameters.intervalStartTypeId == services.helpers.sequencingTypeIntervalStartTypes.onSpecificDate.id) {
                                                if (new Date(level.sequencingParameters.startDate) <= now) {
                                                    isLocked = false;
                                                }
                                            } else {
                                                isLocked = false;
                                            }
                                        } else {
                                            //If this is not the first quest, check if the quest before it is complete
                                            if (isQuestComplete(level.quests[indexOfQuestInLevel - 1], forumItems)) {
                                                //If the previous quest in the level is complete, and the previous level is complete, then check if it is complete based on interval
                                                var intervalStartDate;
                                                if (level.sequencingParameters.intervalStartTypeId == services.helpers.sequencingTypeIntervalStartTypes.onStartDate.id) {
                                                    intervalStartDate = level.quests[0].challenges[0].result.createdAt;
                                                } else {
                                                    intervalStartDate = level.sequencingParameters.startDate;
                                                }

                                                var startDateOriginal = new Date(intervalStartDate);
                                                var numberOfQuestsUnlockedByInterval = cycleDate(level.sequencingParameters.interval, level.sequencingParameters.intervalPeriod, now, startDateOriginal);

                                                if (indexOfQuestInLevel <= numberOfQuestsUnlockedByInterval && startDateOriginal <= now) {
                                                    isLocked = false;
                                                }
                                            }
                                        }
                                    }
                                }
                                break;
                        }
                        break;
                }
            } else {
                //The quest does not belong to a level
                switch (program.sequencingTypeId) {
                    case services.helpers.sequencingTypes.inOrder.id:
                        //The program sequencing type is InOrder, check if the program has levels
                        if (program.levels.length > 0 && programHasLevelQuests(program)) {

                            //check to see if all activity in program.quests (no level quest) is bonus
                            var isAllActivityBonus = true;
                            _.each(program.quests, function (quest) {
                                if (quest.baseOrBonus == constants.QUEST_BASE_OR_BONUS_BASE) {
                                    isAllActivityBonus = false;
                                }
                            });

                            var isLastLevelBonus = true;
                            _.each(program.levels[program.levels.length - 1].quests, function (quest) {
                                if (quest.baseOrBonus == constants.QUEST_BASE_OR_BONUS_BASE) {
                                    isLastLevelBonus = false;
                                }
                            });

                            //if last level is all bonus then we check is level before is complete. If yes then bonus level is unlocked and any non level bonus activity is unlocked. 
                            //if no then bonus level is locked and so is non level bonus activity.
                            //if last level is all bonus, but non level has base activity, then lock and unlock based on previous level before bonus level completeion. 
                            if (isLastLevelBonus) {
                                var isLevelBeforeBonusLevelComplete = isLevelComplete(program.levels[program.levels.length - 2], forumItems);
                                if (isLevelBeforeBonusLevelComplete) {
                                    //if level bwfore bonus level is complete and All non level activiy is bonus then unlock
                                    if (isAllActivityBonus) {
                                        isLocked = false;
                                    } else {
                                        //If the last level is complete, check the index of the quest
                                        var indexOfQuestInProgram = program.quests.indexOf(quest);
                                        if (indexOfQuestInProgram > 0) {
                                            //If this is not the first quest, then it is locked unless the quest before it is complete
                                            //isLocked = !isQuestComplete(program.quests[indexOfQuestInProgram - 1], forumItems);
                                            //    //If this isn't the first quest, check if the previous quest is complete or is a BONUS activity
                                            var previousQuest = program.quests[indexOfQuestInProgram - 1];
                                            if (previousQuest.baseOrBonus == constants.QUEST_BASE_OR_BONUS_BASE) {

                                                isLocked = !isQuestComplete(program.quests[indexOfQuestInProgram - 1], forumItems);

                                            } else {
                                                //previous is bonus, so need to find the preceding base. 
                                                var indexOfPrevQuestStart = indexOfQuestInProgram - 1;
                                                var precedingBaseQuestIndex = null;

                                                while (indexOfPrevQuestStart >= 0) {
                                                    if (program.quests[indexOfPrevQuestStart].baseOrBonus == constants.QUEST_BASE_OR_BONUS_BASE) {
                                                        precedingBaseQuestIndex = indexOfPrevQuestStart;
                                                        break;
                                                    } else {
                                                        indexOfPrevQuestStart--;
                                                    }
                                                }

                                                if (precedingBaseQuestIndex != null) {
                                                    isLocked = !isQuestComplete(program.quests[precedingBaseQuestIndex], forumItems);
                                                } else {
                                                    isLocked = false;
                                                }
                                            }
                                        } else {
                                            //If this is the first quest, then it must be unlocked
                                            isLocked = false;
                                        }
                                    }
                                }

                            } else {
                                //If the program has levels, is the last level complete?
                                var lastLevelComplete = isLevelComplete(program.levels[program.levels.length - 1], forumItems, isLastLevelBonus);

                                if (lastLevelComplete) {
                                    if (isAllActivityBonus) {
                                        isLocked = false;
                                    } else {

                                        //If the last level is complete, check the index of the quest
                                        var indexOfQuestInProgram = program.quests.indexOf(quest);
                                        if (indexOfQuestInProgram > 0) {
                                            //If this is not the first quest, then it is locked unless the quest before it is complete
                                            //isLocked = !isQuestComplete(program.quests[indexOfQuestInProgram - 1], forumItems);
                                            //    //If this isn't the first quest, check if the previous quest is complete or is a BONUS activity
                                            var previousQuest = program.quests[indexOfQuestInProgram - 1];
                                            if (previousQuest.baseOrBonus == constants.QUEST_BASE_OR_BONUS_BASE) {

                                                isLocked = !isQuestComplete(program.quests[indexOfQuestInProgram - 1], forumItems);

                                            } else {
                                                //previous is bonus, so need to find the preceding base. 
                                                var indexOfPrevQuestStart = indexOfQuestInProgram - 1;
                                                var precedingBaseQuestIndex = null;

                                                while (indexOfPrevQuestStart >= 0) {
                                                    if (program.quests[indexOfPrevQuestStart].baseOrBonus == constants.QUEST_BASE_OR_BONUS_BASE) {
                                                        precedingBaseQuestIndex = indexOfPrevQuestStart;
                                                        break;
                                                    } else {
                                                        indexOfPrevQuestStart--;
                                                    }
                                                }
                                                if (precedingBaseQuestIndex != null) {
                                                    isLocked = !isQuestComplete(program.quests[precedingBaseQuestIndex], forumItems);
                                                } else {
                                                    isLocked = false;
                                                }

                                            }
                                        } else {
                                            //If this is the first quest, then it must be unlocked
                                            isLocked = false;
                                        }
                                    }
                                }
                            }
                        }
                        else {
                            var indexOfCurrentQuest = program.quests.indexOf(quest);
                            if (indexOfCurrentQuest > 0) {
                                //If this isn't the first quest, check if the previous quest is complete or is a BONUS activity
                                var previousQuest = program.quests[indexOfCurrentQuest - 1];
                                if (previousQuest.baseOrBonus == constants.QUEST_BASE_OR_BONUS_BASE) {

                                    isLocked = !isQuestComplete(program.quests[indexOfCurrentQuest - 1], forumItems);

                                } else {
                                    //previous is bonus, so need to find the preceding base. 
                                    var indexOfPrevQuestStart = indexOfCurrentQuest - 1;
                                    var precedingBaseQuestIndex = null;
                                    while (indexOfPrevQuestStart >= 0) {
                                        if (program.quests[indexOfPrevQuestStart].baseOrBonus == constants.QUEST_BASE_OR_BONUS_BASE) {
                                            precedingBaseQuestIndex = indexOfPrevQuestStart;
                                            break;
                                        } else {
                                            indexOfPrevQuestStart--;
                                        }
                                    }
                                    isLocked = !isQuestComplete(program.quests[precedingBaseQuestIndex], forumItems);
                                }

                            } else {
                                isLocked = false;
                            }

                        }
                        break;
                    case services.helpers.sequencingTypes.parallel.id:
                        //The program sequencing type is Parallel then quests in the program must be unlocked
                        isLocked = false;
                        break;
                    case services.helpers.sequencingTypes.interval.id:
                        //If the program does have levels
                        if (program.levels.length > 0 && programHasLevelQuests(program)) {
                            //If this is not the first quest

                            var lastLevelComplete = isLevelComplete(program.levels[program.levels.length - 1], forumItems);

                            if (lastLevelComplete) {
                                var indexOfCurrentQuest = program.quests.indexOf(quest);
                                //IF this is not the first quest, check if this quest has been unlocked by interval
                                if (indexOfCurrentQuest > 0) {
                                    if (isQuestComplete(program.quests[indexOfCurrentQuest - 1], forumItems)) {
                                        var intervalStartDate;
                                        if (program.sequencingParameters.intervalStartTypeId == services.helpers.sequencingTypeIntervalStartTypes.onStartDate.id) {
                                            if (program.levels.length > 0
                                                && program.levels[0].quests.length > 0
                                                && program.levels[0].quests[0].challenges.length > 0
                                                && program.levels[0].quests[0].challenges[0].result) {
                                                intervalStartDate = program.levels[0].quests[0].challenges[0].result.createdAt;
                                            } else {
                                                //This is not the first quest, the program interval is onStartDate, and the program hasn't been started yet, therefore this quest must be locked
                                                return true;
                                            }
                                        }
                                        else {
                                            intervalStartDate = program.sequencingParameters.startDate;
                                        }

                                        if (intervalStartDate) {
                                            var startDateOriginal = new Date(intervalStartDate);
                                            var numberOfQuestsUnlockedByInterval = cycleDate(program.sequencingParameters.interval, program.sequencingParameters.intervalPeriod, now, startDateOriginal);

                                            if ((indexOfCurrentQuest + program.levels.length) <= numberOfQuestsUnlockedByInterval && startDateOriginal <= now) {
                                                isLocked = false;
                                            }
                                        }
                                    }
                                } else {
                                    var intervalStartDate;
                                    if (program.sequencingParameters.intervalStartTypeId == services.helpers.sequencingTypeIntervalStartTypes.onStartDate.id) {
                                        if (program.levels.length > 0
                                            && program.levels[0].quests.length > 0
                                            && program.levels[0].quests[0].challenges.length > 0
                                            && program.levels[0].quests[0].challenges[0].result) {
                                            intervalStartDate = program.levels[0].quests[0].challenges[0].result.createdAt;
                                        } else {
                                            //This is not the first quest, the program interval is onStartDate, and the program hasn't been started yet, therefore this quest must be locked
                                            return true;
                                        }
                                    }
                                    else {
                                        intervalStartDate = program.sequencingParameters.startDate;
                                    }

                                    if (intervalStartDate) {
                                        var startDateOriginal = new Date(intervalStartDate);
                                        var numberOfQuestsUnlockedByInterval = cycleDate(program.sequencingParameters.interval, program.sequencingParameters.intervalPeriod, now, startDateOriginal);

                                        if ((indexOfCurrentQuest + program.levels.length) <= numberOfQuestsUnlockedByInterval && startDateOriginal <= now) {
                                            isLocked = false;
                                        }
                                    }
                                }
                            }
                        }
                        //If the program doesn't have levels
                        else {
                            //The program does't have levels, check if this is the first quest
                            var indexOfCurrentQuest = program.quests.indexOf(quest);

                            if (indexOfCurrentQuest > 0) {
                                if (isQuestComplete(program.quests[indexOfCurrentQuest - 1], forumItems)) {

                                    //The program doesn't have any levels, check if quest is complete based on interval
                                    var intervalStartDate;
                                    if (program.sequencingParameters.intervalStartTypeId == services.helpers.sequencingTypeIntervalStartTypes.onStartDate.id && indexOfCurrentQuest == 0) {
                                        //If the program interval is on Start Date and this is the first quest then the first quest must be unlocked
                                        isLocked = false;
                                    } else if (program.sequencingParameters.intervalStartTypeId == services.helpers.sequencingTypeIntervalStartTypes.onStartDate.id) {
                                        if (program.quests.length > 0
                                            && program.quests[0].challenges.length > 0
                                            && program.quests[0].challenges[0].result) {
                                            intervalStartDate = program.quests[0].challenges[0].result.createdAt;
                                        }
                                    }
                                    else {
                                        intervalStartDate = program.sequencingParameters.startDate;
                                    }

                                    if (intervalStartDate) {
                                        var startDateOriginal = new Date(intervalStartDate);
                                        var numberOfQuestsUnlockedByInterval = cycleDate(program.sequencingParameters.interval, program.sequencingParameters.intervalPeriod, now, startDateOriginal);


                                        if (indexOfCurrentQuest <= numberOfQuestsUnlockedByInterval && startDateOriginal <= now) {
                                            isLocked = false;
                                        }
                                    }
                                }
                            } else {
                                //The program doesn't have any levels, check if quest is complete based on interval
                                var intervalStartDate;
                                if (program.sequencingParameters.intervalStartTypeId == services.helpers.sequencingTypeIntervalStartTypes.onStartDate.id) {
                                    //If the program interval is on Start Date and this is the first quest then the first quest must be unlocked
                                    isLocked = false;
                                }
                                else {
                                    intervalStartDate = program.sequencingParameters.startDate;
                                }

                                if (intervalStartDate) {
                                    var startDateOriginal = new Date(intervalStartDate);
                                    var numberOfQuestsUnlockedByInterval = cycleDate(program.sequencingParameters.interval, program.sequencingParameters.intervalPeriod, now, startDateOriginal);

                                    if (indexOfCurrentQuest <= numberOfQuestsUnlockedByInterval && startDateOriginal <= now) {
                                        isLocked = false;
                                    }
                                }
                            }
                        }
                        break;
                }
            }

            if (isQuestComplete(quest, forumItems)) {
                badgeController._getQuestBadge(quest.id, user.id).then(function (badge) {
                    if (badge) {
                        quest.awardedBadge = badge;
                    }
                    callback(null);
                })
            } else {
                callback(null);
            }

            return isLocked;
        };

        var programStatusCheck = function (quest, program, level) {
            var isLocked = true;

            var indexOfCurrentLevel = program.levels.indexOf(level);
            //If this quest does not belong to the first level
            if (indexOfCurrentLevel > 0) {

                //check if this is the last level. IF yes then check previous level is cmoplete
                var isLastLevel = false;
                var getLastLevelIndex = program.levels.length - 1;
                if (getLastLevelIndex == indexOfCurrentLevel) {
                    isLastLevel = true;
                }

                //Check if the previous level has been completed
                var isPreviousLevelComplete = isLevelComplete(program.levels[indexOfCurrentLevel - 1], forumItems);

                if (isLastLevel) {

                    var isLastLevelBonus = true;

                    _.each(level.quests, function (quest) {
                        if (quest.baseOrBonus == constants.QUEST_BASE_OR_BONUS_BASE) {
                            isLastLevelBonus = false;
                        }
                    });

                    if (isLastLevelBonus) {
                        if (isPreviousLevelComplete) {
                            isLocked = false;// if last level is all bonus and previous level is complete, unlock all
                        }
                    } else {
                        if (isPreviousLevelComplete) {
                            //If the previous level is complete, check if this is the first quest in the level
                            var indexOfQuestInLevel = level.quests.indexOf(quest);
                            if (indexOfQuestInLevel == 0) {
                                //If this is the first quest in the level, and the previous level in complete, then this quest is unlocked
                                isLocked = false;
                            } else {
                                //If this isn't the first quest in the level, check if the previous quest in the level is complete
                                var previousQuest = level.quests[indexOfQuestInLevel - 1];
                                if (previousQuest.baseOrBonus == constants.QUEST_BASE_OR_BONUS_BASE) {
                                    isLocked = !isQuestComplete(previousQuest, forumItems);
                                } else {
                                    //previous is bonus
                                    var indexOfPrevLevelQuestStart = indexOfQuestInLevel - 1;
                                    var precedingBaseQuestIndex = null;

                                    while (indexOfPrevLevelQuestStart >= 0) {
                                        if (level.quests[indexOfPrevLevelQuestStart].baseOrBonus == constants.QUEST_BASE_OR_BONUS_BASE) {
                                            precedingBaseQuestIndex = indexOfPrevLevelQuestStart;
                                            break;
                                        } else {
                                            indexOfPrevLevelQuestStart--;
                                        }
                                    }
                                    isLocked = !isQuestComplete(level.quests[precedingBaseQuestIndex], forumItems);
                                }
                            }

                        }
                    }
                } else {
                    if (isPreviousLevelComplete) {
                        //If the previous level is complete, check if this is the first quest in the level
                        var indexOfQuestInLevel = level.quests.indexOf(quest);
                        if (indexOfQuestInLevel == 0) {
                            //If this is the first quest in the level, and the previous level in complete, then this quest is unlocked
                            isLocked = false;
                        } else {
                            //If this isn't the first quest in the level, check if the previous quest in the level is complete
                            var previousQuest = level.quests[indexOfQuestInLevel - 1];
                            if (previousQuest.baseOrBonus == constants.QUEST_BASE_OR_BONUS_BASE) {
                                isLocked = !isQuestComplete(previousQuest, forumItems);
                            } else {
                                //previous is bonus
                                var indexOfPrevLevelQuestStart = indexOfQuestInLevel - 1;
                                var precedingBaseQuestIndex = null;

                                while (indexOfPrevLevelQuestStart >= 0) {
                                    if (level.quests[indexOfPrevLevelQuestStart].baseOrBonus == constants.QUEST_BASE_OR_BONUS_BASE) {
                                        precedingBaseQuestIndex = indexOfPrevLevelQuestStart;
                                        break;
                                    } else {
                                        indexOfPrevLevelQuestStart--;
                                    }
                                }
                                isLocked = !isQuestComplete(level.quests[precedingBaseQuestIndex], forumItems);
                            }
                        }
                    }

                }
            } else {
                //If this quest does belong to the first level in the program, check the index of the quest in the level
                var indexOfQuestInLevel = level.quests.indexOf(quest);
                if (indexOfQuestInLevel == 0) {
                    //If this is the first quest in the first level, then it must be unlocked
                    isLocked = false;
                } else {
                    //If this is not the first quest, check if the quest before it is complete
                    var previousQuest = level.quests[indexOfQuestInLevel - 1];
                    if (previousQuest.baseOrBonus == constants.QUEST_BASE_OR_BONUS_BASE) {
                        isLocked = !isQuestComplete(previousQuest, forumItems);
                    } else {
                        //previous is bonus
                        var indexOfPrevLevelQuestStart = indexOfQuestInLevel - 1;
                        var precedingBaseQuestIndex = null;

                        while (indexOfPrevLevelQuestStart >= 0) {
                            if (level.quests[indexOfPrevLevelQuestStart].baseOrBonus == constants.QUEST_BASE_OR_BONUS_BASE) {
                                precedingBaseQuestIndex = indexOfPrevLevelQuestStart;
                                break;
                            } else {
                                indexOfPrevLevelQuestStart--;
                            }
                        }
                        isLocked = !isQuestComplete(level.quests[precedingBaseQuestIndex], forumItems);
                    }
                }
            }
            return isLocked;
        };
        var sql =
            'SELECT MAX(P.id) AS maxId, P.linkId FROM Programs P\n' +
            'WHERE P.deletedAt IS NULL AND P.slug=:slug AND P.clientId=:cid AND\n' +
            '((:preview=1 AND P.status = \'preview\')  OR P.status!=\'preview\') AND\n' +
            'P.published IS NOT NULL AND\n' +
            '((:preview=1 AND P.status = \'preview\') OR (SELECT COUNT(*) FROM ProgramUsers PU WHERE PU.userId=:uid AND PU.linkId = P.linkId) > 0)\n';

        //Took this query from get_program_user stored proc to get only the most recent published programs
        models.sequelize.query(sql, {
            replacements: { slug: ref, cid: user.clients[0].id, uid: user.id, preview: preview ? 1 : 0 },
            type: models.sequelize.QueryTypes.SELECT
        }).then(function (id) {
            highestProgramId = id[0].maxId;
            programLinkId = id[0].linkId;
            if (highestProgramId) {
                getProgram();
            } else {
                resolve(null)
            }
        });
    });
};

ProgramController.prototype.retrieveProgramUser = function (req, res) {

    controller._retrieveProgramUser(req.params.ref, req.user, (req.query.preview && req.query.preview == 'yes'))
        .then(function (program) {
            res.sendSuccess(program);
        })
        .catch(function (err) {
            res.sendError(err);
        });
};

ProgramController.prototype.retrieveProgramUserByProgress = function (req, res) {

    controller._retrieveProgramUser(req.params.ref, req.user, (req.query.preview && req.query.preview == 'yes'))
        .then(function (program) {
            if (services.helpers.isInRole(services.helpers.roleIds.ClientAdmin, req.user) || services.helpers.isInRole(services.helpers.roleIds.SystemAdmin, req.user)) {
                res.sendSuccess(program);
            } else {
                var removeUnfinishedChallenges = function (quest) {
                    var challengesToRemove = [];
                    _.each(quest.challenges, function (challenge) {
                        if (challenge.result) {

                        } else if (challenge.type == 'finish' && (quest.challenges.length == 1 || quest.challenges[quest.challenges.indexOf(challenge) - 1].result)) {

                        } else {
                            challengesToRemove.push(challenge);
                        }
                    });
                    _.each(challengesToRemove, function (challengeToRemove) {
                        quest.challenges = _.without(quest.challenges, challengeToRemove);
                    })
                };

                _.each(program.levels, function (level) {
                    _.each(level.quests, function (quest) {
                        removeUnfinishedChallenges(quest);
                    })
                });

                _.each(program.quests, function (quest) {
                    removeUnfinishedChallenges(quest);
                });

                res.sendSuccess(program);

            }
        })
        .catch(function (err) {
            res.sendError(err);
        });
};

ProgramController.prototype.retrieveByContentProvider = function (req, res) {

    var id = req.params.id;

    this.context.findAndCountAll({
        where: { contentProviderId: id }
    })
        .success(function (result) {
            if (result == null) return res.sendSuccess({ count: 0, data: null });
            res.sendSuccess({ count: result.count, data: result.rows });
        })
        .catch(function (err) {
            res.sendError(err);
        });
};

ProgramController.prototype._create = function (theProgram, user, t) {

    return Q.Promise(function (resolve, reject) {
        var newQuestIdsMap = {};
        //Functions for processing quest contents are outside of the waterfall because they can be used from
        //different parts of the waterfall (when creating levels and when creating the program quests)
        var processQuestion = function (challenge, question, sequence, callback) {
            // Create the challenge question
            models.ChallengeQuestion.create({
                typeId: question.type.id,
                question: question.question,
                sequence: sequence,
                challengeId: challenge.id
            }, { transaction: t })
                .then(function (newQuestion) {
                    var answerSeq = 0;
                    var answers;
                    async.waterfall([
                        function (callback) {
                            if (question.hints && question.hints.length > 0) {
                                var hints = question.hints;
                                var hintSeq = 0;
                                // Loop through the work answers
                                async.eachSeries(hints,
                                    function (hint, callback) {

                                        // Create the answer
                                        models.ChallengeHint.create({
                                            hint: hint.hint,
                                            points: hint.points,
                                            sequence: hintSeq++,
                                            questionId: newQuestion.id,
                                        }, { transaction: t })
                                            .then(function (newHint) {
                                                if (!newQuestion.hints) newQuestion.hints = [];
                                                newQuestion.hints.push(newHint);
                                                callback(null, newHint);
                                            })
                                            .catch(function (err) {
                                                services.helpers.handleReject(err, callback);
                                            });
                                    },
                                    function (err, newHint) {
                                        if (err) return services.helpers.handleReject(err, callback);
                                        callback(null, newHint);

                                    });
                            }
                            else {
                                callback(null, callback);
                            }
                        },
                        function (result, callback) {
                            if (!challenge.questions) challenge.questions = [];
                            challenge.questions.push(newQuestion);

                            // * Single Select or Multi Select
                            if (question.type.id == services.helpers.QuestionTypes.SingleSelect ||
                                question.type.id == services.helpers.QuestionTypes.MultiSelect) {

                                var obj = question.type.id == services.helpers.QuestionTypes.SingleSelect ?
                                    'singleSelect' : 'multiSelect';

                                answers = (typeof question.workAnswers !== 'undefined') ?
                                    question.workAnswers[obj].answers : question.answers;

                                // Loop through the work answers
                                async.eachSeries(answers,
                                    function (answer, callback) {

                                        // Create the answer
                                        models.ChallengeAnswer.create({
                                            answer: answer.answer,
                                            correct: answer.correct,
                                            sequence: answerSeq++,
                                            questionId: newQuestion.id
                                        }, { transaction: t })
                                            .then(function (newAnswer) {
                                                if (!newQuestion.answers) newQuestion.answers = [];
                                                newQuestion.answers.push(newAnswer);
                                                callback(null, newAnswer);
                                            })
                                            .catch(function (err) {
                                                services.helpers.handleReject(err, callback);
                                            });
                                    },
                                    function (err, newAnswer) {
                                        if (err) return services.helpers.handleReject(err, callback);
                                        callback(null, newAnswer);
                                    });

                            }
                            // Poll
                            else if (question.type.id == services.helpers.QuestionTypes.Poll) {

                                answers = (typeof question.workAnswers !== 'undefined') ?
                                    question.workAnswers.poll.answers : question.answers;

                                // Loop through the work answers
                                async.eachSeries(answers,
                                    function (answer, callback) {

                                        // Create the answer
                                        models.ChallengeAnswer.create({
                                            answer: answer.answer,
                                            correct: true,
                                            sequence: answerSeq++,
                                            questionId: newQuestion.id
                                        }, { transaction: t })
                                            .then(function (newAnswer) {
                                                if (!newQuestion.answers) newQuestion.answers = [];
                                                newQuestion.answers.push(newAnswer);
                                                callback(null, newAnswer);
                                            })
                                            .catch(function (err) {
                                                services.helpers.handleReject(err, callback);
                                            });
                                    },
                                    function (err, newAnswer) {
                                        if (err) return services.helpers.handleReject(err, callback);
                                        callback(null, newAnswer);
                                    });
                            }
                            // Poll Multi Select
                            else if (question.type.id == services.helpers.QuestionTypes.PollMultiSelect) {

                                var selectCount = -1;
                                if (typeof question.workAnswers !== 'undefined') {
                                    answers = question.workAnswers.pollMultiSelect.answers;
                                    selectCount = question.workAnswers.pollMultiSelect.selectCount ?
                                        parseInt(question.workAnswers.pollMultiSelect.selectCount) : 0;
                                }
                                else answers = question.answers;


                                // Loop through the work answers
                                async.eachSeries(answers,
                                    function (answer, callback) {

                                        var correct;
                                        if (selectCount < 0) correct = answer.correct;
                                        else {
                                            correct = selectCount > 0;
                                            selectCount--;
                                        }

                                        // Create the answer
                                        models.ChallengeAnswer.create({
                                            answer: answer.answer,
                                            correct: correct,
                                            sequence: answerSeq++,
                                            questionId: newQuestion.id
                                        }, { transaction: t })
                                            .then(function (newAnswer) {
                                                if (!newQuestion.answers) newQuestion.answers = [];
                                                newQuestion.answers.push(newAnswer);
                                                callback(null, newAnswer);
                                            })
                                            .catch(function (err) {
                                                services.helpers.handleReject(err, callback);
                                            });
                                    },
                                    function (err, newAnswer) {
                                        if (err) return services.helpers.handleReject(err, callback);
                                        callback(null, newAnswer);
                                    });
                            }
                            // Free Narrative Response
                            else if (question.type.id == services.helpers.QuestionTypes.Narrative) {
                                // DO NOTHING!
                                callback(null);
                            }
                            // Fill In The Blank
                            else if (question.type.id == services.helpers.QuestionTypes.FillBlank) {

                                answers = (typeof question.workAnswers !== 'undefined') ?
                                    question.workAnswers.fillBlank.answers : question.answers;

                                // Loop through the work answers
                                async.eachSeries(answers,
                                    function (answer, callback) {

                                        // Create the answer
                                        models.ChallengeAnswer.create({
                                            answer: answer.answer,
                                            correct: answer.correct,
                                            sequence: answerSeq++,
                                            questionId: newQuestion.id
                                        }, { transaction: t })
                                            .then(function (newAnswer) {
                                                if (!newQuestion.answers) newQuestion.answers = [];
                                                newQuestion.answers.push(newAnswer);
                                                callback(null, newAnswer);
                                            })
                                            .catch(function (err) {
                                                services.helpers.handleReject(err, callback);
                                            });
                                    },
                                    function (err, newAnswer) {
                                        if (err) return services.helpers.handleReject(err, callback);
                                        callback(null, newAnswer);
                                    });
                            }
                            // Item Matching
                            else if (question.type.id == services.helpers.QuestionTypes.Matching) {

                                if (typeof question.workAnswers !== 'undefined') {
                                    // Loop through the work answers
                                    async.eachSeries(question.workAnswers.matching.answers,
                                        function (answer, callback) {

                                            // Create the answer
                                            models.ChallengeAnswer.create({
                                                answer: answer.answer,
                                                sequence: answerSeq++,
                                                questionId: newQuestion.id
                                            }, { transaction: t })
                                                .then(function (newAnswer) {
                                                    if (!newQuestion.answers) newQuestion.answers = [];
                                                    newQuestion.answers.push(newAnswer);

                                                    // Create the matching answer
                                                    models.ChallengeAnswer.create({
                                                        answer: answer.match,
                                                        sequence: answerSeq++,
                                                        questionId: newQuestion.id
                                                    }, { transaction: t })
                                                        .then(function (newMatch) {
                                                            if (!newQuestion.answers) newQuestion.answers = [];
                                                            newQuestion.answers.push(newMatch);

                                                            callback(null, {
                                                                answer: newAnswer,
                                                                match: newMatch
                                                            });
                                                        })
                                                        .catch(function (err) {
                                                            services.helpers.handleReject(err, callback);
                                                        });
                                                })
                                                .catch(function (err) {
                                                    services.helpers.handleReject(err, callback);
                                                });
                                        },
                                        function (err, newAnswer) {
                                            if (err) return services.helpers.handleReject(err, callback);
                                            callback(null, newAnswer);
                                        });
                                }
                                else {
                                    // Loop through the existing answers
                                    async.eachSeries(question.answers,
                                        function (answer, callback) {

                                            // Create the answer
                                            models.ChallengeAnswer.create({
                                                answer: answer.answer,
                                                correct: answer.correct,
                                                sequence: answerSeq++,
                                                questionId: newQuestion.id
                                            }, { transaction: t })
                                                .then(function (newAnswer) {
                                                    if (!newQuestion.answers) newQuestion.answers = [];
                                                    newQuestion.answers.push(newAnswer);
                                                    callback(null, newAnswer);
                                                })
                                                .catch(function (err) {
                                                    services.helpers.handleReject(err, callback);
                                                });
                                        },
                                        function (err, newAnswer) {
                                            if (err) return services.helpers.handleReject(err, callback);
                                            callback(null, newAnswer);
                                        });
                                }
                            }
                            // Short Answer
                            else if (question.type.id == services.helpers.QuestionTypes.ShortAnswer) {
                                answers = (typeof question.workAnswers !== 'undefined') ?
                                    question.workAnswers.shortAnswer.answers : question.answers;

                                // Loop through the work answers
                                async.eachSeries(answers,
                                    function (answer, callback) {

                                        // Create the answer
                                        models.ChallengeAnswer.create({
                                            answer: answer.answer,
                                            sequence: answerSeq++,
                                            questionId: newQuestion.id
                                        }, { transaction: t })
                                            .then(function (newAnswer) {
                                                if (!newQuestion.answers) newQuestion.answers = [];
                                                newQuestion.answers.push(newAnswer);
                                                callback(null, newAnswer);
                                            })
                                            .catch(function (err) {
                                                services.helpers.handleReject(err, callback);
                                            });
                                    },
                                    function (err, newAnswer) {
                                        if (err) return services.helpers.handleReject(err, callback);
                                        callback(null, newAnswer);
                                    });
                            }
                            // Contrasting
                            else if (question.type.id == services.helpers.QuestionTypes.Contrasting) {


                                if (typeof question.workAnswers !== 'undefined') {
                                    // Loop through the differences
                                    async.eachSeries(question.workAnswers.contrasting.differences.answers,
                                        function (answer, callback) {

                                            // Create the answer
                                            models.ChallengeAnswer.create({
                                                answer: answer.answer,
                                                correct: false,
                                                sequence: answerSeq++,
                                                questionId: newQuestion.id
                                            }, { transaction: t })
                                                .then(function (newAnswer) {
                                                    if (!newQuestion.answers) newQuestion.answers = [];
                                                    newQuestion.answers.push(newAnswer);
                                                    callback(null);
                                                })
                                                .catch(function (err) {
                                                    services.helpers.handleReject(err, callback);
                                                });
                                        },
                                        function (err, newAnswer) {
                                            if (err) return services.helpers.handleReject(err, callback);

                                            // Loop through the similarities
                                            async.eachSeries(question.workAnswers.contrasting.similarities.answers,
                                                function (answer, callback) {

                                                    // Create the answer
                                                    models.ChallengeAnswer.create({
                                                        answer: answer.answer,
                                                        correct: true,
                                                        sequence: answerSeq++,
                                                        questionId: newQuestion.id
                                                    }, { transaction: t })
                                                        .then(function () {
                                                            if (!newQuestion.answers) newQuestion.answers = [];
                                                            newQuestion.answers.push(newAnswer);
                                                            callback(null);
                                                        })
                                                        .catch(function (err) {
                                                            services.helpers.handleReject(err, callback);
                                                        });
                                                },
                                                function (err) {
                                                    if (err) return services.helpers.handleReject(err, callback);
                                                    callback(null);
                                                });
                                        });

                                }
                                else {
                                    // Loop through the existing answers
                                    async.eachSeries(question.answers,
                                        function (answer, callback) {

                                            // Create the answer
                                            models.ChallengeAnswer.create({
                                                answer: answer.answer,
                                                correct: answer.correct,
                                                sequence: answerSeq++,
                                                questionId: newQuestion.id
                                            }, { transaction: t })
                                                .then(function (newAnswer) {
                                                    if (!newQuestion.answers) newQuestion.answers = [];
                                                    newQuestion.answers.push(newAnswer);
                                                    callback(null, newAnswer);
                                                })
                                                .catch(function (err) {
                                                    services.helpers.handleReject(err, callback);
                                                });
                                        },
                                        function (err, newAnswer) {
                                            if (err) return services.helpers.handleReject(err, callback);
                                            callback(null, newAnswer);
                                        });
                                }

                            }
                            // Sentence / Phrase Builder
                            else if (question.type.id == services.helpers.QuestionTypes.SentenceBuilder) {

                                answers = (typeof question.workAnswers !== 'undefined') ?
                                    question.workAnswers.sentenceBuilder.answers : question.answers;

                                // Loop through the work answers
                                async.eachSeries(answers,
                                    function (answer, callback) {

                                        // Create the answer
                                        models.ChallengeAnswer.create({
                                            answer: answer.answer,
                                            correct: true,
                                            sequence: answerSeq++,
                                            questionId: newQuestion.id
                                        }, { transaction: t })
                                            .then(function (newAnswer) {
                                                if (!newQuestion.answers) newQuestion.answers = [];
                                                newQuestion.answers.push(newAnswer);
                                                callback(null, newAnswer);
                                            })
                                            .catch(function (err) {
                                                services.helpers.handleReject(err, callback);
                                            });
                                    },
                                    function (err, newAnswer) {
                                        if (err) return services.helpers.handleReject(err, callback);
                                        callback(null, newAnswer);
                                    });
                            }
                            // Free Contrasting
                            else if (question.type.id == services.helpers.QuestionTypes.FreeContrasting) {
                                return services.helpers.handleReject(new Error('Question type ' + question.type.id + ' not supported.'), callback);
                            }
                            // Sequencing
                            else if (question.type.id == services.helpers.QuestionTypes.Sequencing) {

                                answers = (typeof question.workAnswers !== 'undefined') ?
                                    question.workAnswers.sequencing.answers : question.answers;

                                // Loop through the work answers
                                async.eachSeries(answers,
                                    function (answer, callback) {

                                        // Create the answer
                                        models.ChallengeAnswer.create({
                                            answer: answer.answer,
                                            correct: answer.correct,
                                            sequence: answerSeq++,
                                            questionId: newQuestion.id
                                        }, { transaction: t })
                                            .then(function (newAnswer) {
                                                if (!newQuestion.answers) newQuestion.answers = [];
                                                newQuestion.answers.push(newAnswer);
                                                callback(null, newAnswer);
                                            })
                                            .catch(function (err) {
                                                services.helpers.handleReject(err, callback);
                                            });
                                    },
                                    function (err, newAnswer) {
                                        if (err) return services.helpers.handleReject(err, callback);
                                        callback(null, newAnswer);
                                    });
                            }
                            // Grouping
                            else if (question.type.id == services.helpers.QuestionTypes.Grouping) {


                                if (typeof question.workAnswers !== 'undefined') {

                                    // Loop through the work answers
                                    async.eachSeries(question.workAnswers.grouping.answers,
                                        function (answer, callback) {

                                            // Create the answer
                                            models.ChallengeAnswer.create({
                                                answer: answer.answer,
                                                sequence: answerSeq++,
                                                questionId: newQuestion.id
                                            }, { transaction: t })
                                                .then(function (newAnswer) {

                                                    if (!newQuestion.answers) newQuestion.answers = [];
                                                    newQuestion.answers.push(newAnswer);

                                                    // Loop through the items
                                                    async.eachSeries(answer.items,
                                                        function (item, callback) {

                                                            // Create the answer
                                                            models.ChallengeAnswer.create({
                                                                answer: '@' + item.item,
                                                                sequence: answerSeq++,
                                                                questionId: newQuestion.id
                                                            }, { transaction: t })
                                                                .then(function (newAnswer) {
                                                                    if (!newQuestion.answers) newQuestion.answers = [];
                                                                    newQuestion.answers.push(newAnswer);
                                                                    callback(null);
                                                                })
                                                                .catch(function (err) {
                                                                    services.helpers.handleReject(err, callback);
                                                                });
                                                        },
                                                        function (err) {
                                                            if (err) return services.helpers.handleReject(err, callback);
                                                            callback(null);
                                                        });
                                                })
                                                .catch(function (err) {
                                                    services.helpers.handleReject(err, callback);
                                                });
                                        },
                                        function (err) {
                                            if (err) return services.helpers.handleReject(err, callback);
                                            callback(null);
                                        });
                                }
                                else {

                                    // Loop through the existing answers
                                    async.eachSeries(question.answers,
                                        function (answer, callback) {

                                            // Create the answer
                                            models.ChallengeAnswer.create({
                                                answer: answer.answer,
                                                sequence: answerSeq++,
                                                questionId: newQuestion.id
                                            }, { transaction: t })
                                                .then(function (newAnswer) {
                                                    if (!newQuestion.answers) newQuestion.answers = [];
                                                    newQuestion.answers.push(newAnswer);
                                                    callback(null, newAnswer);
                                                })
                                                .catch(function (err) {
                                                    services.helpers.handleReject(err, callback);
                                                });
                                        },
                                        function (err, newAnswer) {
                                            if (err) return services.helpers.handleReject(err, callback);
                                            callback(null, newAnswer);
                                        });
                                }
                            }
                        }
                    ],
                        function (err, newAnswer) {
                            if (err) return services.helpers.handleReject(err, callback);
                            callback(null, newAnswer);
                        })
                });
        }

        var processMedia = function (challenge, media, sequence, callback) {


            if (media.type == 'image') {
                models.ChallengeMedia.create({
                    type: media.type,
                    name: media.name,
                    ref: media.ref,
                    description: media.description,
                    data: services.helpers.makeImageRef(media.url),
                    sourceDate: media.date,
                    sequence: sequence,
                    challengeId: challenge.id
                }, { transaction: t })
                    .then(function () {
                        return callback(null);
                    })
                    .catch(function (err) {
                        services.helpers.handleReject(err, callback);
                    });
                return;
            }

            if (media.type == 'video') {

                var data = (typeof media.iframe !== 'undefined') ?
                    media.iframe : services.helpers.makeVideoRef(media.url, '.mp4');

                models.ChallengeMedia.create({
                    type: media.type,
                    status: (media.encoding ? 'encoding' : 'ready'),
                    source: media.source,
                    ref: media.ref,
                    name: media.name,
                    description: media.description,
                    coverUrl: media.coverUrl,
                    data: data,
                    sourceDate: media.date,
                    sequence: sequence,
                    challengeId: challenge.id
                }, { transaction: t })
                    .then(function () {
                        return callback(null);
                    })
                    .catch(function (err) {
                        services.helpers.handleReject(err, callback);
                    });
                return;
            }

            if (media.type == 'audio') {
                models.ChallengeMedia.create({
                    type: media.type,
                    status: (media.encoding ? 'encoding' : 'ready'),
                    ref: media.ref,
                    name: media.name,
                    description: media.description,
                    data: services.helpers.makeAudioRef(media.url, '.mp3'),
                    sourceDate: media.date,
                    sequence: sequence,
                    challengeId: challenge.id
                }, { transaction: t })
                    .then(function () {
                        return callback(null);
                    })
                    .catch(function (err) {
                        services.helpers.handleReject(err, callback);
                    });
                return;
            }

            if (media.type == 'text') {

                models.ChallengeMedia.create({
                    type: media.type,
                    data: media.text,
                    description: media.description,
                    sequence: sequence,
                    challengeId: challenge.id
                }, { transaction: t })
                    .then(function () {
                        return callback(null);
                    })
                    .catch(function (err) {
                        services.helpers.handleReject(err, callback);
                    });
                return;
            }

            if (media.type == 'link') {
                models.ChallengeMedia.create({
                    type: media.type,
                    data: media.link,
                    description: media.description,
                    sequence: sequence,
                    challengeId: challenge.id
                }, { transaction: t })
                    .then(function () {
                        return callback(null);
                    })
                    .catch(function (err) {
                        services.helpers.handleReject(err, callback);
                    });
                return;
            }

            if (media.type == 'resource') {
                models.ChallengeMedia.create({
                    type: media.type,
                    ref: media.ref,
                    name: media.name,
                    description: media.description,
                    data: services.helpers.makeResourceRef(media.url),
                    sourceDate: media.date,
                    sequence: sequence,
                    challengeId: challenge.id
                }, { transaction: t })
                    .then(function () {
                        return callback(null);
                    })
                    .catch(function (err) {
                        services.helpers.handleReject(err, callback);
                    });
                return;
            }

            callback(new Error('Invalid media type: ' + media.type));
        };

        var processChallenge = function (quest, challenge, sequence, callback) {

            // Create the challenge
            models.Challenge.create({
                type: challenge.type,
                title: challenge.title,
                instructions: challenge.instructions,
                finishText: challenge.finishText,
                finishUploadText: challenge.finishUploadText,
                finishDownloadText: challenge.finishDownloadText,
                finishLinkText: challenge.finishLinkText,
                notes: challenge.notes,
                sequence: sequence,
                canUploadContent: (challenge.type == 'finish' && challenge.canUploadContent),
                points: challenge.points,
                questId: quest.id,
                slug: challenge.slug ? challenge.slug : uuid.v1(),
                //theProgram.wasPublished below is set by the UI to say that a published version is being saved, we need to make sure to set publishedAt in this case for all existing entities (with id's) in the old program
                publishedAt: getPublishedAt(theProgram, challenge),
            }, { transaction: t })
                .then(function (newChallenge) {

                    async.waterfall([
                        // Save challenge questions
                        function (callback) {
                            var questionSeq = 0;

                            // Loop through the questions
                            async.eachSeries(challenge.questions,
                                function (question, callback) {
                                    processQuestion(newChallenge, question, questionSeq++, callback);
                                },
                                function (err) {
                                    if (err) return services.helpers.handleReject(err, callback);
                                    callback(null);
                                });
                        },
                        // Save challenge media
                        function (callback) {
                            var mediaSeq = 0;

                            // Loop through the media
                            async.eachSeries(challenge.media,
                                function (media, callback) {
                                    processMedia(newChallenge, media, mediaSeq++, callback);
                                },
                                function (err) {
                                    if (err) return services.helpers.handleReject(err, callback);
                                    callback(null);
                                });
                        }

                    ], function (err) {
                        if (!quest.challenges) {
                            quest.challenges = [];
                        }
                        quest.challenges.push(newChallenge);
                        if (err) return services.helpers.handleReject(err, callback);
                        callback(null, newChallenge);
                    });

                })
                .catch(function (err) {
                    services.helpers.handleReject(err, callback);
                });
        };

        var getNewIdByRef = function (ref, refId) {
            if (ref == 'Quest') {
                var quest = _.findWhere(theProgram.quests, { id: refId });
                if (!quest) {
                    _.find(theProgram.levels, function (level) {
                        quest = _.findWhere(level.quests, { id: refId });
                        if (quest) return true;
                    })
                }

                return quest ? quest.newQuestId : undefined;

            } else if (ref == 'Level') {
                var level = _.findWhere(theProgram.levels, { id: refId });
                return level ? level.newLevelId : undefined;
            }
        };

        var getPublishedAt = function (program, entity) {
            if (program.published && program.status != 'preview') {
                return program.published;
            } else if (entity.wasPublished && entity.id) {
                //wasPublished is set bythe ui if the previous version had published
                //set and the new version does not, if the entity already has an id then this is the
                //first time it must have been published in the previous version so set publishedAt
                return entity.publishedAt || new Date();
            } else {
                return entity.publishedAt;
            }
        };

        async.waterfall([
            // Cleanup previews as needed
            function (callback) {
                // Destroy all existing previews
                services.helpers.releaseProgramPreviews(theProgram.linkId, null, null)
                    .then(function () {
                        callback(null);
                    })
                    .catch(function (err) {
                        services.helpers.handleReject(err, callback);
                    });
            },
            //Cleanup auto saved program as needed
            function (callback) {
                if (theProgram.linkId && theProgram.status != 'preview') {
                    //Removes any auto saved programs
                    controller._removeAutoSavedProgram(theProgram.linkId, user.id, null)
                        .then(function () {
                            callback(null);
                        })
                        .catch(function (err) {
                            services.helpers.handleReject(err, callback);
                        });
                } else {
                    callback(null);
                }
            },
            // Create the program
            function (callback) {
                models.Program.create({
                    status: theProgram.status,
                    linkId: theProgram.linkId,
                    slug: theProgram.slug,
                    sequencingTypeId: theProgram.sequencingTypeId,
                    sequencingParameters: theProgram.sequencingParameters ? JSON.stringify(theProgram.sequencingParameters) : null,
                    title: theProgram.title,
                    description: theProgram.description,
                    imageRef: services.helpers.makeImageRef(theProgram.imageUrl),
                    published: theProgram.published,
                    contentAuthor: theProgram.contentAuthor,
                    contentDescription: theProgram.contentDescription,
                    contentProviderId: theProgram.contentProviderId,
                    clientId: theProgram.client.id,
                    createdById: user.id,
                    userBonusPointsBucket: theProgram.userBonusPointsBucket,
                    cancelMigrateResultsOnPublish: theProgram.published && theProgram.status != 'preview' ? false : theProgram.cancelMigrateResultsOnPublish
                }, { transaction: t })
                    .then(function (program) {
                        callback(null, program);
                    })
                    .catch(function (err) {
                        services.helpers.handleReject(err, callback);
                    });
            },
            // Update the link id if needed
            function (program, callback) {
                // Is link id set?
                if (program.linkId > 0) {
                    logger.info('Program updated [%d:%d] %s', program.linkId, program.id, program.title);
                    return callback(null, program);
                }

                // Save the link id
                program.linkId = program.id;
                program.save({ transaction: t })
                    .then(function (program) {
                        logger.info('Program created [%d:%d] %s', program.linkId, program.id, program.title);
                        callback(null, program);
                    })
                    .catch(function (err) {
                        services.helpers.handleReject(err, callback);
                    });
            },

            //Create the levels
            function (program, callback) {
                var processLevelQuest = function (quest, level, sequence, callback) {
                    // Create the quest
                    models.Quest.create({
                        title: quest.title,
                        objective: quest.objective,
                        backgroundImageRef: services.helpers.makeImageRef(quest.backgroundImageUrl),
                        featuredImageRef: services.helpers.makeImageRef(quest.featuredImageUrl),
                        inspireAvailableToUser: quest.inspireAvailableToUser,
                        storyAvailableToUser: quest.storyAvailableToUser,
                        encourageAvailableToUser: quest.encourageAvailableToUser,
                        userAllowedMediaUpload: quest.userAllowedMediaUpload,
                        sequence: sequence,
                        type: quest.type,
                        baseOrBonus: quest.baseOrBonus,
                        inspirePoints: quest.inspirePoints,
                        programId: program.id,
                        levelId: level.id,
                        //theProgram.wasPublished below is set by the UI to say that a published version is being saved, we need to make sure to set publishedAt in this case for all existing entities (with id's) in the old program
                        publishedAt: getPublishedAt(theProgram, quest),
                        slug: quest.slug ? quest.slug : uuid.v1()
                    }, { transaction: t })
                        .then(function (newQuest) {
                            if (!program.quests) {
                                program.quests = [];
                            }
                            program.quests.push(newQuest);

                            quest.newQuestId = newQuest.id;
                            if (!quest.id)
                                newQuest.isNew = true;
                            else {
                                newQuest.isNew = false;
                                newQuestIdsMap[quest.id] = newQuest.id;
                            }
                            var challengeSeq = 0;
                            // Loop through the challenges
                            async.eachSeries(quest.challenges,
                                function (challenge, callback) {
                                    processChallenge(newQuest, challenge, challengeSeq++, callback);
                                    // callback();
                                },
                                function (err) {
                                    if (err) return services.helpers.handleReject(err, callback);
                                    callback(null, newQuest);
                                });

                        })
                        .catch(function (err) {
                            services.helpers.handleReject(err, callback);
                        });
                };

                var processLevel = function (level, callback) {
                    // Create the level
                    models.Level.create({
                        title: level.title,
                        sequencingTypeId: level.sequencingTypeId,
                        sequencingParameters: level.sequencingParameters ? JSON.stringify(level.sequencingParameters) : null,
                        sequence: level.sequence,
                        programId: program.id,
                        slug: level.slug ? level.slug : uuid.v1()
                    }, { transaction: t })
                        .then(function (newLevel) {
                            level.newLevelId = newLevel.id;
                            // Loop through the quests
                            async.eachSeries(level.quests,
                                function (quest, callback) {
                                    processLevelQuest(quest, newLevel, level.quests.indexOf(quest), callback);
                                },
                                function (err) {
                                    if (err) return services.helpers.handleReject(err, callback);
                                    callback(null);
                                });
                        })
                        .catch(function (err) {
                            services.helpers.handleReject(err, callback);
                        });
                };

                // Loop through the levels
                async.eachSeries(theProgram.levels,
                    function (level, callback) {
                        processLevel(level, callback);
                    },
                    function (err) {
                        if (err) return services.helpers.handleReject(err, callback);
                        callback(null, program);
                    });
            },
            // Create the quests
            function (program, callback) {
                var processQuest = function (quest, sequence, callback) {
                    // Create the quest
                    models.Quest.create({
                        title: quest.title,
                        objective: quest.objective,
                        backgroundImageRef: services.helpers.makeImageRef(quest.backgroundImageUrl),
                        featuredImageRef: services.helpers.makeImageRef(quest.featuredImageUrl),
                        sequence: sequence,
                        type: quest.type,
                        baseOrBonus: quest.baseOrBonus,
                        programId: program.id,
                        levelId: null,
                        inspireAvailableToUser: quest.inspireAvailableToUser,
                        storyAvailableToUser: quest.storyAvailableToUser,
                        encourageAvailableToUser: quest.encourageAvailableToUser,

                        inspirePoints: quest.inspirePoints,
                        userAllowedMediaUpload: quest.userAllowedMediaUpload,
                        //theProgram.wasPublished below is set by the UI to say that a published version is being saved, we need to make sure to set publishedAt in this case for all existing entities (with id's) in the old program
                        publishedAt: getPublishedAt(theProgram, quest),
                        slug: quest.slug ? quest.slug : uuid.v1()
                    }, { transaction: t })
                        .then(function (newQuest) {
                            if (!quest.id)
                                newQuest.isNew = true;
                            else {
                                newQuest.isNew = false;
                                newQuestIdsMap[quest.id] = newQuest.id;
                            }
                            quest.newQuestId = newQuest.id;
                            var challengeSeq = 0;
                            async.waterfall([
                                function (callback) {
                                    // Loop through the challenges
                                    async.eachSeries(quest.challenges,
                                        function (challenge, callback) {
                                            processChallenge(newQuest, challenge, challengeSeq++, callback);
                                        },
                                        function (err) {
                                            if (!program.quests) {
                                                program.quests = [];
                                            }
                                            program.quests.push(newQuest);
                                            if (err) return services.helpers.handleReject(err, callback);
                                            callback();
                                        });
                                },
                                function (callback) {
                                    if (newQuest.type == 'T' && newQuest.isNew) {
                                        models.Todo.count({ where: { questId: newQuest.id } })
                                            .then(function (count) {
                                                //If to-do was copied from clipboard then create the server generated to-do
                                                //from the quest.todos collections where it should be sitting temporarily
                                                if (quest.todo != null) {
                                                    var copyFromTodo = quest.todo;

                                                    models.Todo.create({
                                                        title: copyFromTodo.title,
                                                        objective: copyFromTodo.objective,
                                                        instructions: copyFromTodo.instructions,
                                                        verificationInstructions: copyFromTodo.verificationInstructions,
                                                        questId: newQuest.id,
                                                        programId: newQuest.programId,
                                                        dueByUser: copyFromTodo.dueByUser,
                                                        validate: copyFromTodo.validate,
                                                        resourceName: copyFromTodo.resourceName,
                                                        resourceUrl: copyFromTodo.resourceUrl,
                                                        resourceDescription: copyFromTodo.resourceDescription,
                                                        points: copyFromTodo.points
                                                    }, { transaction: t })
                                                        .then(function (newTodo) {
                                                            // Loop through the challenges
                                                            async.eachSeries(copyFromTodo.challenges,
                                                                function (challenge, callback) {
                                                                    models.Challenge.create({
                                                                        type: challenge.type,
                                                                        title: challenge.title,
                                                                        instructions: challenge.instructions,
                                                                        finishText: challenge.finishText,
                                                                        notes: challenge.notes,
                                                                        canUploadContent: challenge.canUploadContent,
                                                                        sequence: challenge.sequence,
                                                                        points: challenge.points,
                                                                        todoId: newTodo.id
                                                                    }, { transaction: t }).then(function (newChallenge) {
                                                                        if (challenge.questions && challenge.questions.length > 0) {
                                                                            models.ChallengeQuestion.create({
                                                                                question: challenge.questions[0].question,
                                                                                challengeId: newChallenge.id,
                                                                                typeId: services.helpers.QuestionTypes.Narrative
                                                                            }, { transaction: t })
                                                                                .then(function (newChallengeQuestion) {
                                                                                    callback();
                                                                                })
                                                                                .catch(function (err) {
                                                                                    return services.helpers.handleReject(err, callback);
                                                                                })
                                                                        } else {
                                                                            callback();
                                                                        }
                                                                    });
                                                                },
                                                                function (err) {
                                                                    if (err) return services.helpers.handleReject(err, callback);
                                                                    callback(null, program);
                                                                });
                                                        })
                                                        .catch(function (err) {
                                                            services.helpers.handleReject(err, callback);
                                                        });
                                                }
                                                else {
                                                    models.Todo.create({
                                                        title: newQuest.title,
                                                        objective: newQuest.instructions,
                                                        questId: newQuest.id,
                                                        programId: newQuest.programId,
                                                        dueByUser: true,
                                                        validate: true
                                                    }, { transaction: t })
                                                        .then(function (newTodo) {
                                                            models.Challenge.create({
                                                                type: 'general',
                                                                title: 'Todo Feedback',
                                                                instructions: null,
                                                                finishText: null,
                                                                notes: null,
                                                                canUploadContent: true,
                                                                sequence: null,
                                                                points: null,
                                                                todoId: newTodo.id
                                                            }, { transaction: t }).then(function () {
                                                                callback();
                                                            });
                                                        })
                                                        .catch(function (err) {
                                                            services.helpers.handleReject(err, callback);
                                                        });
                                                }

                                            });

                                    }
                                    else {
                                        callback();
                                    }
                                }
                            ],
                                function (err) {
                                    if (err) return services.helpers.handleReject(err, callback);
                                    callback();
                                });

                        })
                        .catch(function (err) {
                            services.helpers.handleReject(err, callback);
                        });
                };

                // Loop through the quests
                async.eachSeries(theProgram.quests,
                    function (quest, callback) {
                        processQuest(quest, theProgram.quests.indexOf(quest), callback);
                    },
                    function (err) {
                        if (err) return services.helpers.handleReject(err, callback);
                        callback(null, program);
                    });
            },
            //Create the badges  
            function (program, callback) {
                var processBadgeRequirement = function (badge, requirement, callback) {
                    var reqRefId = getNewIdByRef(requirement.requirementRef, requirement.requirementRefId);
                    if (reqRefId) {
                        models.BadgeRequirement.create({
                            badgeId: badge.id,
                            requirementRef: requirement.requirementRef,
                            requirementRefId: reqRefId
                        }, { transaction: t })
                            .then(function (newRequirement) {
                                if (!badge.requirements) {
                                    badge.requirements = [];
                                }
                                badge.requirements.push(newRequirement);
                                callback(null, program);
                            })
                            .catch(function (err) {
                                services.helpers.handleReject(err, callback);
                            });
                    } else {
                        callback(null, program);
                    }
                };


                var processBadge = function (badge, callback) {
                    models.Badge.create({
                        title: badge.title,
                        description: badge.description,
                        imageUrl: services.helpers.makeImageRef(badge.imageUrl),
                        programId: program.id,
                        //theProgram.wasPublished below is set by the UI to say that a published version is being saved, we need to make sure to set publishedAt in this case for all existing entities (with id's) in the old program
                        publishedAt: getPublishedAt(theProgram, badge),
                        slug: badge.slug ? badge.slug : uuid.v1()
                    }, { transaction: t })
                        .then(function (newBadge) {
                            if (!program.badges) {
                                program.badges = [];
                            }
                            // Loop through the quests
                            async.eachSeries(badge.requirements,
                                function (requirement, callback) {
                                    processBadgeRequirement(newBadge, requirement, callback);
                                },
                                function (err) {
                                    if (err) return services.helpers.handleReject(err, callback);
                                    program.badges.push(newBadge);
                                    callback(null, program);
                                });
                        })
                        .catch(function (err) {
                            services.helpers.handleReject(err, callback);
                        });
                };

                // Loop through the quests
                async.eachSeries(theProgram.badges,
                    function (badge, callback) {
                        processBadge(badge, callback);
                    },
                    function (err) {
                        if (err) return services.helpers.handleReject(err, callback);
                        callback(null, program);
                    });
            },
            //Create the todos
            function (program, callback) {
                var processTodoRequirement = function (todo, requirement, callback) {
                    reqRefId = getNewIdByRef(requirement.requirementRef, requirement.requirementRefId);
                    if (reqRefId) {
                        models.TodoRequirement.create({
                            todoId: todo.id,
                            requirementRef: requirement.requirementRef,
                            requirementRefId: reqRefId
                        }, { transaction: t })
                            .then(function (newRequirement) {
                                if (!todo.requirements) {
                                    todo.requirements = [];
                                }
                                todo.requirements.push(newRequirement);
                                callback(null, program);
                            })
                            .catch(function (err) {
                                services.helpers.handleReject(err, callback);
                            });
                    } else {
                        callback(null, program);
                    }
                };
                var processTodoChallenge = function (todo, challenge, sequence, callback) {
                    models.Challenge.create({
                        type: 'general',
                        title: challenge.title,
                        sequence: sequence,
                        todoId: todo.id,
                        slug: challenge.slug ? challenge.slug : uuid.v1()
                    }, { transaction: t })
                        .then(function (newChallenge) {
                            if (!todo.challenges) {
                                todo.challenges = [];
                            }
                            todo.challenges.push(newChallenge);

                            if (challenge.questions && challenge.questions.length > 0) {
                                models.ChallengeQuestion.create({
                                    question: challenge.questions[0].question,
                                    challengeId: newChallenge.id,
                                    typeId: services.helpers.QuestionTypes.Narrative
                                }, { transaction: t })
                                    .then(function (newChallengeQuestion) {
                                        if (!newChallenge.questions) {
                                            newChallenge.questions = [];
                                        }

                                        newChallenge.questions.push(newChallengeQuestion);
                                        callback();
                                    })
                                    .catch(function (err) {
                                        services.helpers.handleReject(err, callback);
                                    });
                            } else {
                                callback();
                            }
                        })
                        .catch(function (err) {
                            services.helpers.handleReject(err, callback);
                        });
                };


                var processTodo = function (todo, callback) {

                    var qId = newQuestIdsMap[todo.questId];
                    if (!qId)
                        qId = todo.questId;

                    models.Todo.create({
                        title: todo.title,
                        instructions: todo.instructions,
                        points: todo.points && todo.points.toString().trim().length > 0 ? todo.points : null,
                        validate: todo.validate,
                        verificationInstructions: todo.verificationInstructions,
                        dueByUser: todo.dueByUser,
                        dueDate: todo.dueDate,
                        resourceUrl: todo.resourceUrl ? services.helpers.makeResourceRef(todo.resourceUrl) : null,
                        resourceName: todo.resourceName,
                        resourceDescription: todo.resourceDescription,
                        programId: program.id,
                        questId: qId,
                        //theProgram.wasPublished below is set by the UI to say that a published version is being saved, we need to make sure to set publishedAt in this case for all existing entities (with id's) in the old program
                        publishedAt: getPublishedAt(theProgram, todo),
                        slug: todo.slug ? todo.slug : uuid.v1()
                    }, { transaction: t })
                        .then(function (newTodo) {
                            Q.all([
                                Q.Promise(function (resolve, reject) {
                                    async.eachSeries(todo.requirements,
                                        function (requirement, callback) {
                                            processTodoRequirement(newTodo, requirement, callback);
                                        },
                                        function (err) {
                                            if (err) {
                                                return reject(err);
                                            }
                                            resolve();
                                        });

                                }),
                                Q.Promise(function (resolve, reject) {
                                    async.eachSeries(todo.challenges,
                                        function (challenge, callback) {
                                            processTodoChallenge(newTodo, challenge, todo.challenges.indexOf(challenge), callback);
                                        },
                                        function (err) {
                                            if (err) {
                                                return reject(err);
                                            }
                                            resolve();
                                        });

                                })
                            ]).then(function (err) {
                                if (!program.todos) {
                                    program.todos = [];
                                }
                                program.todos.push(newTodo);
                                callback(null, program);
                            }).catch(function (err) {
                                return services.helpers.handleReject(err, callback);
                            })
                        });
                };

                // Loop through the quests
                async.eachSeries(theProgram.todos,
                    function (todo, callback) {
                        processTodo(todo, callback);
                    },
                    function (err) {
                        if (err) return services.helpers.handleReject(err, callback);
                        callback(null, program);
                    });
            },
            // Create history
            function (program, callback) {
                models.History.create({
                    programId: program.id,
                    comment: theProgram.comment,
                    details: null,
                    userId: user.id
                }, { transaction: t })
                    .then(function () {
                        callback(null, program);
                    })
                    .catch(function (err) {
                        services.helpers.handleReject(err, callback);
                    });
            },
            // Migrate results
            //This needs to all happen in a transaction, if anything doesn't line up roll back
            function (program, callback) {
                if (theProgram.published == null || theProgram.status == 'preview') {
                    return callback(null, program);
                }
                else if (theProgram.published && theProgram.cancelMigrateResultsOnPublish) {
                    Q.all([
                        models.FactProgramUserCompletedItems.destroy({
                            where: {
                                programLinkId: theProgram.linkId
                            }
                        }),
                        models.FactProgramUserCompletedItemsIntraday.destroy({
                            where: {
                                programLinkId: theProgram.linkId
                            }
                        }),
                        models.FactProgramUserStats.destroy({
                            where: {
                                programLinkId: theProgram.linkId
                            }
                        }),
                        models.FactProgramUserStatsIntraday.destroy({
                            where: {
                                programLinkId: theProgram.linkId
                            }
                        })
                    ]).then(function () {
                        models.Forum.findOne({
                            where: {
                                linkId: theProgram.linkId
                            }
                        }).then(function (currentForum) {
                            //then delete the old data then create new data
                            if (currentForum != null) {

                                models.Forum.destroy({
                                    where: {
                                        linkId: theProgram.linkId
                                    }
                                }).then(function () {
                                    models.Forum.create({
                                        linkId: program.linkId,
                                        name: currentForum.name,
                                        newTopicPoints: currentForum.newTopicPoints ? currentForum.newTopicPoints : 0,
                                        newCommentPoints: currentForum.newCommentPoints ? currentForum.newCommentPoints : 0,
                                        likePoints: currentForum.likePoints ? currentForum.likePoints : 0,
                                        topicCommentPoints: currentForum.topicCommentPoints ? currentForum.topicCommentPoints : 0,
                                        itemLikePoints: currentForum.itemLikePoints ? currentForum.itemLikePoints : 0,

                                        newTopicPointsMax: currentForum.newTopicPointsMax ? currentForum.newTopicPointsMax : 0,
                                        newCommentPointsMax: currentForum.newCommentPointsMax ? currentForum.newCommentPointsMax : 0,
                                        likePointsMax: currentForum.likePointsMax ? currentForum.likePointsMax : 0,
                                        topicCommentPointsMax: currentForum.topicCommentPointsMax ? currentForum.topicCommentPointsMax : 0,
                                        itemLikePointsMax: currentForum.itemLikePointsMax ? currentForum.itemLikePointsMax : 0,

                                        newEncouragePoints: currentForum.newEncouragePoints ? currentForum.newEncouragePoints : 0,
                                        newAppreciatePoints: currentForum.newAppreciatePoints ? currentForum.newAppreciatePoints : 0,
                                        newStoryPoints: currentForum.newStoryPoints ? currentForum.newStoryPoints : 0,
                                        newEncouragePointsMax: currentForum.newEncouragePointsMax ? currentForum.newEncouragePointsMax : 0,
                                        newAppreciatePointsMax: currentForum.newAppreciatePointsMax ? currentForum.newAppreciatePointsMax : 0,
                                        newStoryPointsMax: currentForum.newStoryPointsMax ? currentForum.newStoryPointsMax : 0
                                    }, { transaction: t })
                                        .then(function (newForum) {

                                            Q.all([
                                                models.ForumItemCategory.create({
                                                    name: 'General',
                                                    forumId: newForum.id
                                                }, { transaction: t }),
                                                models.ForumItemCategory.create({
                                                    name: 'Inspiration',
                                                    forumId: newForum.id
                                                }, { transaction: t }),
                                                models.ForumItemCategory.create({
                                                    name: 'Narrative Responses',
                                                    forumId: newForum.id
                                                }, { transaction: t })
                                            ]).then(function () {
                                                return callback(null, program);
                                            }).catch(function (err) {
                                                services.helpers.handleReject(err, callback);
                                            });
                                        })
                                        .catch(function (err) {
                                            services.helpers.handleReject(err, callback);
                                        });
                                });
                            } else {
                                return callback(null, program);
                            }
                        });
                    })
                }
                else {
                    models.Program.findAll({
                        where: {
                            linkId: theProgram.linkId,
                            published: {
                                $ne: null
                            },
                            status: {
                                $ne: 'preview'
                            }
                        }
                    }).then(function (programs) {
                        if (programs.length == 0) {
                            return callback(null, program);
                        } else {
                            var mostRecentPublishedProgramId = _.max(programs, function (p) {
                                return p.id;
                            }).id;

                            if (mostRecentPublishedProgramId != program.id) {
                                migratePublishedData(mostRecentPublishedProgramId, program, callback);
                            }
                        }
                    });
                }
            }
        ],
            function (err, program) {
                if (err) {
                    return reject(err);
                }
                // Commit changes
                resolve(program);
            });

        /**called from last function in waterfall after else clause.
         *given OldProgram and New to be published program, this function will copy and create all user generated data in to newProgram.
         * @param {any} mostRecentPublishedProgramId
         * @param {any} program
         * @param {any} callback
         */
        var migratePublishedData = function (mostRecentPublishedProgramId, program, callback) {

            Q.all([
                models.Quest.findAll({
                    where: {
                        programId: mostRecentPublishedProgramId
                    },
                    include: {
                        model: models.Challenge,
                        as: 'challenges',
                        include: [
                            {
                                model: models.ChallengeResult,
                                as: 'results',
                                include: {
                                    model: models.ChallengeResultItem,
                                    as: 'items'
                                }
                            },
                            {
                                model: models.ChallengeQuestion,
                                as: 'questions',
                                include: {
                                    model: models.ChallengeAnswer,
                                    as: 'answers'
                                }
                            }
                        ]
                    }
                }),
                models.Todo.findAll({
                    where: {
                        programId: mostRecentPublishedProgramId,
                        questId: {
                            $ne: null
                        }
                    },
                    include: [
                        {
                            model: models.UserTodo,
                            as: 'userTodos',
                            include: [
                                {
                                    model: models.UserTodoRequirementsFulfillment,
                                    as: 'requirements'
                                },
                                {
                                    model: models.BonusPoints,
                                    as: 'bonusPoints'
                                }
                            ]

                        },
                        {
                            model: models.TodoRequirement,
                            as: 'requirements'
                        }
                    ]
                }),
                models.Badge.findAll({
                    where: {
                        programId: mostRecentPublishedProgramId
                    },
                    include: [{
                        model: models.UserBadge,
                        as: 'userBadges',
                        include: {
                            model: models.UserBadgeRequirementsFulfillment,
                            as: 'requirements'
                        }
                    }, {
                        model: models.BadgeRequirement,
                        as: 'requirements'
                    }]
                })
            ])
                .spread(function (oldQuests, todos, badges) {
                    oldQuests = JSON.stringify(oldQuests);
                    oldQuests = JSON.parse(oldQuests);
                    oldTodos = JSON.stringify(todos);
                    oldTodos = JSON.parse(oldTodos);
                    oldBadges = JSON.stringify(badges);
                    oldBadges = JSON.parse(oldBadges);

                    var newQuests = program.quests;
                    var newTodos = program.todos;
                    var newBadges = program.badges;

                    async.waterfall([
                        function (callback) {
                            //process Activities Data
                            processActivityData(oldQuests, newQuests, callback);
                        },
                        function (callback) {
                            //process Todo Data
                            processTodoData(oldTodos, newTodos, callback);
                        },
                        function (callback) {
                            // process Todo Challenges and User Media Data
                            processTodoChallengesData(oldTodos, newTodos, callback);
                        },
                        function (callback) {
                            //process UserBadges and Badge Requirements Data
                            processOldBadgesDataToNewBadges(oldBadges, newBadges, callback);
                        }
                    ], function (err) {
                        if (err) return services.helpers.handleReject(err, callback);
                        return callback(null, program);
                    })
                });//end of spread
        };



        /**called from migratePublishedData. Finds matching NewQuest && OldQuest by slug, then process the data by Activity Type
         * If Learn (L) Process Challenge, its results and Forum Items. If Inspire (I) Process ForumItems. If Do (T) then callback
         * @param {any} oldQuests
         * @param {any} newQuests
         * @param {any} callback
         */
        var processActivityData = function (oldQuests, newQuests, callback) {

            async.each(oldQuests, function (oldQuest, callback) {
                var matchingNewQuest = [];
                async.each(newQuests, function (newQuest) {
                    if (newQuest.slug == oldQuest.slug) {
                        matchingNewQuest = newQuest;
                    }
                });
                if (matchingNewQuest) {

                    //if type is L then it has challenges which have forumItems
                    if (matchingNewQuest.type == 'L') {
                        async.waterfall([
                            //process challenges and its results for the old and matching new quests
                            function () {
                                createNewLearnChallengeFromOldLearnChallenge(oldQuest, matchingNewQuest, callback);
                            },
                            //create new forumtItems for the old and matching new quests
                            function () {
                                findAndCopyOldQuestForumItemsToNewQuestByQuestId(oldQuest, matchingNewQuest, callback);
                            }
                        ],
                            function (err) {
                                if (err) return services.helpers.handleReject(err, callback);
                                callback();
                            })
                    }
                    //if type is I then it has no challenges but it has ForumItems
                    if (matchingNewQuest.type == 'I') {
                        findAndCopyOldQuestForumItemsToNewQuestByQuestId(oldQuest, matchingNewQuest, callback);
                    }
                    //if type is T then it has no Direct Challenges and no forumItems. T has Todo which have challnges.
                    if (matchingNewQuest.type == 'T') {
                        callback();
                    }


                } else {
                    return services.helpers.handleReject('Could not find matching new quest for quest: ' + oldQuest.title + ' questId: ' + oldQuest.id, callback);
                }
            }, function (err) {
                if (err) return services.helpers.handleReject(err, callback);
                callback();
            });

        };

        /**triggered from processActivityData, runs through, find matching challenge in matched quests. 
         * For every matching challenge, challenge Results and ChallengeResultItems from oldChallenge are copied to the matching new challenge.
         * Challenges can also have ForumItems, they are passed to findAndCopyOldQuestForumItemsToNewQuestByChallengeId to be created.
         * @param {any} oldQuest
         * @param {any} matchingNewQuest
         * @param {any} callback
         */
        var createNewLearnChallengeFromOldLearnChallenge = function (oldQuest, matchingNewQuest, callback) {
            //this function has one operations: create new challenge and its children items

            async.each(oldQuest.challenges, function (oldChallenge, callback) {
                var matchingNewChallenge;
                async.each(matchingNewQuest.challenges, function (newChallenge) {
                    if (newChallenge.slug == oldChallenge.slug) {
                        matchingNewChallenge = newChallenge;
                    }
                });
                if (matchingNewChallenge) {
                    async.waterfall([
                        function (callback) {
                            async.each(oldChallenge.results, function (oldResult, callback) {
                                oldResult.challengeId = matchingNewChallenge.id;
                                oldResult.id = null;

                                //process ChallengeResults and ChallengeResultItems
                                createNewChallengeResultFromOldChallengeResult(oldResult, oldChallenge, matchingNewChallenge, callback);

                            }, function (err) {
                                if (err) return services.helpers.handleReject(err, callback);
                                callback();
                            })
                        },
                        function (callback) {
                            //process forumtItems for challenge
                            findAndCopyOldQuestForumItemsToNewQuestByChallengeId(oldChallenge, matchingNewChallenge, matchingNewQuest, callback);
                        }
                    ],
                        function (err) {
                            if (err) return services.helpers.handleReject(err, callback);
                            callback();
                        });
                } else {
                    return services.helpers.handleReject('Could not find matching new challenge for challenge: ' + oldChallenge.title + ' questId: ' + oldChallenge.id, callback);
                }
            }, function (err) {
                if (err) return services.helpers.handleReject(err, callback);
                callback();
            });
        };

        /**Triggered from processActivityData.
         * this function will serve both Learn Quest ForumItems and InspireQuest ForumItems
         * first we find all the forumItems for the oldQuest.id
         * then we replace the forumItems.questId to matchingNewQuest.id and Create new forumItems. Instead of Updating.
         * 
         * @param {any} oldQuest
         * @param {any} matchingNewQuest
         * @param {any} callback
         */
        var findAndCopyOldQuestForumItemsToNewQuestByQuestId = function (oldQuest, matchingNewQuest, callback) {

            models.ForumItem.findAll({
                where: {
                    questId: oldQuest.id
                },
                transaction: t
            }).then(function (oldForumItems) {

                oldForumItems = JSON.stringify(oldForumItems);
                oldForumItems = JSON.parse(oldForumItems);

                if (oldForumItems.length > 0) {

                    async.each(oldForumItems, function (oldForumItem, callback) {
                        var oldForumTopicId = oldForumItem.id;
                        oldForumItem.id = null;
                        oldForumItem.questId = matchingNewQuest.id;

                        models.ForumItem.create(oldForumItem, { transaction: t })
                            .then(function (newForumItem) {

                                oldForumItem.id = oldForumTopicId;
                                findAndCreateForumItemAndForumItemChildren(oldForumItem, newForumItem , callback);

                            })
                            .catch(function (err) {
                                callback(err);
                            })
                    }, function (err) {
                        if (err) return services.helpers.handleReject(err, callback);
                        callback();
                    });

                }//end of if
                else {
                    callback();
                }
            })
        };

        /**Triggered from createNewLearnChallengeFromOldLearnChallenge.
         * this function will serve Learn Quest challenge ForumItems
         * first we find all the forumItems for the oldchallenge.id
         * then we replace the forumItems.questId to matchingNewChallenge.id and Create new forumItems. Instead of Updating.
         * 
         * @param {any} oldChallenge
         * @param {any} matchingNewChallenge
         * @param {any} matchingNewQuest
         * @param {any} callback
         */
        var findAndCopyOldQuestForumItemsToNewQuestByChallengeId = function (oldChallenge, matchingNewChallenge, matchingNewQuest, callback) {

            models.ForumItem.findAll({
                where: {
                    challengeId: oldChallenge.id
                },
                transaction: t
            }).then(function (oldForumItems) {

                oldForumItems = JSON.stringify(oldForumItems);
                oldForumItems = JSON.parse(oldForumItems);

                if (oldForumItems.length > 0) {

                    async.each(oldForumItems, function (oldForumItem, callback) {
                        var oldForumTopicId = oldForumItem.id;
                        oldForumItem.id = null;
                        oldForumItem.challengeId = matchingNewChallenge.id;
                        oldForumItem.questId = matchingNewQuest.id;

                        models.ForumItem.create(oldForumItem, { transaction: t })
                            .then(function (newForumItem) {

                                oldForumItem.id = oldForumTopicId;
                                findAndCreateForumItemAndForumItemChildren(oldForumItem, newForumItem, callback);

                            })
                            .catch(function (err) {
                                callback(err);
                            })
                    }, function (err) {
                        if (err) return services.helpers.handleReject(err, callback);
                        callback();
                    });

                }//end of if
                else {
                    callback();
                }
            })

        };

        /**triggered by findAndCopyOldQuestForumItemsToNewQuestByQuestId or findAndCopyOldQuestForumItemsToNewQuestByChallengeId
         * using oldForumItem.id findall ForumItem (comments), ForumItemUser (shared with network user)
         * ForumItemLike - Comments people have liked
         * ForumItemDislike - Comments people have disliked
         * ForumItemMedia - Media associated with ForumItems
         * If any Found, Point them to newForumItem.id
         * Then Create
         * @param {any} oldForumItem
         * @param {any} newForumItem
         * @param {any} callback
         */
        var findAndCreateForumItemAndForumItemChildren = function (oldForumItem, newForumItem, callback) {
            
            Q.all([
                models.ForumItem.findAll({
                    where: {
                        parentId: oldForumItem.id
                    }
                }),
                models.ForumItemUser.findAll({
                    where: {
                        forumItemId: oldForumItem.id
                    }
                }),
                models.ForumItemLike.findAll({
                    where: {
                        forumItemId: oldForumItem.id
                    }
                }),
                models.ForumItemDislike.findAll({
                    where: {
                        forumItemId: oldForumItem.id
                    }
                }),
                models.ForumItemMedia.findAll({
                    where: {
                        forumItemId: oldForumItem.id
                    }
                })
            ]).spread(function (forumItemComments, forumItemUsers, forumItemLikes, forumItemDislikes, forumItemMedias) {

                forumItemComments = JSON.stringify(forumItemComments);
                forumItemComments = JSON.parse(forumItemComments);

                forumItemUsers = JSON.stringify(forumItemUsers);
                forumItemUsers = JSON.parse(forumItemUsers);

                forumItemLikes = JSON.stringify(forumItemLikes);
                forumItemLikes = JSON.parse(forumItemLikes);

                forumItemDislikes = JSON.stringify(forumItemDislikes);
                forumItemDislikes = JSON.parse(forumItemDislikes);

                forumItemMedias = JSON.stringify(forumItemMedias);
                forumItemMedias = JSON.parse(forumItemMedias);

                async.waterfall([
                    function (callback) {
                        if (forumItemComments.length > 0) {
                            async.each(forumItemComments, function (forumItemComment, callback) {

                                forumItemComment.parentId = newForumItem.id;
                                forumItemComment.id = null;

                                models.ForumItem.create(forumItemComment, { transaction: t })
                                    .then(function (newForumItemComment) {
                                        callback();
                                    })
                                    .catch(function (err) {
                                        callback(err);
                                    })

                            }, function (err) {
                                if (err) return services.helpers.handleReject(err, callback);
                                callback();
                            });
                        }
                        else {
                            callback();
                        }
                    },
                    function (callback) {
                        if (forumItemUsers.length > 0) {
                            async.each(forumItemUsers, function (forumItemUser, callback) {

                                forumItemUser.forumItemId = newForumItem.id;
                                forumItemUser.id = null;

                                models.ForumItemUser.create(forumItemUser, { transaction: t })
                                    .then(function (newForumItemUser) {
                                        callback();
                                    })
                                    .catch(function (err) {
                                        callback(err);
                                    })

                            }, function (err) {
                                if (err) return services.helpers.handleReject(err, callback);
                                callback();
                            });
                        }
                        else {
                            callback();
                        }
                    },
                    function (callback) {
                        if (forumItemLikes.length > 0) {
                            async.each(forumItemLikes, function (forumItemLike, callback) {

                                forumItemLike.forumItemId = newForumItem.id;
                                forumItemLike.id = null;

                                models.ForumItemLike.create(forumItemLike, { transaction: t })
                                    .then(function (newForumItemComment) {
                                        callback();
                                    })
                                    .catch(function (err) {
                                        callback(err);
                                    })

                            }, function (err) {
                                if (err) return services.helpers.handleReject(err, callback);
                                callback();
                            });
                        }
                        else {
                            callback();
                        }
                    },
                    function (callback) {
                        if (forumItemDislikes.length > 0) {
                            async.each(forumItemDislikes, function (forumItemDislike, callback) {

                                forumItemDislike.forumItemId = newForumItem.id;
                                forumItemDislike.id = null;

                                models.ForumItemDislike.create(forumItemDislike, { transaction: t })
                                    .then(function (newForumItemDislike) {
                                        callback();
                                    })
                                    .catch(function (err) {
                                        callback(err);
                                    })

                            }, function (err) {
                                if (err) return services.helpers.handleReject(err, callback);
                                callback();
                            });
                        }
                        else {
                            callback();
                        }
                    },
                    function (callback) {
                        if (forumItemMedias.length > 0) {
                            async.each(forumItemMedias, function (forumItemMedia, callback) {

                                forumItemMedia.forumItemId = newForumItem.id;
                                forumItemMedia.id = null;

                                models.ForumItemMedia.create(forumItemMedia, { transaction: t })
                                    .then(function (newForumItemMedia) {
                                        callback();
                                    })
                                    .catch(function (err) {
                                        callback(err);
                                    })

                            }, function (err) {
                                if (err) return services.helpers.handleReject(err, callback);
                                callback();
                            });
                        }
                        else {
                            callback();
                        }
                    }
                ],
                    function (err) {
                        if (err) return services.helpers.handleReject(err, callback);
                        callback();
                    });

            });
        };


        /** triggered from createNewLearnChallengeFromOldLearnChallenge.
         * creates newChallengeResult then process  challengeResultItems
         * @param {any} oldResult
         * @param {any} oldChallenge
         * @param {any} matchingNewChallenge
         * @param {any} callback
         */
        var createNewChallengeResultFromOldChallengeResult = function (oldResult, oldChallenge, matchingNewChallenge, callback) {
            models.ChallengeResult.create(oldResult, { transaction: t })
                .then(function (newResult) {

                    async.each(oldResult.items, function (oldResultItem, callback) {
                        oldResultItem.resultId = newResult.id;
                        oldResultItem.id = null;
                        oldResultItem.questionId = matchingNewChallenge.questions[0].id;

                        if (oldResultItem.answerId) {
                            var oldAnswer = _.findWhere(oldChallenge.questions[0].answers, { id: oldResultItem.answerId });

                            if (oldAnswer) {
                                var indexOfOldAnswer = oldChallenge.questions[0].answers.indexOf(oldAnswer);
                                oldResultItem.answerId = matchingNewChallenge.questions[0].answers[indexOfOldAnswer].id;
                            } else {
                                return callback("answer not found");
                            }
                        }
                        createNewChallengeResultItemFromOldChallengeResultItem(oldResultItem, callback);

                    }, function (err) {
                        if (err) return services.helpers.handleReject(err, callback);
                        callback();
                    })
                })
                .catch(function (err) {
                    callback(err);
                })

        };

        /**Triggered from createNewChallengeResultFromOldChallengeResult and createNewChallengeResultFromOldResult
         * For every Items In OldResults, creates new ResultItems for matchingNewChallenge.
         * @param {any} oldResultItem
         * @param {any} callback
         */
        var createNewChallengeResultItemFromOldChallengeResultItem = function (oldResultItem, callback) {

            models.ChallengeResultItem.create(oldResultItem, { transaction: t })
                .then(function (newResultItem) {
                    callback();
                })
                .catch(function (err) {
                    callback(err);
                })
        };


        /**called from migratePublishedData. Finds matching NewTodo && OldTodo by slug, then process the todo and User bonus Points.
         * @param {any} oldTodos
         * @param {any} newTodos
         * @param {any} callback
         */
        var processTodoData = function (oldTodos, newTodos, callback) {
            async.each(oldTodos, function (todo, callback) {
                //Copy the to-do status and requirement fulfillments
                async.each(todo.userTodos, function (oldUserTodo, callback) {
                    var newTodo = null;
                    async.forEach(newTodos, function (nwTodo, key) {
                        if (nwTodo.slug == todo.slug) {
                            newTodo = nwTodo;

                            //process todo and user todo with bonus points
                            createNewUserTodoFromOldUserTodo(oldUserTodo, newTodo, callback);
                        }
                    });

                }, function (err) {
                    if (err) return services.helpers.handleReject(err, callback);
                    callback();
                })
            }, function (err) {
                if (err) return services.helpers.handleReject(err, callback);
                callback();
            })
        }; 

        /**Triggered by processTodoData.
         * creates newUserTodo then if bonus points exists in OldUserTodo, they are also transfered.
         * @param {any} oldUserTodo
         * @param {any} newTodo
         * @param {any} callback
         */
        var createNewUserTodoFromOldUserTodo = function (oldUserTodo, newTodo, callback) {
            oldUserTodo.todoId = newTodo.id;
            var oldId = oldUserTodo.id;
            oldUserTodo.id = null;

            models.UserTodo.create(oldUserTodo, { transaction: t })
                .then(function (newUserTodo) {
                    if (!newTodo.userTodos) {
                        newTodo.userTodos = [];
                    }
                    newTodo.userTodos.push(newUserTodo);
                    oldUserTodo.id = oldId;

                    //Bonus points if available are now set to new userTodods
                    var oldBonusPointsAry = oldUserTodo.bonusPoints;
                    if (oldBonusPointsAry.length > 0) {
                        createNewBonusPointFromOldBonusPoint(oldBonusPointsAry, newUserTodo, callback);
                    } else {
                        callback();
                    }


                })
                .catch(function (err) {
                    callback(err);
                })
        };

        /**triggered by createNewUserTodoFromOldUserTodo
         * creates newBonusPoint from oldBonusPoint
         * @param {any} oldBonusPointsAry
         * @param {any} newUserTodo
         * @param {any} callback
         */
        var createNewBonusPointFromOldBonusPoint = function (oldBonusPointsAry, newUserTodo, callback) {

            async.each(oldBonusPointsAry, function (oldBonusPoint, callback) {
                var oldBonusInfo = oldBonusPoint;
                oldBonusInfo.userTodoId = newUserTodo.id;
                oldBonusInfo.id = null;
                models.BonusPoints.create(oldBonusInfo, { transaction: t })
                    .then(function (newBonusPoint) {
                        callback();
                    })
                    .catch(function (err) {
                        callback(err);
                    })

            }, function (err) {
                if (err) return services.helpers.handleReject(err, callback);
                callback();
            });
        };

        /**called from migratePublishedData. Finds matching NewTodoChallenges && OldTodoChallenges by slug, then process the challneges, challengeResults and UserMedias.
         * 
         * @param {any} oldTodos
         * @param {any} newTodos
         * @param {any} callback
         */
        var processTodoChallengesData = function (oldTodos, newTodos, callback) {
            async.each(oldTodos, function (todo, callback) {
                models.Challenge.findAll({
                    where: {
                        todoId: todo.id
                    },
                    include: [
                        {
                            model: models.ChallengeResult,
                            as: 'results',
                            include: {
                                model: models.ChallengeResultItem,
                                as: 'items'
                            }
                        },
                        {
                            model: models.UserChallengeMedia,
                            as: 'userMedia'
                        }
                    ]
                }).then(function (oldChallenges) {

                    oldChallenges = JSON.stringify(oldChallenges);

                    oldChallenges = JSON.parse(oldChallenges);

                    if (oldChallenges.length > 0) {

                        //var newTodo = newTodos[todos.indexOf(todo)];
                        var index = null;
                        async.forEach(newTodos, function (nwTodo, key) {
                            if (nwTodo.slug == todo.slug) {
                                var newTodo = nwTodo;
                                var newChallenges = newTodo.challenges;

                                if (newTodo.challenges && newTodo.challenges.length > 0) {
                                    //Copy the to-do challenge results
                                    processOldTodoChallengeResultsToNewTodoChallengeResults(todo, newTodo, oldChallenges, newChallenges, callback);
                                }
                                else {
                                    callback();
                                }
                            }
                        });
                    }
                    else {
                        callback();
                    }
                }).catch(function (err) {
                    callback(err);
                })
            }, function (err) {
                if (err) return services.helpers.handleReject(err, callback);
                callback();
            });
        };

        /**Triggered from processTodoChallengesData.
         * Finds matching new and old Challenge by slug. Then Creates challenge Results then challenge Result items.
         * For Every user media in OldChallenge they are also created for NewChallenge. 
         * @param {any} todo
         * @param {any} newTodo
         * @param {any} oldChallenges
         * @param {any} newChallenges
         * @param {any} callback
         */
        var processOldTodoChallengeResultsToNewTodoChallengeResults = function (todo, newTodo, oldChallenges, newChallenges, callback) {
            async.each(oldChallenges, function (oldChallenge, callback) {
                var matchingNewChallenge = null;
                async.each(newChallenges, function (newChallenge, callback) {
                    if (newChallenge.slug == oldChallenge.slug) {
                        matchingNewChallenge = newChallenge;

                        async.waterfall([
                            function (callback) {
                                async.each(oldChallenge.results, function (oldResult, callback) {
                                    oldResult.challengeId = matchingNewChallenge.id;
                                    oldResult.id = null;

                                    var oldUserTodo = _.findWhere(todo.userTodos, { id: oldResult.userTodoId });
                                    oldResult.userTodoId = _.findWhere(newTodo.userTodos, { userId: oldUserTodo.userId }).id;

                                    createNewChallengeResultFromOldResult(oldResult, callback);

                                }, function (err) {
                                    if (err) return services.helpers.handleReject(err, callback);
                                    callback();
                                })
                            },
                            function (callback) {
                                async.each(oldChallenge.userMedia, function (oldUserMedia, callback) {
                                    oldUserMedia.challengeId = matchingNewChallenge.id;
                                    oldUserMedia.id = null;

                                    var oldUserTodo = _.findWhere(todo.userTodos, { id: oldUserMedia.userTodoId });
                                    oldUserMedia.userTodoId = _.findWhere(newTodo.userTodos, { userId: oldUserTodo.userId }).id;

                                    createNewUserMediaFromOldUserMedia(oldUserMedia, callback);

                                }, function (err) {
                                    if (err) return services.helpers.handleReject(err, callback);
                                    callback();
                                })

                            }
                        ], function (err) {
                            if (err) return services.helpers.handleReject(err, callback);
                            callback();
                        })
                    } else {
                        callback();
                    }
                }, function (err) {
                    if (err) return services.helpers.handleReject(err, callback);
                    callback();
                });

            }, function (err) {
                if (err) return services.helpers.handleReject(err, callback);
                callback();
            });

        };

        /**Triggred From processOldTodoChallengeResultsToNewTodoChallengeResults
         * 
         * @param {any} oldResult
         * @param {any} callback
         */
        var createNewChallengeResultFromOldResult = function (oldResult, callback) {
            models.ChallengeResult.create(oldResult, { transaction: t })
                .then(function (newResult) {
                    async.each(oldResult.items, function (oldResultItem, callback) {
                        oldResultItem.resultId = newResult.id;
                        oldResultItem.id = null;

                        createNewChallengeResultItemFromOldChallengeResultItem(oldResultItem, callback);

                    }, function (err) {
                        if (err) return services.helpers.handleReject(err, callback);
                        callback();
                    })
                })
                .catch(function (err) {
                    callback(err);
                })
        };

        /**Triggered From processOldTodoChallengeResultsToNewTodoChallengeResults
         * 
         * @param {any} oldUserMedia
         * @param {any} callback
         */
        var createNewUserMediaFromOldUserMedia = function (oldUserMedia, callback) {

            models.UserChallengeMedia.create(oldUserMedia, { transaction: t })
                .then(function (newUserMedia) {
                    callback();
                })
                .catch(function (err) {
                    callback(err);
                })
        };

        /**called from migratePublishedData. Finds matching Old and New Badge by slug. If match is found then trigger Create Function
         * 
         * @param {any} oldBadges
         * @param {any} newBadges
         * @param {any} callback
         */
        var processOldBadgesDataToNewBadges = function (oldBadges, newBadges, callback) {
            async.each(oldBadges, function (oldBadge, callback) {

                async.each(oldBadge.userBadges, function (oldUserBadge, callback) {
                    var matchingBadge = null;
                    async.each(newBadges, function (newBadge) {
                        if (oldBadge.slug == newBadge.slug) {
                            matchingBadge = newBadge;
                        }

                    });

                    if (matchingBadge) {
                        oldUserBadge.badgeId = matchingBadge.id;
                        oldUserBadge.id = null;

                        //create badge
                        createNewUserBadgeFromOldUserBadge(oldBadges, newBadges, oldBadge,  oldUserBadge, callback);
                    }
                }, function (err) {
                    if (err) return services.helpers.handleReject(err, callback);
                    callback();
                })
            }, function (err) {
                if (err) return services.helpers.handleReject(err, callback);
                callback();
            })
        };

        /**Triggered From processOldBadgesDataToNewBadges. Creates newUSerBadge and then old badge requirements is copied to new badge.
         * 
         * @param {any} oldBadges
         * @param {any} newBadges
         * @param {any} oldBadge
         * @param {any} oldUserBadge
         * @param {any} callback
         */
        var createNewUserBadgeFromOldUserBadge = function (oldBadges, newBadges, oldBadge, oldUserBadge, callback) {
            models.UserBadge.create(oldUserBadge, { transaction: t })
                .then(function (newUserBadge) {

                    //Copy the badge status and requirement fulfillments
                    createNewUserBadgeRequirementFromOldUserBadgeRequirements(oldBadges, newBadges, oldBadge, oldUserBadge, newUserBadge, callback);
                })
                .catch(function (err) {
                    callback(err);
                })
        };

        /**
         * triggered from createNewUserBadgeFromOldUserBadge. gets the oldUserBadge Requirements, points to NewUserBadge.id and then creates. 
         * @param {any} oldUserBadge
         * @param {any} newUserBadge
         * @param {any} callback
         */
        var createNewUserBadgeRequirementFromOldUserBadgeRequirements = function (oldBadges, newBadges, oldBadge, oldUserBadge, newUserBadge, callback) {

            async.each(oldUserBadge.requirements, function (oldBadgeRequirementFulfillment, callback) {
                oldBadgeRequirementFulfillment.userBadgeId = newUserBadge.id;
                var oldRequirement = _.findWhere(oldBadge.requirements, { id: oldBadgeRequirementFulfillment.badgeRequirementId });
                oldBadgeRequirementFulfillment.badgeRequirementId = newBadges[oldBadges.indexOf(oldBadge)].requirements[oldBadge.requirements.indexOf(oldRequirement)].id;
                oldBadgeRequirementFulfillment.id = null;

                models.UserBadgeRequirementsFulfillment.create(oldBadgeRequirementFulfillment, { transaction: t })
                    .then(function (newBadgeRequirementFulfillment) {
                        callback();
                    })
                    .catch(function (err) {
                        callback(err);
                    })
            }, function (err) {
                if (err) return services.helpers.handleReject(err, callback);
                callback();
            })
        };

    });

};


ProgramController.prototype.create = function (req, res) {
    models.sequelize.transaction({ isolationLevel: models.sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED }).then(function (t) {
        controller._create(req.body, req.user, t)
            .then(function () {
                t.commit()
                    .then(function () {
                        // Fetch the updated program
                        controller._retrieveProgramEdit(req.body.linkId, 0, req.user)
                            .then(function (program) {
                                res.sendSuccess(program);

                            })
                            .catch(function (err) {
                                res.sendError(err);
                            });
                    })
                    .catch(function (err) {
                        res.sendError(err);
                    });
            })
            .catch(function (err) {
                t.rollback().then(function () {
                    res.sendError(err);
                });
            });
    });
};

ProgramController.prototype.createSimple = function (req, res) {
    models.sequelize.transaction({ isolationLevel: models.sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED }).then(function (t) {
        async.waterfall([
            // Create the program
            function (callback) {
                models.Program.create({
                    status: 'ready',
                    linkId: 0,
                    sequencingTypeId: 1,
                    slug: req.body.slug,
                    title: req.body.title,
                    description: req.body.description,
                    imageRef: services.helpers.makeImageRef(req.body.imageUrl),
                    contentProviderId: req.user.clients[0].id,
                    clientId: req.user.clients[0].id,
                    createdById: req.user.id,
                    userBonusPointsBucket: req.body.userBonusPointsBucket
                }, { transaction: t })
                    .then(function (program) {
                        callback(null, program);
                    })
                    .catch(function (err) {
                        services.helpers.handleReject(err, callback);
                    });
            },
            // Update the link id if needed
            function (program, callback) {

                // Save the link id
                program.linkId = program.id;
                program.save({ transaction: t })
                    .then(function (program) {
                        logger.info('Program created [%d:%d] %s', program.linkId, program.id, program.title);
                        callback(null, program);
                    })
                    .catch(function (err) {
                        services.helpers.handleReject(err, callback);
                    });
            },
            // Create history
            function (program, callback) {
                models.History.create({
                    programId: program.id,
                    comment: 'Program created.',
                    details: null,
                    userId: req.user.id
                }, { transaction: t })
                    .then(function () {
                        callback(null, program);
                    })
                    .catch(function (err) {
                        services.helpers.handleReject(err, callback);
                    });
            }
        ],
            function (err, program) {
                if (err) {
                    // Rollback transaction
                    t.rollback().then(function () {
                        res.sendError(err);
                    });
                    return null;
                }
                // Commit changes
                t.commit()
                    .then(function () {
                        // Fetch the new program
                        controller._retrieveProgramEdit(program.slug, 0, req.user)
                            .then(function (program) {
                                res.sendSuccess(program);
                            })
                            .catch(function (err) {
                                res.sendError(err);
                            });
                    })
                    .catch(function (err) {
                        res.sendError(err);
                    });
            });
    });
};

ProgramController.prototype.duplicateProgram = function (req, res) {
    models.sequelize.transaction({ isolationLevel: models.sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED }).then(function (t) {
        controller._duplicateProgram(req.body.programId, req.user, t)
            .then(function (result) {
                t.commit().then(function () {
                    res.sendSuccess(result);
                });
            })
            .catch(function (err) {
                t.rollback().then(function () {
                    res.sendError(err);
                });
            });
    });
};

ProgramController.prototype._duplicateProgram = function (programId, user, t) {
    return Q.Promise(function (resolve, reject) {
        async.waterfall([
            // Create the program
            //retrive the existing programs data
            function (callback) {
                controller._retrieveProgramEdit(null, programId, user, t)
                    .then(function (existingProgram) {
                        callback(null, existingProgram)
                    })
                    .catch(function (err) {
                        if (err == 'Cannot find program!') {
                            reject('Cannot duplicate a deleted program!');
                        }
                        reject(err);
                    });
            },
            /***function to get the forum of existing program****/
            function (existingProgram, callback) {
                models.Forum.findOne({
                    where: { linkId: existingProgram.linkId }
                })
                    .then(function (forum) {
                        if (forum) {
                            callback(null, forum, existingProgram);
                        } else {
                            var forum = [];
                            callback(null, forum, existingProgram);
                        }
                    })
                    .catch(function (err) {
                        services.helpers.handleReject(err, reject);
                    });

            },
            /**********then create the new program*************/
            function (forum, existingProgram, callback) {
                var jsonProgram = JSON.stringify(existingProgram);
                var programObj = JSON.parse(jsonProgram);

                programObj.linkId = 0;
                programObj.published = null;
                programObj.status = 'ready';

                _.each(programObj.quests, function (quest) {
                    quest.publishedAt = null;
                    quest.slug = null;

                    _.each(quest.challenges, function (challenge) {
                        challenge.publishedAt = null;
                        challenge.slug = null;
                    })
                });
                _.each(programObj.levels, function (level) {
                    level.slug = null;
                    _.each(level.quests, function (quest) {
                        quest.publishedAt = null;
                        quest.slug = null;

                        _.each(quest.challenges, function (challenge) {
                            challenge.publishedAt = null;
                            challenge.slug = null;
                        })
                    });
                });

                _.each(programObj.badges, function (badge) {
                    badge.slug = null;
                    badge.publishedAt = null;
                });

                _.each(programObj.todos, function (todo) {
                    todo.slug = null;
                    todo.publishedAt = null;
                });

                models.Program.findAll({
                    where: {
                        clientId: user.clients[0].id,
                        slug: {
                            $like: '%' + programObj.slug + '%'
                        }
                    }
                }).then(function (existingPrograms) {
                    var slugAttempt = programObj.slug;
                    var index = 1;

                    if (existingPrograms.length > 0) {
                        while (_.findWhere(existingPrograms, { slug: slugAttempt }) != null) {
                            slugAttempt = programObj.slug + index.toString();
                            index++;
                        }
                    }
                    programObj.slug = slugAttempt;

                    var titleAttempt = programObj.title;
                    var index = 1;
                    if (existingPrograms.length > 0) {
                        while (_.findWhere(existingPrograms, { title: titleAttempt }) != null) {
                            titleAttempt = programObj.title + index.toString();
                            index++;
                        }
                    }

                    programObj.title = titleAttempt;

                    controller._create(programObj, user, t)
                        .then(function (program) {

                            program.linkId = program.id;
                            program.save();

                            callback(null, forum, existingProgram, program)
                        })
                        .catch(function (err) {
                            reject(err);
                        });
                });

            },
            /****then copy old forum and create new forum.********************/
            function (forum, existingProgram, newProgram, callback) {

                var forums = JSON.stringify(forum);
                var forumObj = JSON.parse(forums);

                var newProg = JSON.stringify(newProgram);
                var newProgObj = JSON.parse(newProg);

                if (forumObj) {
                    
                    models.Forum.create({
                        linkId: newProgObj.linkId,
                        name: forumObj.name,
                        newTopicPoints: forumObj.newTopicPoints ? forumObj.newTopicPoints : 0,
                        newCommentPoints: forumObj.newCommentPoints ? forumObj.newCommentPoints : 0,
                        likePoints: forumObj.likePoints ? forumObj.likePoints : 0,
                        topicCommentPoints: forumObj.topicCommentPoints ? forumObj.topicCommentPoints : 0,
                        itemLikePoints: forumObj.itemLikePoints ? forumObj.itemLikePoints : 0,

                        newTopicPointsMax: forumObj.newTopicPointsMax ? forumObj.newTopicPointsMax : 0,
                        newCommentPointsMax: forumObj.newCommentPointsMax ? forumObj.newCommentPointsMax : 0,
                        likePointsMax: forumObj.likePointsMax ? forumObj.likePointsMax : 0,
                        topicCommentPointsMax: forumObj.topicCommentPointsMax ? forumObj.topicCommentPointsMax : 0,
                        itemLikePointsMax: forumObj.itemLikePointsMax ? forumObj.itemLikePointsMax : 0,

                        newEncouragePoints: forumObj.newEncouragePoints ? forumObj.newEncouragePoints : 0,
                        newAppreciatePoints: forumObj.newAppreciatePoints ? forumObj.newAppreciatePoints : 0,
                        newStoryPoints: forumObj.newStoryPoints ? forumObj.newStoryPoints : 0,
                        newEncouragePointsMax: forumObj.newEncouragePointsMax ? forumObj.newEncouragePointsMax : 0,
                        newAppreciatePointsMax: forumObj.newAppreciatePointsMax ? forumObj.newAppreciatePointsMax : 0,
                        newStoryPointsMax: forumObj.newStoryPointsMax ? forumObj.newStoryPointsMax : 0
                    }, { transaction: t })
                        .then(function (newForum) {

                            Q.all([
                                models.ForumItemCategory.create({
                                    name: 'General',
                                    forumId: newForum.id
                                }, { transaction: t }),
                                models.ForumItemCategory.create({
                                    name: 'Inspiration',
                                    forumId: newForum.id
                                }, { transaction: t }),
                                models.ForumItemCategory.create({
                                    name: 'Narrative Responses',
                                    forumId: newForum.id
                                }, { transaction: t })
                            ]).then(function () {
                                return callback(null, newProgram);
                            }).catch(function (err) {
                                services.helpers.handleReject(err, callback);
                            });
                        })
                        .catch(function (err) {
                            services.helpers.handleReject(err, callback);
                        });
                } else {
                    callback(null, newProgram);
                }
            }
        ],
            function (err, program, license) {
                if (err) {
                    return reject(err);
                }
                resolve({ programId: program.id });
            });
    });
};

ProgramController.prototype.licenseProgramToClient = function (req, res) {
    models.sequelize.transaction({ isolationLevel: models.sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED }).then(function (t) {
        controller._licenseProgramToClient(req.body.programId, req.user, req.body.license, t)
            .then(function (result) {
                t.commit().then(function () {
                    res.sendSuccess(result);
                });
            })
            .catch(function (err) {
                t.rollback().then(function () {
                    res.sendError(err);
                });
            });
    });
};

ProgramController.prototype._licenseProgramToClient = function (programId, user, license, t) {
    return Q.Promise(function (resolve, reject) {
        async.waterfall([
            function (callback) {
                models.Program.find({
                    where: {
                        id: programId
                    },
                    attributes: ['clientId'],
                    include: [
                        {
                            model: models.Client,
                            as: 'client',
                            attributes: ['maxLicenseSeats']
                        }
                    ]
                }).then(function (program) {
                    models.ProgramLicense.findAll({
                        include: [
                            {
                                model: models.Program,
                                as: 'licensedProgram',
                                where: {
                                    contentProviderId: program.clientId
                                }
                            }
                        ]
                    }).then(function (licenses) {
                        licenses = JSON.stringify(licenses);
                        licenses = JSON.parse(licenses);
                        program = JSON.stringify(program);
                        program = JSON.parse(program);

                        var seatCount = 0;
                        _.each(licenses, function (foundLicense) {
                            seatCount += Number(foundLicense.seats);
                        });

                        if ((seatCount + Number(license.seats)) > program.client.maxLicenseSeats) {
                            reject('There are not enough seats available to complete this action: ' + seatCount + ' out of ' + program.client.maxLicenseSeats + ' seats have already been licensed.')
                        } else {
                            callback();
                        }
                    })
                        .catch(function (err) {
                            if (err == 'Cannot find program!') {
                                reject('New licenses cannot be added for deleted programs!');
                            }
                            reject(err);
                        });
                })
            },
            // Create the program
            function (callback) {
                controller._retrieveProgramEdit(null, programId, user, t)
                    .then(function (program) {
                        callback(null, program)
                    })
                    .catch(function (err) {
                        if (err == 'Cannot find program!') {
                            reject('New licenses cannot be added for deleted programs!');
                        }
                        reject(err);
                    });
            },
            function (program, callback) {
                models.Client.find({
                    where: {
                        id: program.client.id
                    },
                    include: {
                        model: models.ClientRole,
                        as: 'roles'
                    }
                })
                    .then(function (client) {
                        client = JSON.stringify(client);
                        client = JSON.parse(client);
                        if (_.findWhere(client.roles, { name: 'Content Provider' }) == null) {
                            callback('Can only license program from Content Authors');
                        } else {
                            callback(null, program)
                        }
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            },
            function (program, callback) {
                var jsonProgram = JSON.stringify(program);
                var programObj = JSON.parse(jsonProgram);


                if (!programObj.contentProviderId) {
                    programObj.contentProviderId = programObj.client.id;
                }

                programObj.client.id = license.clientId;
                programObj.linkId = 0;

                _.each(programObj.quests, function (quest) {
                    quest.publishedAt = null;
                    quest.slug = null;

                    _.each(quest.challenges, function (challenge) {
                        challenge.publishedAt = null;
                        challenge.slug = null;
                    })
                });
                _.each(programObj.levels, function (level) {
                    level.slug = null;
                    _.each(level.quests, function (quest) {
                        quest.publishedAt = null;
                        quest.slug = null;

                        _.each(quest.challenges, function (challenge) {
                            challenge.publishedAt = null;
                            challenge.slug = null;
                        })
                    });
                });

                _.each(programObj.badges, function (badge) {
                    badge.slug = null;
                    badge.publishedAt = null;
                });

                _.each(programObj.todos, function (todo) {
                    todo.slug = null;
                    todo.publishedAt = null;
                });


                models.Program.findAll({
                    where: {
                        clientId: license.clientId,
                        slug: {
                            $like: '%' + programObj.slug + '%'
                        }
                    }
                }).then(function (existingPrograms) {
                    var slugAttempt = programObj.slug;
                    var index = 1;

                    if (existingPrograms.length > 0) {
                        while (_.findWhere(existingPrograms, { slug: slugAttempt }) != null) {
                            slugAttempt = programObj.slug + index.toString();
                            index++;
                        }
                    }
                    programObj.slug = slugAttempt;

                    var titleAttempt = programObj.title;
                    var index = 1;
                    if (existingPrograms.length > 0) {
                        while (_.findWhere(existingPrograms, { title: titleAttempt }) != null) {
                            titleAttempt = programObj.title + index.toString();
                            index++;
                        }
                    }

                    programObj.title = titleAttempt;

                    controller._create(programObj, user, t)
                        .then(function (program) {

                            program.linkId = program.id;
                            program.published = new Date();
                            program.save();

                            callback(null, program)
                        })
                        .catch(function (err) {
                            reject(err);
                        });
                });

            },
            function (program, callback) {
                models.ProgramLicense.create({
                    type: license.type,
                    seats: license.seats,
                    linkId: program.linkId,
                    licensedProgramId: programId
                }, { transaction: t })
                    .then(function (license) {
                        callback(null, program, license);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            }
        ],
            function (err, program, license) {
                if (err) {
                    return reject(err);
                }
                resolve({ programId: program.id, licenseId: license.id });
            }
        )
            ;
    });
};

ProgramController.prototype.updateProgramLicense = function (req, res) {
    models.sequelize.transaction({ isolationLevel: models.sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED }).then(function (t) {
        controller._updateProgramLicense(req.body.id, req.body.seats, req.body.type, t)
            .then(function (result) {
                t.commit().then(function () {
                    res.sendSuccess(result);
                });
            })
            .catch(function (err) {
                t.rollback().then(function () {
                    res.sendError(err);
                });
            });
    });
};

ProgramController.prototype._updateProgramLicense = function (licenseId, seats, type, t) {
    return Q.Promise(function (resolve, reject) {
        models.ProgramLicense.find({
            where: {
                id: licenseId
            }
        })
            .then(function (programLicense) {
                var continueUpdateLicense = function () {
                    programLicense.seats = seats;
                    programLicense.type = type;
                    programLicense.save({ transaction: t }).then(function () {
                        resolve({ programLicenseId: programLicense.id });
                    })
                };

                if (programLicense.seats > seats) {
                    models.ProgramUser.count({
                        where: {
                            linkId: programLicense.linkId
                        }
                    }).then(function (programUsersCount) {
                        if (programUsersCount > seats) {
                            reject({
                                error: true,
                                type: 'seatsValidation',
                                message: 'Cannot update license seats to ' + seats +
                                ' because there are currently ' + programUsersCount +
                                ' users assigned to this program'
                            })
                        } else {
                            continueUpdateLicense();
                        }
                    })
                } else {
                    continueUpdateLicense();
                }

            })
            .catch(function (err) {
                reject(err);
            });
    });
};

ProgramController.prototype.removeProgramLicense = function (req, res) {
    models.sequelize.transaction({ isolationLevel: models.sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED }).then(function (t) {
        controller._removeProgramLicense(req.body.programLicenseId, t)
            .then(function () {
                t.commit().then(function () {
                    res.sendSuccess();
                });
            })
            .catch(function (err) {
                t.rollback().then(function () {
                    res.sendError(err);
                });
            });
    });
};

ProgramController.prototype._removeProgramLicense = function (programLicenseId, t) {
    return Q.Promise(function (resolve, reject) {
        models.ProgramLicense.find({
            where: {
                id: programLicenseId
            }
        })
            .then(function (license) {
                controller._deleteProgram(license.linkId, t).then(function () {
                    models.ProgramLicense.destroy({
                        where: {
                            id: programLicenseId
                        }
                    }, { transaction: t }).then(function () {
                        resolve();
                    })
                })
            })
            .catch(function (err) {
                reject(err);
            });
    });
};

ProgramController.prototype.updatePublished = function (req, res) {
    models.sequelize.transaction({ isolationLevel: models.sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED }).then(function (t) {
        async.waterfall([
            // Create the program
            function (callback) {
                models.Program.create({
                    linkId: req.body.linkId,
                    title: req.body.title,
                    description: req.body.description,
                    imageRef: req.body.imageUrl,
                    published: req.body.published,
                    contentAuthor: req.body.content.author,
                    contentDescription: req.body.content.description,
                    contentProviderId: req.body.content.provider.id,
                    clientId: req.body.client.id
                }, { transaction: t })
                    .then(function (program) {
                        callback(null, program);
                    })
                    .catch(function (err) {
                        services.helpers.handleReject(err, callback);
                    });
            },
            // Update the link id if needed
            function (program, callback) {
                // Is link id set?
                if (program.linkId > 0) {
                    logger.info('Program updated [%d:%d] %s', program.linkId, program.id, program.title);
                    return callback(null, program);
                }

                // Save the link id
                program.linkId = program.id;
                program.save({ transaction: t })
                    .then(function (program) {
                        logger.info('Program created [%d:%d] %s', program.linkId, program.id, program.title);
                        callback(null, program);
                    })
                    .catch(function (err) {
                        services.helpers.handleReject(err, callback);
                    });
            },
            // Create the quests
            function (program, callback) {

                var questSeq = 0;
                var activitySeq = 0;
                var challengeSeq = 0;

                var processQuest = function (quest, callback) {
                    // Create the quest
                    models.Quest.create({
                        title: quest.title,
                        objective: quest.objective,
                        baseOrBonus: quest.baseOrBonus,
                        type: quest.type,
                        inspireAvailableToUser: quest.inspireAvailableToUser,
                        storyAvailableToUser: quest.storyAvailableToUser,
                        encourageAvailableToUser: quest.encourageAvailableToUser,
                        userAllowedMediaUpload: quest.userAllowedMediaUpload,
                        inspirePoints: quest.inspirePoints,
                        backgroundImageRef: quest.backgroundImageUrl,
                        featuredImageRef: quest.featuredImageUrl,
                        sequence: questSeq,
                        programId: program.id
                    }, { transaction: t })
                        .then(function (newQuest) {

                            activitySeq = 0;

                            // Loop through the activities
                            async.eachLimit(quest.activities, 10,
                                function (activity, callback) {
                                    processActivity(newQuest, activity, callback);
                                },
                                function (err) {
                                    if (err) return services.helpers.handleReject(err, callback);
                                    callback(null, newQuest);
                                });

                        })
                        .catch(function (err) {
                            services.helpers.handleReject(err, callback);
                        });
                };

                var processActivity = function (quest, activity, callback) {
                    // Create the activity
                    models.Activity.create({
                        title: activity.title,
                        description: activity.description,
                        authorNotes: activity.authorNotes,
                        content: activity.content.text,
                        contentUrl: activity.content.url,
                        contentType: activity.content.type,
                        mimeType: activity.content.mimeType,
                        sequence: activitySeq++,
                        questId: quest.id,
                        typeId: activity.type.id
                    }, { transaction: t })
                        .then(function (newActivity) {

                            challengeSeq = 0;

                            // Loop through the challenges
                            async.eachLimit(activity.challenges, 10,
                                function (challenge, callback) {
                                    processChallenge(newActivity, challenge, callback);
                                },
                                function (err) {
                                    if (err) return services.helpers.handleReject(err, callback);
                                    callback(null, newActivity);
                                });

                        })
                        .catch(function (err) {
                            services.helpers.handleReject(err, callback);
                        });
                };

                var processChallenge = function (activity, challenge, callback) {
                    // Create the challenge
                    models.Challenge.create({
                        challengeText: challenge.text,
                        instructions: challenge.instructions,
                        sequence: challengeSeq++,
                        activityId: activity.id
                    }, { transaction: t })
                        .then(function (newChallenge) {
                            callback(null, newChallenge);
                        })
                        .catch(function (err) {
                            services.helpers.handleReject(err, callback);
                        });
                };

                // Loop through the quests
                async.eachLimit(req.body.quests, 10, processQuest, function (err) {
                    if (err) return services.helpers.handleReject(err, callback);
                    callback(null, program);
                });
            },
            // Create history
            function (program, callback) {
                models.History.create({
                    programId: program.id,
                    comment: req.body.comment,
                    details: null,
                    userId: req.user.id
                }, { transaction: t })
                    .then(function () {
                        callback(null, program);
                    })
                    .catch(function (err) {
                        services.helpers.handleReject(err, callback);
                    });
            }
        ],
            function (err) {
                if (err) {
                    // Rollback transaction
                    t.rollback().then(function () {
                        res.sendError(err);
                    });
                    return null;
                }
                // Commit changes
                t.commit()
                    .then(function () {
                        // Fetch the updated program
                        controller._retrieveProgramEdit(req.body.linkId, 0, req.user)
                            .then(function (program) {
                                res.sendSuccess(program);
                            })
                            .catch(function (err) {
                                res.sendError(err);
                            });
                    })
                    .catch(function (err) {
                        res.sendError(err);
                    });
            });
    });
};

ProgramController.prototype.deleteProgram = function (req, res) {
    models.sequelize.transaction({ isolationLevel: models.sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED }).then(function (t) {
        controller._deleteProgram(req.params.ref, t)
            .then(function () {
                // Fetch the updated program
                controller._retrieveProgramListing(req.user)
                    .then(function (programs) {
                        t.commit().then(function () {
                            res.sendSuccess(programs);
                        });
                    })
                    .catch(function (err) {
                        t.rollback().then(function () {
                            res.sendError(err);
                        });
                    });
            })
            .catch(function (err) {
                t.rollback().then(function () {
                    res.sendError(err);
                });
            });
    });
};

ProgramController.prototype._deleteProgram = function (linkId, t) {
    return Q.Promise(function (resolve, reject) {
        models.Program.destroy(
            { where: { linkId: linkId } },
            { transaction: t })
            .then(function () {
                return models.ProgramUser.destroy(
                    { where: { linkId: linkId } },
                    { transaction: t })
                    .then(function () {
                        resolve();
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            })
            .catch(function (err) {
                reject(err);
            });
    });
};

ProgramController.prototype._retrieveProgramForum = function (ref, clientId) {
    return Q.Promise(function (resolve, reject) {

        _refToLinkId(ref, clientId)
            .then(function (linkId) {
                services.forum.createForumIfNeeded(linkId, 'Default Program Forum')
                    .then(function (forumId) {
                        services.forum.getForum(forumId)
                            .then(resolve)
                            .catch(function (err) {
                                services.helpers.handleReject(err, reject);
                            })
                    });

            });
    });
};

ProgramController.prototype.retrieveProgramForum = function (req, res) {

    controller._retrieveProgramForum(req.params.ref, req.user.clients[0].id)
        .then(function (forum) {
            res.sendSuccess(forum)
        })
        .catch(function (err) {
            res.sendError(err);
        });
};

ProgramController.prototype._updateProgramForum = function (model) {
    return Q.Promise(function (resolve, reject) {

        models.sequelize.transaction({ isolationLevel: models.sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED }).then(function (t) {

            async.waterfall([

                // Find and update the forum entity
                function (callback) {
                    models.Forum.findById(model.id)
                        .then(function (forum) {
                            forum.newTopicPoints = model.newTopicPoints;
                            forum.newCommentPoints = model.newCommentPoints;
                            forum.likePoints = model.likePoints;
                            forum.topicCommentPoints = model.topicCommentPoints;
                            forum.itemLikePoints = model.itemLikePoints;

                            forum.newTopicPointsMax = model.newTopicPointsMax;
                            forum.newCommentPointsMax = model.newCommentPointsMax;
                            forum.likePointsMax = model.likePointsMax;
                            forum.topicCommentPointsMax = model.topicCommentPointsMax;
                            forum.itemLikePointsMax = model.itemLikePointsMax;

                            forum.newEncouragePoints = model.newEncouragePoints;
                            forum.newAppreciatePoints = model.newAppreciatePoints
                            forum.newStoryPoints = model.newStoryPoints
                            forum.newEncouragePointsMax = model.newEncouragePointsMax
                            forum.newAppreciatePointsMax = model.newAppreciatePointsMax
                            forum.newStoryPointsMax = model.newStoryPointsMax

                            forum.save({ transaction: t })
                                .then(function (forum) {
                                    callback(null, forum);
                                })
                                .catch(function (err) {
                                    services.helpers.handleReject(err, callback);
                                });
                        })
                        .catch(function (err) {
                            services.helpers.handleReject(err, callback);
                        });
                },
                // Get all existing categories
                function (forum, callback) {
                    models.ForumItemCategory.findAll({
                        attributes: ['id', 'name'],
                        where: { forumId: forum.id }
                    })
                        .then(function (categories) {
                            callback(null, forum, categories);
                        })
                        .catch(function (err) {
                            services.helpers.handleReject(err, callback);
                        });
                },
                function (forum, existingCategories, callback) {
                    var newCats = [];
                    var updateCats = [];
                    var delCats = [];
                    _.each(model.categories, function (cat) {
                        var existing = _.find(existingCategories, function (c) {
                            return c.id == cat.id;
                        });

                        if (existing) {
                            if (existing.name !== cat.name)
                                updateCats.push(cat);
                        }
                        else newCats.push(cat);
                    });
                    _.each(existingCategories, function (cat) {
                        if (!_.find(model.categories, function (c) {
                            return c.id == cat.id;
                        })) {
                            delCats.push(cat);
                        }
                    });


                    async.each(newCats, function (cat, callback) {
                        models.ForumItemCategory.build({
                            name: cat.name,
                            forumId: forum.id
                        }).save({ transaction: t })
                            .then(function () {
                                callback();
                            })
                            .catch(function (err) {
                                services.helpers.handleReject(err, callback);
                            })
                    }, function (err) {
                        if (err) return services.helpers.handleReject(err, callback);

                        async.each(updateCats, function (cat, callback) {
                            models.ForumItemCategory.update({
                                name: cat.name
                            }, {
                                    where: { id: cat.id },
                                    transaction: t
                                })
                                .then(function () {
                                    callback();
                                })
                                .catch(function (err) {
                                    services.helpers.handleReject(err, callback);
                                })
                        }, function (err) {
                            if (err) return services.helpers.handleReject(err, callback);

                            async.each(delCats, function (cat, callback) {
                                models.ForumItemCategory.destroy({
                                    where: { id: cat.id },
                                    transaction: t
                                })
                                    .then(function () {
                                        callback();
                                    })
                                    .catch(function (err) {
                                        services.helpers.handleReject(err, callback);
                                    })
                            }, function (err) {
                                if (err) return services.helpers.handleReject(err, callback);
                                callback(null, forum);
                            });
                        });
                    });
                }

            ], function (err, forum) {
                if (err) {
                    t.rollback().then(function () {
                        services.helpers.handleReject(err, reject);
                    });
                    return null;
                }
                t.commit()
                    .then(function () {
                        services.forum.getForum(forum.id)
                            .then(resolve)
                            .catch(function (err) {
                                services.helpers.handleReject(err, reject);
                            });
                    })
                    .catch(function (err) {
                        services.helpers.handleReject(err, reject);
                    });
            });
        });
    });
};

ProgramController.prototype.updateProgramForum = function (req, res) {

    controller._updateProgramForum(req.body)
        .then(function (forum) {
            res.sendSuccess(forum)
        })
        .catch(function (err) {
            res.sendError(err);
        });
};

module.exports = controller;