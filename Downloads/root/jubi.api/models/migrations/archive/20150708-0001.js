

var services = require('../../services');

var async = require('async');
var Q = require('q');

module.exports = {
    up: function (migration, DataTypes) {
        return Q.Promise(function (resolve, reject) {
            async.series([
                    function (callback) {
                        migration.createTable('ProgramLicenses', {
                            id: {
                                type: DataTypes.INTEGER,
                                primaryKey: true,
                                autoIncrement: true
                            },
                            type:{
                                type: DataTypes.ENUM('readOnly', 'edit'),
                                allowNull: false
                            },
                            linkId: {
                                type: DataTypes.INTEGER,
                                allowNull: false
                            },
                            licensedProgramId: {
                                type: DataTypes.INTEGER,
                                references: {
                                    model: 'Programs',
                                    key: 'id'
                                },
                                onUpdate: 'CASCADE',
                                onDelete: 'CASCADE'
                            },
                            seats: {
                                type: DataTypes.INTEGER,
                                allowNull: false
                            },
                            createdAt: DataTypes.DATE,
                            updatedAt: DataTypes.DATE,
                            deletedAt: DataTypes.DATE
                        }).then(function () {
                            callback();
                        }).catch(callback);
                    },
                    function (callback) {
                        migration.addColumn('Clients', 'seats', {
                            type: DataTypes.INTEGER,
                            allowNull: false,
                            defaultValue: 0
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