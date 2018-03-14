var models = require('../models');
var async = require('async');
var _ = require('underscore');


function StatsController() {}

var controller = Object.create(StatsController.prototype);

StatsController.prototype.getProgramUserStats = function(req, res) {
    if (!req.body.programLinkId) {
        res.sendError("Missing parameter 'programLinkId'.");
        return;
    }

    // SQL for WHERE clause
    var where = "WHERE programLinkId = " + req.body.programLinkId;
    if (req.body.users) {
        if (req.body.users.length == 0) {
            where += " AND userId = -1";   // Filter on bogus user to result empty results
        } else {
            where += " AND userId IN (";
            var i = 0;
            _.each(req.body.users, function (user) {
                if (i == 0) {
                    where += user;
                } else {
                    where += ", " + user;
                }
                i++;
            });
            where += ')';
        }
    }
    if ((req.body.startDate) && (req.body.endDate)) {
        where += " AND date BETWEEN '" + req.body.startDate + "' AND '" + req.body.endDate + "'";
    } else {
        if (req.body.startDate) {
            where += " AND date >= '" + req.body.startDate + "'";
        }
        if (req.body.endDate) {
            where += " AND date <= '" + req.body.endDate + "'";
        }
        if ((!req.body.startDate) && (!req.body.endDate)) {
            where += " AND date IS NULL";
        }
    }

    // SQL SELECT for summary measures
    var measures =
            // Levels Completed Stats
        "    SUM(S.levelsCompletedCount) AS sumLevelsCompletedCount,"+

            // Quests Completed Stats
        "    SUM(S.questsCompletedCount) AS sumQuestsCompletedCount,"+

            // Challenges Completed Stats
        "    SUM(S.challengesCompletedCount) AS sumChallengesCompletedCount,"+

            // Challenge Points Stats
        "    SUM(S.challengesCompletedPoints) AS sumChallengesCompletedPoints,"+

            // Todos Completed Stats
        "    SUM(S.todosCompletedCount) AS sumTodosCompletedCount,"+

            // Todo Points Stats
        "    SUM(S.todosCompletedPoints) AS sumTodosCompletedPoints,"+

            // Points / XP Stats
        "    SUM(S.totalBasePoints) AS sumTotalBasePoints,"+

            // Badges Earned Stats
        "    SUM(S.badgesEarnedCount) AS sumBadgesEarnedCount ";

    // Execute SQL statements for overall, summary and detail results
    async.parallel([
        function(callback){
                // Build SQL for programItemCounts
                var sql = "CALL get_program_item_counts(" + req.body.programLinkId + ")";

                // Execute query and return results
                models.sequelize.query(sql, { model: models.ProgramItemCounts })
                    .then(function (rows) {
                        if (rows) {
                            callback(null, rows[0]);
                        }
                    })
                    .catch(function(err) {
                        callback(err);
                    });
            },
        function(callback){
                // Build SQL for summaryByInterval
                var columns;
                switch(req.body.summaryInterval) {
                    case "week":
                        columns =
                            "    S.week,"+
                            "    S.weekDisplay,"+
                            "    S.month,"+
                            "    S.monthName,"+
                            "    S.monthYear,"+
                            "    S.mmyyyy,"+
                            "    S.monthDisplay,"+
                            "    S.quarter,"+
                            "    S.quarterName,"+
                            "    S.quarterDisplay,"+
                            "    S.year,"+
                            "    S.yearName,"+
                            "    S.yearDisplay";
                        break;
                    case "month":
                        columns =
                            "    S.month,"+
                            "    S.monthName,"+
                            "    S.monthYear,"+
                            "    S.mmyyyy,"+
                            "    S.monthDisplay,"+
                            "    S.quarter,"+
                            "    S.quarterName,"+
                            "    S.quarterDisplay,"+
                            "    S.year,"+
                            "    S.yearName,"+
                            "    S.yearDisplay";
                        break;
                    case "quarter":
                        columns =
                            "    S.quarter,"+
                            "    S.quarterName,"+
                            "    S.quarterDisplay,"+
                            "    S.year,"+
                            "    S.yearName,"+
                            "    S.yearDisplay";
                        break;
                    case "year":
                        columns =
                            "    S.year,"+
                            "    S.yearName,"+
                            "    S.yearDisplay";
                        break;
                    case "day":
                    default:
                        columns =
                            "    S.date,"+
                            "    S.dateDisplay,"+
                            "    S.week,"+
                            "    S.weekDisplay,"+
                            "    S.month,"+
                            "    S.monthName,"+
                            "    S.monthYear,"+
                            "    S.mmyyyy,"+
                            "    S.monthDisplay,"+
                            "    S.quarter,"+
                            "    S.quarterName,"+
                            "    S.quarterDisplay,"+
                            "    S.year,"+
                            "    S.yearName,"+
                            "    S.yearDisplay";
                        break;
                }

                var sql = "SELECT "+
                    columns + ", " +
                    measures +
                    " FROM ProgramUserStats S "+
                    where +
                    " GROUP BY "+
                    columns;

                // Execute query and return results
                models.sequelize.query(sql, { model: models.ProgramUserStatsSummary })
                    .then(function (rows) {
                        if (rows) {
                            callback(null, rows);
                        }
                    })
                    .catch(function(err) {
                        callback(err);
                    });
            },
        function(callback){
                // Build SQL for summaryByUser
                var columns =
                    "    S.userId,"+
                    "    S.userFullName";

                var sql = "SELECT "+
                    columns + ", " +
                    measures +
                    " FROM ProgramUserStats S "+
                    where +
                    " GROUP BY "+
                    columns;

                // Execute query and return results
                models.sequelize.query(sql, { model: models.ProgramUserStatsSummary })
                    .then(function (rows) {
                        if (rows) {
                            callback(null, rows);
                        }
                    })
                    .catch(function(err) {
                        callback(err);
                    });
            },
        function(callback){
            // Build SQL for details
            var sql = "SELECT * FROM ProgramUserStats";
            sql += " " + where;
            //console.log(sql);
            // Execute query and return results
            models.sequelize.query(sql, { model: models.ProgramUserStats })
                .then(function (rows) {
                    if (rows) {
                        callback(null, rows);
                    }
                })
                .catch(function(err) {
                    callback(err);
                });
        }
    ],
    function(err, results){
        if (err) {
            res.sendError(err);
        } else {
            res.sendSuccess({
                programItemCounts: results[0],
                summaryByInterval: results[1],
                summaryByUser: results[2],
                details: results[3]
            });
        }
    });

};

StatsController.prototype.getProgramPollQuestions = function(req, res) {
    if (!req.body.programId) {
        res.sendError("Missing parameter 'programId'.");
        return;
    }

    // Execute SQL statement(s)
    async.parallel([
            function(callback){
                // Build SQL for programPollQuestions
                var sql = "CALL get_program_poll_questions(" + req.body.programId + ")";

                // Execute query and return results
                models.sequelize.query(sql, { model: models.ProgramPollQuestions })
                    .then(function (rows) {
                        if (rows) {
                            callback(null, rows[0]);
                        }
                    })
                    .catch(function(err) {
                        callback(err);
                    });
            }
        ],
        function(err, results){
            if (err) {
                res.sendError(err);
            } else {
                res.sendSuccess({
                    programPollQuestions: results[0]
                });
            }
        });

};

StatsController.prototype.getPollResults = function(req, res) {
    if (!req.body.questionId) {
        res.sendError("Missing parameter 'questionId'.");
        return;
    }

    // SQL for users in WHERE clause
    var users = "";
    if (req.body.users) {
        if (req.body.users.length == 0) {
            users += " userId = -1";   // Filter on bogus user to result empty results
        } else {
            users += " userId IN (";
            var i = 0;
            _.each(req.body.users, function (user) {
                if (i == 0) {
                    users += user;
                } else {
                    users += ", " + user;
                }
                i++;
            });
            users += ')';
        }
    }


    // Build full SQL statement
    var sql =
        ' SELECT'+
        '	CA.id AS answerId,'+
        '   CA.answer,'+
        '   IFNULL(RESULTS.resultCount, 0) AS resultCount'+
        ' FROM'+
        '	ChallengeAnswers CA'+
        '   LEFT OUTER JOIN ('+
        '		SELECT'+
        '			questionId,'+
        '           answerId,'+
        '           COUNT(userId) AS resultCount'+
        '		FROM'+
        '			PollResults'+
        '		WHERE'+
        '			questionId = ' + req.body.questionId +
        '			AND ' + users  +
        '		GROUP BY'+
        '			questionId,'+
        '			answerId) RESULTS ON RESULTS.questionId = CA.questionId AND RESULTS.answerId = CA.id'+
        ' WHERE'+
        '	CA.questionId = ' + req.body.questionId +
        ' ORDER BY'+
        '	CA.sequence';


    // Execute query and return results
    models.sequelize.query(sql, { model: models.PollResults })
        .then(function (rows) {
            if (rows) {
                res.sendSuccess({ pollResults: rows });
            }
        })
        .catch(function(err) {
            res.sendError(err);
        });

};

StatsController.prototype.getCompletedChallenges = function(req, res) {
    if (!req.body.programId) {
        res.sendError("Missing parameter 'programId'.");
        return;
    }
    if (!req.body.userId) {
        res.sendError("Missing parameter 'userId'.");
        return;
    }

    // Execute SQL statement(s)
    async.parallel([
            function(callback){
                // Build SQL for programPollQuestions
                var sql = "CALL get_completed_challenges(" + req.body.programId + ", " + req.body.userId + ")";

                // Execute query and return results
                models.sequelize.query(sql)
                    .then(function (rows) {
                        if (rows) {
                            callback(null, rows);
                        }
                    })
                    .catch(function(err) {
                        callback(err);
                    });
            }
        ],
        function(err, results){
            if (err) {
                res.sendError(err);
            } else {
                res.sendSuccess({
                    completedChallenges: results[0]
                });
            }
        });

};

module.exports = controller;
