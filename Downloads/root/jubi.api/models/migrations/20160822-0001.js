var services = require('../../services');

var async = require('async');
var Q = require('q');

module.exports = {
    up: function (migration, DataTypes) {
        return Q.Promise(function (resolve, reject) {
            async.series([
                    function (callback) {
                        migration.addColumn(
                            'Quests',
                            'publishedAt',
                            {
                                type: DataTypes.DATE,
                                allowNull: true
                            }
                        ).then(function () {
                                callback();
                            })
                            .catch(callback)
                    },
                    function (callback) {
                        migration.addColumn(
                            'Programs',
                            'cancelMigrateResultsOnPublish',
                            {
                                type: DataTypes.BOOLEAN,
                                allowNull: false,
                                defaultValue: false
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