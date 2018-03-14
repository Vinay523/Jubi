

var services = require('../../services');

var async = require('async');
var Q = require('q');

module.exports = {
    up: function(migration, DataTypes) {

        return Q.Promise(function(resolve, reject) {
            async.series([

                    function(callback) {
                        migration.createTable('Communications', {
                            id: {
                                type: DataTypes.INTEGER,
                                primaryKey: true,
                                autoIncrement: true
                            },
                            status: {
                                type: DataTypes.ENUM('ok', 'error'),
                                defaultValue: 'ok'
                            },
                            ref: DataTypes.STRING(50),
                            refId: DataTypes.INTEGER,
                            message: DataTypes.STRING(1000),
                            createdAt: DataTypes.DATE,
                            updatedAt: DataTypes.DATE
                        }).then(function() { callback(); }).catch(callback);
                    },
                    function(callback) {
                        migration.addIndex('Communications', ['status'])
                            .then(function(){ callback(); }).catch(callback)
                    },
                    function(callback) {
                        migration.addIndex('Communications', ['ref', 'refId'])
                            .then(function(){ callback(); }).catch(callback)
                    }
                ],
                function(err) {
                    if (err) return services.helpers.handleReject(err, reject);
                    resolve();
                });
        });

    },
    down: function(migration) {

        return Q.Promise(function(resolve, reject) {
            migration.dropTable('Communications')
                .then(function(){ resolve(); })
                .catch(function(err) {services.helpers.handleReject(err, reject); });
        });
    }
};