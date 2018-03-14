var services = require('../../services');

var async = require('async');
var Q = require('q');

module.exports = {
    up: function (migration, DataTypes) {
        return Q.Promise(function (resolve, reject) {



            async.series([
                    function (callback) {
                        migration.removeIndex('Histories', 'histories_ref_ref_id').then(function () {
                            callback();
                        }).catch(callback);
                    },
                    function (callback) {
                        migration.removeColumn('Histories', 'ref').then(function () {
                            callback();
                        }).catch(callback);
                    },
                    function (callback) {
                        migration.renameColumn('Histories', 'refId', 'programId').then(function () {
                            callback();
                        }).catch(callback);
                    },
                    function (callback) {
                        migration.addIndex('Histories', ['programId'])
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
