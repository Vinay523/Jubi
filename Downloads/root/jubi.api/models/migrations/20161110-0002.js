/**
 * Created by josh.matthews on 9/16/16.
 */
var services = require('../../services');

var async = require('async');
var Q = require('q');

module.exports = {
    up: function (migration, DataTypes) {
        return Q.Promise(function (resolve, reject) {
            async.series([
                    function (callback) {
                        migration.createTable('ssoSession', {
                            id: {
                                type: DataTypes.INTEGER,
                                primaryKey: true,
                                autoIncrement: true
                            },
                            userId: {
                                type: DataTypes.INTEGER,
                                references: {
                                    model: 'Users',
                                    key: 'id'
                                },
                                onUpdate: 'CASCADE',
                                onDelete: 'CASCADE'
                            },
                            providerId: {
                                type: DataTypes.INTEGER,
                                references: {
                                    model: 'ssoProviders',
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
};/**
 * Created by josh.matthews on 8/30/16.
 */
