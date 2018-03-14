var app = require('../../../app');
var models = require('../../index')(app);
var services = require('../../../services/index');

var async = require('async');
var Q = require('q');

module.exports = {
    up: function (migration, DataTypes) {
        return Q.Promise(function (resolve, reject) {
            async.series([
                    // Add Badges Earned Count column
                    function (callback) {
                        migration.addColumn(
                            'FactProgramUserStats',
                            'badgesEarnedCount',
                            {
                                type: DataTypes.INTEGER,
                                allowNull: false,
                                defaultValue: 0
                            }
                        ).then(function () {
                                callback();
                            })
                            .catch(callback)
                    },

                    function (callback) {
                        migration.addColumn(
                            'FactProgramUserStatsIntraday',
                            'badgesEarnedCount',
                            {
                                type: DataTypes.INTEGER,
                                allowNull: false,
                                defaultValue: 0
                            }
                        ).then(function () {
                                callback();
                            })
                            .catch(callback)
                    },

                    // Add Last Badge Earned column
                    function (callback) {
                        migration.addColumn(
                            'FactProgramUserCompletedItems',
                            'badgeLastEarned',
                            {
                                type: DataTypes.INTEGER,
                                allowNull: true,
                            }
                        ).then(function () {
                                callback();
                            })
                            .catch(callback)
                    },

                    function (callback) {
                        migration.addColumn(
                            'FactProgramUserCompletedItemsIntraday',
                            'badgeLastEarned',
                            {
                                type: DataTypes.INTEGER,
                                allowNull: true,
                            }
                        ).then(function () {
                                callback();
                            })
                            .catch(callback)
                    }
                ],
                function (err) {
                    if (err) return services.helpers.handleReject(err, reject);
                    resolve();
                });
        });
    },
    down: function (migration) {
        return Q.Promise(function (resolve, reject) {

        });
    }
};