var models = require('../models');
var moment = require('moment');
var async = require('async');
var Q = require('q');

var _getDimDateId = function() {
    var theDate = moment().format("YYYYMMDD");
    return parseInt(theDate);
}

exports.logLevelComplete = function(userId, levelId, points) {
    return Q.Promise(function(resolve, reject) {
        var dimDateId = 0;
        var programLinkId = 0;

        async.series([
                // Determine DimDate Id
                function(callback){
                    try {
                        dimDateId = _getDimDateId();

                        // If we made it this far, the function was successful.
                        callback();
                    }
                    catch (err) {
                        callback(err);
                    }
                },

                // Get Program linkId.
                function(callback){
                    try {
                        models.Level.find({
                            where: {
                                id: levelId
                            },
                            include: [
                                {
                                    model: models.Program,
                                    as: 'program',
                                    paranoid: false     // Ensures the join to Program always works
                                }
                            ]
                        })
                            .then(function (level) {
                                if (!level) throw new Error('Level could not be found.  levelId = ' + levelId + '.');

                                // Set variables
                                programLinkId = level.program.linkId;

                                // If we made it this far, the function was successful.
                                callback();
                            })
                            .catch(function (err) {
                                callback(err);
                            });
                    }
                    catch (err) {
                        callback(err);
                    }
                },

                // Log Intraday Stats
                function(callback){
                    try {
                        models.FactProgramUserStatsIntraday.find({
                            where: {
                                programLinkId: programLinkId,
                                userId: userId,
                                dimDateId: dimDateId
                            }
                        })
                            .then(function (stats) {
                                if (!stats) {
                                    // Build new record
                                    stats = models.FactProgramUserStatsIntraday.build({
                                        programLinkId: programLinkId,
                                        userId: userId,
                                        dimDateId: dimDateId
                                    });
                                }

                                // Update columns and save
                                stats.levelsCompletedCount ++;
                                stats.levelsCompletedPoints += points;
                                stats.save()
                                    .then(function() {
                                        // If we made it this far, the function was successful.
                                        callback();
                                    });
                            })
                            .catch(function (err) {
                                callback(err);
                            });
                    }
                    catch (err) {
                        callback(err);
                    }
                },

                // Log Intraday Completed Items
                function(callback){
                    try {
                        models.FactProgramUserCompletedItemsIntraday.find({
                            where: {
                                programLinkId: programLinkId,
                                userId: userId,
                                dimDateId: dimDateId
                            }
                        })
                            .then(function (ci) {
                                if (!ci) {
                                    // Build new record
                                    ci = models.FactProgramUserCompletedItemsIntraday.build({
                                        programLinkId: programLinkId,
                                        userId: userId,
                                        dimDateId: dimDateId
                                    });
                                }

                                // Update columns and save
                                ci.levelLastCompleted = levelId;
                                ci.save()
                                    .then(function() {
                                        // If we made it this far, the function was successful.
                                        callback();
                                    });
                            })
                            .catch(function (err) {
                                callback(err);
                            });
                    }
                    catch (err) {
                        callback(err);
                    }
                }
            ],

            // Callback
            function(err){
                if (err) {
                    services.helpers.handleReject(err, null);
                    reject(err);
                }
                resolve();
            }
        );
    });
}

exports.logQuestComplete = function(userId, questId, points) {
    return Q.Promise(function(resolve, reject) {
        var dimDateId = 0;
        var programLinkId = 0;

        async.series([
                // Determine DimDate Id
                function(callback){
                    try {
                        dimDateId = _getDimDateId();

                        // If we made it this far, the function was successful.
                        callback();
                    }
                    catch (err) {
                        callback(err);
                    }
                },

                // Get Program linkId.
                function(callback){
                    try {
                        models.Quest.find({
                            where: {
                                id: questId
                            },
                            include: [
                                {
                                    model: models.Program,
                                    as: 'program',
                                    paranoid: false     // Ensures the join to Program always works
                                }
                            ]
                        })
                            .then(function (quest) {
                                if (!quest) throw new Error('Quest could not be found.  questId = ' + questId + '.');

                                // Set variables
                                programLinkId = quest.program.linkId;

                                // If we made it this far, the function was successful.
                                callback();
                            })
                            .catch(function (err) {
                                callback(err);
                            });
                    }
                    catch (err) {
                        callback(err);
                    }
                },

                // Log Intraday Stats
                function(callback){
                    try {
                        models.FactProgramUserStatsIntraday.find({
                            where: {
                                programLinkId: programLinkId,
                                userId: userId,
                                dimDateId: dimDateId
                            }
                        })
                            .then(function (stats) {
                                if (!stats) {
                                    // Build new record
                                    stats = models.FactProgramUserStatsIntraday.build({
                                        programLinkId: programLinkId,
                                        userId: userId,
                                        dimDateId: dimDateId
                                    });
                                }

                                // Update columns and save
                                stats.questsCompletedCount ++;
                                stats.questsCompletedPoints += points;
                                stats.save()
                                    .then(function() {
                                        // If we made it this far, the function was successful.
                                        callback();
                                    });
                            })
                            .catch(function (err) {
                                callback(err);
                            });
                    }
                    catch (err) {
                        callback(err);
                    }
                },

                // Log Intraday Completed Items
                function(callback){
                    try {
                        models.FactProgramUserCompletedItemsIntraday.find({
                            where: {
                                programLinkId: programLinkId,
                                userId: userId,
                                dimDateId: dimDateId
                            }
                        })
                            .then(function (ci) {
                                if (!ci) {
                                    // Build new record
                                    ci = models.FactProgramUserCompletedItemsIntraday.build({
                                        programLinkId: programLinkId,
                                        userId: userId,
                                        dimDateId: dimDateId
                                    });
                                }

                                // Update columns and save
                                ci.questLastCompleted = questId;
                                ci.save()
                                    .then(function() {
                                        // If we made it this far, the function was successful.
                                        callback();
                                    });
                            })
                            .catch(function (err) {
                                callback(err);
                            });
                    }
                    catch (err) {
                        callback(err);
                    }
                }
            ],

            // Callback
            function(err){
                if (err) {
                    services.helpers.handleReject(err, null);
                    reject(err);
                }
                resolve();
            }
        );
    });
}

exports.logChallengeComplete = function(userId, challengeId, points) {
    return Q.Promise(function(resolve, reject) {
        // Local variables
        var dimDateId = 0;
        var programLinkId = 0;
        async.series([
                // Determine DimDate Id
                function(callback){
                    try {
                        dimDateId = _getDimDateId();

                        // If we made it this far, the function was successful.
                        callback();
                    }
                    catch (err) {
                        callback(err);
                    }
                },

                // Get Program linkId.
                function(callback){
                    try {
                        models.Challenge.find({
                            where: {
                                id: challengeId
                            },
                            include: [
                                {
                                    model: models.Quest,
                                    as: 'quest',
                                    include: [
                                        {
                                            model: models.Program,
                                            as: 'program',
                                            paranoid: false     // Ensures the join to Program always works
                                        }
                                    ]
                                }
                            ]
                        })
                            .then(function (challenge) {
                                if (!challenge) throw new Error('Challenge could not be found.  challengeId = ' + challengeId + '.');

                                // Set variables
                                programLinkId = challenge.quest.program.linkId;

                                // If we made it this far, the function was successful.
                                callback();
                            })
                            .catch(function (err) {
                                callback(err);
                            });
                    }
                    catch (err) {
                        callback(err);
                    }
                },

                // Log Intraday Stats
                function(callback){
                    try {
                        models.FactProgramUserStatsIntraday.find({
                            where: {
                                programLinkId: programLinkId,
                                userId: userId,
                                dimDateId: dimDateId
                            }
                        })
                            .then(function (stats) {
                                if (!stats) {
                                    // Build new record
                                    stats = models.FactProgramUserStatsIntraday.build({
                                        programLinkId: programLinkId,
                                        userId: userId,
                                        dimDateId: dimDateId
                                    });
                                }

                                // Update columns and save
                                stats.challengesCompletedCount ++;
                                stats.challengesCompletedPoints += points;
                                stats.totalBasePoints =
                                    stats.challengesCompletedPoints +
                                    stats.todosCompletedPoints;
                                stats.save()
                                    .then(function() {
                                        // If we made it this far, the function was successful.
                                        callback();
                                    });
                            })
                            .catch(function (err) {
                                callback(err);
                            });
                    }
                    catch (err) {
                        callback(err);
                    }
                },

                // Log Intraday Completed Items
                function(callback){
                    try {
                        models.FactProgramUserCompletedItemsIntraday.find({
                            where: {
                                programLinkId: programLinkId,
                                userId: userId,
                                dimDateId: dimDateId
                            }
                        })
                            .then(function (ci) {
                                if (!ci) {
                                    // Build new record
                                    ci = models.FactProgramUserCompletedItemsIntraday.build({
                                        programLinkId: programLinkId,
                                        userId: userId,
                                        dimDateId: dimDateId
                                    });
                                }

                                // Update columns and save
                                ci.challengeLastCompleted = challengeId;
                                ci.save()
                                    .then(function() {
                                        // If we made it this far, the function was successful.
                                        callback();
                                    });
                            })
                            .catch(function (err) {
                                callback(err);
                            });
                    }
                    catch (err) {
                        callback(err);
                    }
                }
            ],

            // Callback
            function(err){
                if (err) {
                    services.helpers.handleReject(err, null);
                    reject(err);
                }
                resolve();
            }
        );
    });
}

exports.logTodoComplete = function(userId, todoId, points) {
    return Q.Promise(function(resolve, reject) {
        var dimDateId = 0;
        var programLinkId = 0;

        async.series([
                // Determine DimDate Id
                function(callback){
                    try {
                        dimDateId = _getDimDateId();

                        // If we made it this far, the function was successful.
                        callback();
                    }
                    catch (err) {
                        callback(err);
                    }
                },

                // Get Program linkId.
                function(callback){
                    try {
                        models.Todo.find({
                            where: {
                                id: todoId
                            },
                            include: [
                                {
                                    model: models.Program,
                                    as: 'program',
                                    paranoid: false     // Ensures the join to Program always works
                                }
                            ]
                        })
                            .then(function (todo) {
                                if (!todo) throw new Error('Todo could not be found.  todoId = ' + todoId + '.');

                                // Set variables
                                programLinkId = todo.program.linkId;

                                // If we made it this far, the function was successful.
                                callback();
                            })
                            .catch(function (err) {
                                callback(err);
                            });
                    }
                    catch (err) {
                        callback(err);
                    }
                },

                // Log Intraday Stats
                function(callback){
                    try {
                        models.FactProgramUserStatsIntraday.find({
                            where: {
                                programLinkId: programLinkId,
                                userId: userId,
                                dimDateId: dimDateId
                            }
                        })
                            .then(function (stats) {
                                if (!stats) {
                                    // Build new record
                                    stats = models.FactProgramUserStatsIntraday.build({
                                        programLinkId: programLinkId,
                                        userId: userId,
                                        dimDateId: dimDateId
                                    });
                                }

                                // Update columns and save
                                stats.todosCompletedCount ++;
                                stats.todosCompletedPoints += points;
                                stats.totalBasePoints =
                                    stats.challengesCompletedPoints +
                                    stats.todosCompletedPoints;
                                stats.save()
                                    .then(function() {
                                        // If we made it this far, the function was successful.
                                        callback();
                                    });
                            })
                            .catch(function (err) {
                                callback(err);
                            });
                    }
                    catch (err) {
                        callback(err);
                    }
                },

                // Log Intraday Completed Items
                function(callback){
                    try {
                        models.FactProgramUserCompletedItemsIntraday.find({
                            where: {
                                programLinkId: programLinkId,
                                userId: userId,
                                dimDateId: dimDateId
                            }
                        })
                            .then(function (ci) {
                                if (!ci) {
                                    // Build new record
                                    ci = models.FactProgramUserCompletedItemsIntraday.build({
                                        programLinkId: programLinkId,
                                        userId: userId,
                                        dimDateId: dimDateId
                                    });
                                }

                                // Update columns and save
                                ci.todoLastCompleted = todoId;
                                ci.save()
                                    .then(function() {
                                        // If we made it this far, the function was successful.
                                        callback();
                                    });
                            })
                            .catch(function (err) {
                                callback(err);
                            });
                    }
                    catch (err) {
                        callback(err);
                    }
                }
            ],

            // Callback
            function(err){
                if (err) {
                    services.helpers.handleReject(err, null);
                    reject(err);
                }
                resolve();
            }
        );
    });
}

exports.logBadgeEarned = function(userId, badgeId) {
    return Q.Promise(function(resolve, reject) {
        var dimDateId = 0;
        var programLinkId = 0;

        async.series([
                // Determine DimDate Id
                function(callback){
                    try {
                        dimDateId = _getDimDateId();

                        // If we made it this far, the function was successful.
                        callback();
                    }
                    catch (err) {
                        callback(err);
                    }
                },

                // Get Program linkId.
                function(callback){
                    try {
                        models.Badge.find({
                            where: {
                                id: badgeId
                            },
                            include: [
                                {
                                    model: models.Program,
                                    as: 'program',
                                    paranoid: false     // Ensures the join to Program always works
                                }
                            ]
                        })
                            .then(function (badge) {
                                if (!badge) throw new Error('Badge could not be found.  badgeId = ' + badgeId + '.');

                                // Set variables
                                programLinkId = badge.program.linkId;

                                // If we made it this far, the function was successful.
                                callback();
                            })
                            .catch(function (err) {
                                callback(err);
                            });
                    }
                    catch (err) {
                        callback(err);
                    }
                },

                // Log Intraday Stats
                function(callback){
                    try {
                        models.FactProgramUserStatsIntraday.find({
                            where: {
                                programLinkId: programLinkId,
                                userId: userId,
                                dimDateId: dimDateId
                            }
                        })
                            .then(function (stats) {
                                if (!stats) {
                                    // Build new record
                                    stats = models.FactProgramUserStatsIntraday.build({
                                        programLinkId: programLinkId,
                                        userId: userId,
                                        dimDateId: dimDateId
                                    });
                                }

                                // Update columns and save
                                stats.badgesEarnedCount ++;
                                stats.save()
                                    .then(function() {
                                        // If we made it this far, the function was successful.
                                        callback();
                                    });
                            })
                            .catch(function (err) {
                                callback(err);
                            });
                    }
                    catch (err) {
                        callback(err);
                    }
                },

                // Log Intraday Completed Items
                function(callback){
                    try {
                        models.FactProgramUserCompletedItemsIntraday.find({
                            where: {
                                programLinkId: programLinkId,
                                userId: userId,
                                dimDateId: dimDateId
                            }
                        })
                            .then(function (ci) {
                                if (!ci) {
                                    // Build new record
                                    ci = models.FactProgramUserCompletedItemsIntraday.build({
                                        programLinkId: programLinkId,
                                        userId: userId,
                                        dimDateId: dimDateId
                                    });
                                }

                                // Update columns and save
                                ci.badgeLastEarned = badgeId;
                                ci.save()
                                    .then(function() {
                                        // If we made it this far, the function was successful.
                                        callback();
                                    });
                            })
                            .catch(function (err) {
                                callback(err);
                            });
                    }
                    catch (err) {
                        callback(err);
                    }
                }
            ],

            // Callback
            function(err){
                if (err) {
                    services.helpers.handleReject(err, null);
                    reject(err);
                }
                resolve();
            }
        );
    });
}