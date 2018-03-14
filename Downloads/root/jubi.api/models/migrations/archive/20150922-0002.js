var app = require('../../../app');
var models = require('../../index')(app);
var services = require('../../../services/index');

var async = require('async');
var Q = require('q');

module.exports = {
    up: function (migration, DataTypes) {
        return Q.Promise(function (resolve, reject) {
            async.series([
                    /* Indexes for Reporting / Stats fact tables */
                    function (callback) {
                        migration.addIndex(
                            'FactProgramUserCompletedItems',
                            [
                                'programLinkId',
                                'userId',
                                'dimDateId'
                            ],
                            {
                                indexName: 'FactProgramUserCompletedItems_program_user_date'
                            }
                        )
                            .then(function () {
                                callback();
                            })
                            .catch(callback)
                    },
                    function (callback) {
                        migration.addIndex(
                            'FactProgramUserCompletedItemsIntraday',
                            [
                                'programLinkId',
                                'userId',
                                'dimDateId'
                            ],
                            {
                                indexName: 'FactProgramUserCompletedItemsIntraday_program_user_date'
                            }
                        )
                            .then(function () {
                                callback();
                            })
                            .catch(callback)
                    },
                    function (callback) {
                        migration.addIndex(
                            'FactProgramUserStats',
                            [
                                'programLinkId',
                                'userId',
                                'dimDateId'
                            ],
                            {
                                indexName: 'FactProgramUserStats_program_user_date'
                            }
                        )
                            .then(function () {
                                callback();
                            })
                            .catch(callback)
                    },
                    function (callback) {
                        migration.addIndex(
                            'FactProgramUserStatsIntraday',
                            [
                                'programLinkId',
                                'userId',
                                'dimDateId'
                            ],
                            {
                                indexName: 'FactProgramUserStatsIntraday_program_user_date'
                            }
                        )
                            .then(function () {
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