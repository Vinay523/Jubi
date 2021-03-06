var services = require('../../services');

var async = require('async');
var Q = require('q');

module.exports = {
    up: function (migration, DataTypes) {
        return Q.Promise(function (resolve, reject) {
            async.series([
                    function (callback) {
                        migration.removeColumn('ChallengeResults', 'refTable')
                            .then(function(){ callback(); }).catch(callback);
                    },
                    function (callback) {
                        migration.removeColumn('UserChallengeMedia', 'refTable')
                            .then(function(){ callback(); }).catch(callback);
                    },
                    function (callback) {
                        migration.renameColumn('ChallengeResults', 'refId', 'userTodoId')
                            .then(function(){ callback(); }).catch(callback);
                    },
                    function (callback) {
                        migration.renameColumn('UserChallengeMedia', 'refId', 'userTodoId')
                            .then(function(){ callback(); }).catch(callback);
                    },
                    function (callback) {
                        migration.addIndex('ChallengeResults', ['userTodoId'])
                            .then(function () {
                                callback();
                            }).catch(callback);
                    },
                    function (callback) {
                        migration.addIndex('UserChallengeMedia', ['userTodoId'])
                            .then(function () {
                                callback();
                            }).catch(callback);
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
