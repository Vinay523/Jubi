

var services = require('../../services');

var async = require('async');
var Q = require('q');

module.exports = {
    up: function (migration, DataTypes) {

        return Q.Promise(function (resolve, reject) {
            async.series([
                    function (callback) {
                        migration.addColumn(
                        'Users',
                            'tempToken', {
                                type: DataTypes.STRING(150)
                            }).then(function() {
                                callback();
                            })
                            .catch(callback)
                    },
                    function (callback) {
                        migration.addIndex('Users', ['tempToken'])
                            .then(function() {
                                callback();
                            }).catch(callback)
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
            migration.removeIndex('Users', 'tempToken')
                .then(function() {
                    migration.removeColumn('Users', 'tempToken')
                        .then(function() {resolve();})
                        .catch(function(err){services.helpers.handleReject(err, reject);});
                })
                .catch(function(err){services.helpers.handleReject(err, reject);});

        });
    }
};