var models = require('../../jubi.api/models');
models.sequelize.logging = function(str) {};

var moment = require('moment');
var Q = require('q');
var async = require('async');


// Stats job object
function StatsJob() {
    var self = this;

    self.name = 'StatsJob';
    self.nextRun = 0;
}


// Job entry point
StatsJob.prototype.run = function() {
    var self = this;

    return Q.Promise(function(resolve, reject) {
        try {
            // Time to run?
            if (moment().valueOf() < self.nextRun) return resolve();

            // Set next run time for tomorrow at 2am.
            var nextRun = moment(2, 'HH').add(1, 'days');
            logger.debug('Setting %s service to run next at ' + nextRun.format(), self.name);
            self.nextRun = nextRun;

            logger.debug('%s running...', self.name);

            // ************************************************************************************
            // Iterate through Intraday tables.  For each record, add / update the record in the
            // main fact table, then delete the record from the Intraday table.
            // ************************************************************************************

            // Table:   FactProgramUserStatsIntraday
            models.FactProgramUserStatsIntraday.findAll()
                .then(function(stats) {
                    if (stats.length <= 0) {
                        logger.debug('No records found in FactProgramUserStatsIntraday.');

                        // Set the next run time
                        self.nextRun = nextRun;
                        return resolve();
                    }

                    logger.info('%s records found in FactProgramUserStatsIntraday...', stats.length);

                    async.eachSeries(stats,
                        function(stat, callback) {
                            logger.debug('Moving FactProgramUserStatsIntraday Id = ' + stat.id);

                            try {
                                models.FactProgramUserStats.find({
                                    where: {
                                        programLinkId: stat.programLinkId,
                                        userId: stat.userId,
                                        dimDateId: stat.dimDateId
                                    }
                                })
                                    .then(function (fact) {
                                        if (!fact) {
                                            // Build new record
                                            fact = models.FactProgramUserStats.build({
                                                programLinkId: stat.programLinkId,
                                                userId: stat.userId,
                                                dimDateId: stat.dimDateId
                                            });
                                        }

                                        // Update columns and save
                                        fact.levelsCompletedCount += stat.levelsCompletedCount;
                                        fact.levelsCompletedPoints += stat.levelsCompletedPoints;
                                        fact.questsCompletedCount += stat.questsCompletedCount;
                                        fact.questsCompletedPoints += stat.questsCompletedPoints;
                                        fact.challengesCompletedCount += stat.challengesCompletedCount;
                                        fact.challengesCompletedPoints += stat.challengesCompletedPoints;
                                        fact.challenges1stAttemptCorrectCount += stat.challenges1stAttemptCorrectCount;
                                        fact.todosCompletedCount += stat.todosCompletedCount;
                                        fact.todosCompletedPoints += stat.todosCompletedPoints;
                                        fact.totalBasePoints += stat.totalBasePoints;
                                        fact.badgesEarnedCount += stat.badgesEarnedCount;

                                        // Save the updated fact table record and remove the intraday record.
                                        // *NOTE:  Encase all in a transaction in case of failure.
                                        models.sequelize.transaction().then(function(t) {
                                            fact
                                                .save({transaction: t})
                                                .then(function () {
                                                    stat.destroy({transaction: t})
                                                        .catch(function (err) {
                                                            t.rollback();
                                                            callback(err);
                                                        });
                                                    t.commit();
                                                })
                                                .catch(function (err) {
                                                    t.rollback();
                                                    callback(err);
                                                });
                                        });

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

                            callback();
                        },
                        function(err) {
                            if (err) {
                                logger.error(err);
                                return reject(err);
                            }
                            return resolve();
                        });
                });

            // Table:   FactProgramUserCompletedItemsIntraday
            models.FactProgramUserCompletedItemsIntraday.findAll()
                .then(function(items) {
                    if (items.length <= 0) {
                        logger.debug('No records found in FactProgramUserCompletedItemsIntraday.');

                        // Set the next run time
                        self.nextRun = nextRun;
                        return resolve();
                    }

                    logger.debug('%s records found in FactProgramUserCompletedItemsIntraday...', items.length);

                    async.eachSeries(items,
                        function(item, callback) {
                            logger.debug('Moving FactProgramUserCompletedItemsIntraday Id = ' + item.id);

                            try {
                                models.FactProgramUserCompletedItems.find({
                                        where: {
                                            programLinkId: item.programLinkId,
                                            userId: item.userId,
                                            dimDateId: item.dimDateId
                                        }
                                    })
                                    .then(function (fact) {
                                        if (!fact) {
                                            // Build new record
                                            fact = models.FactProgramUserCompletedItems.build({
                                                programLinkId: item.programLinkId,
                                                userId: item.userId,
                                                dimDateId: item.dimDateId
                                            });
                                        }

                                        // Update columns and save
                                        fact.levelLastCompleted = item.levelLastCompleted;
                                        fact.questLastCompleted = item.questLastCompleted;
                                        fact.challengeLastCompleted = item.challengeLastCompleted;
                                        fact.todoLastCompleted = item.todoLastCompleted;
                                        fact.badgeLastEarned = item.badgeLastEarned;

                                        // Save the updated fact table record and remove the intraday record.
                                        // *NOTE:  Encase all in a transaction in case of failure.
                                        models.sequelize.transaction().then(function(t) {
                                            fact
                                                .save({transaction: t})
                                                .then(function () {
                                                    item.destroy({transaction: t})
                                                        .catch(function (err) {
                                                            t.rollback();
                                                            callback(err);
                                                        });
                                                    t.commit();
                                                })
                                                .catch(function (err) {
                                                    t.rollback();
                                                    callback(err);
                                                });
                                        });

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

                            callback();
                        },
                        function(err) {
                            if (err) {
                                logger.error(err);
                                return reject(err);
                            }
                            return resolve();
                        });
                });

        }
        catch (err) {
            logger.error(err);
            reject(err);
        }

    });
};

// Export the job object
module.exports = StatsJob;