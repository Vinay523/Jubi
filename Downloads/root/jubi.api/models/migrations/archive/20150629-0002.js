

var services = require('../../services');

var async = require('async');
var Q = require('q');

module.exports = {
    up: function (migration, DataTypes) {
        return Q.Promise(function (resolve, reject) {
            async.series([
                    function (callback) {
                        migration.removeColumn('UserTodos', 'unlocked')
                            .then(function () {
                                callback();
                            })
                            .catch(callback)
                    },
                    function (callback) {
                        migration.addColumn('UserTodos', 'status', {
                                type: DataTypes.ENUM('locked', 'unlocked', 'submitted', 'verified', 'completed')
                            })
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