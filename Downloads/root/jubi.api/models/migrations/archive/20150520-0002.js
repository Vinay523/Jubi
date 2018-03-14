

var services = require('../../services');

var async = require('async');
var Q = require('q');

module.exports = {
    up: function(migration, DataTypes) {

        return Q.Promise(function(resolve, reject) {
            async.series([

                    function(callback) {
                        migration.createTable('Emails', {
                            id: {
                                type: DataTypes.INTEGER,
                                primaryKey: true,
                                autoIncrement: true
                            },
                            status: {
                                type: DataTypes.ENUM('new', 'sent', 'na'),
                                defaultValue: 'new'
                            },
                            subject: DataTypes.STRING(1000),
                            to: DataTypes.STRING(250),
                            cc: DataTypes.STRING(1000),
                            from: DataTypes.STRING(250),
                            html: DataTypes.TEXT,
                            text: DataTypes.TEXT,
                            createdAt: DataTypes.DATE,
                            updatedAt: DataTypes.DATE
                        }).then(function() { callback(); }).catch(callback);
                    },
                    function(callback) {
                        migration.addIndex('Emails', ['status'])
                            .then(function(){ callback(); }).catch(callback)
                    },
                    function(callback) {
                        migration.addIndex('Emails', ['to'])
                            .then(function(){ callback(); }).catch(callback)
                    },
                    function(callback) {
                        migration.addIndex('Emails', ['from'])
                            .then(function(){ callback(); }).catch(callback)
                    },
                    function(callback) {
                        migration.addIndex('Emails', ['updatedAt'])
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
            migration.dropTable('Emails')
                .then(function(){ resolve(); })
                .catch(function(err) {services.helpers.handleReject(err, reject); });
        });

    }
};