

var services = require('../../services');

var async = require('async');
var Q = require('q');

module.exports = {
    up: function (migration, DataTypes) {
        return Q.Promise(function (resolve, reject) {
            async.series([
                    function (callback) {
                        migration.dropTable('UserTodoRequirementsFulfillments')
                            .then(function () {
                                callback();
                            }).catch(callback);
                    },
                    function (callback) {
                        migration.dropTable('UserBadgeRequirementsFulfillments')
                            .then(function () {
                                callback();
                            }).catch(callback);
                    },
                    function (callback) {
                        migration.dropTable('UserTodos')
                            .then(function () {
                                callback();
                            }).catch(callback);
                    },
                    function (callback) {
                        migration.dropTable('UserBadges')
                            .then(function () {
                                callback();
                            }).catch(callback);
                    },
                    function (callback) {
                        migration.createTable('UserBadges', {
                            id: {
                                type: DataTypes.INTEGER,
                                primaryKey: true,
                                autoIncrement: true
                            },
                            badgeId: {
                                type: DataTypes.INTEGER,
                                references: {
                                    model: 'Badges',
                                    key: 'id'
                                },
                                onUpdate: 'CASCADE',
                                onDelete: 'CASCADE'
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
                            earned: {
                                type: DataTypes.BOOLEAN
                            },
                            createdAt: DataTypes.DATE,
                            updatedAt: DataTypes.DATE
                        }).then(function(){
                            callback();
                        }).catch(callback);
                    },
                    function (callback) {
                        migration.createTable('UserTodos', {
                            id: {
                                type: DataTypes.INTEGER,
                                primaryKey: true,
                                autoIncrement: true
                            },
                            todoId: {
                                type: DataTypes.INTEGER,
                                references: {
                                    model: 'Todos',
                                    key: 'id'
                                },
                                onUpdate: 'CASCADE',
                                onDelete: 'CASCADE'
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
                            unlocked: {
                                type: DataTypes.BOOLEAN
                            },
                            createdAt: DataTypes.DATE,
                            updatedAt: DataTypes.DATE
                        }).then(function(){
                            callback();
                        }).catch(callback);
                    },
                    function (callback) {
                        migration.createTable('UserBadgeRequirementsFulfillments', {
                            id: {
                                type: DataTypes.INTEGER,
                                primaryKey: true,
                                autoIncrement: true
                            },
                            fulfilled: {
                                type: DataTypes.BOOLEAN,
                                allowNull: false
                            },
                            userBadgeId: {
                                type: DataTypes.INTEGER,
                                references: {
                                    model: 'UserBadges',
                                    key: 'id'
                                },
                                onUpdate: 'CASCADE',
                                onDelete: 'CASCADE'
                            },
                            badgeRequirementId:{
                                type: DataTypes.INTEGER,
                                references: {
                                    model: 'BadgeRequirements',
                                    key: 'id'
                                },
                                onUpdate: 'CASCADE',
                                onDelete: 'CASCADE'
                            },
                            createdAt: DataTypes.DATE,
                            updatedAt: DataTypes.DATE
                        }).then(function(){
                            callback();
                        }).catch(callback);
                    },
                    function (callback) {
                        migration.createTable('UserTodoRequirementsFulfillments', {
                            id: {
                                type: DataTypes.INTEGER,
                                primaryKey: true,
                                autoIncrement: true
                            },
                            fulfilled: {
                                type:       DataTypes.BOOLEAN,
                                allowNull:  false
                            },
                            userTodoId: {
                                type: DataTypes.INTEGER,
                                references: {
                                    model: 'UserTodos',
                                    key: 'id'
                                },
                                onUpdate: 'CASCADE',
                                onDelete: 'CASCADE'
                            },
                            todoRequirementId:{
                                type: DataTypes.INTEGER,
                                references: {
                                    model: 'TodoRequirements',
                                    key: 'id'
                                },
                                onUpdate: 'CASCADE',
                                onDelete: 'CASCADE'
                            },
                            createdAt: DataTypes.DATE,
                            updatedAt: DataTypes.DATE
                        }).then(function(){
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