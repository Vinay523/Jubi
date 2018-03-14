var services = require('../../services');

var async = require('async');
var Q = require('q');

module.exports = {
    up: function (migration, DataTypes) {
        return Q.Promise(function (resolve, reject) {
            async.series([
                    // Add Badges Earned Count column
                    function (callback) {
                        migration.removeColumn('UserTodos','BonusPoints')
                            .then(function () {
                                callback();
                            })
                            .catch(callback)
                    },
                    // Add Badges Earned Count column
                    function (callback) {
                        migration.removeColumn('ForumItems','BonusPoints')
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