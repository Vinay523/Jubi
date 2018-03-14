

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
                        migration.dropTable('BadgeRequirements')
                            .then(function () {
                                callback();
                            }).catch(callback);
                    },
                    function (callback) {
                        migration.dropTable('TodoRequirements')
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
                        migration.dropTable('Todos')
                            .then(function () {
                                callback();
                            }).catch(callback);
                    },
                    function (callback) {
                        migration.createTable('Todos', {
                            id: {
                                type: DataTypes.INTEGER,
                                primaryKey: true,
                                autoIncrement: true
                            },
                            title: {
                                type:       DataTypes.STRING(100),
                                allowNull:  false
                            },
                            description:    DataTypes.STRING(1024),
                            createdAt: DataTypes.DATE,
                            updatedAt: DataTypes.DATE,
                            programId: {
                                type: DataTypes.INTEGER,
                                references: {
                                    model: 'Programs',
                                    key: 'id'
                                },
                                onUpdate: 'CASCADE',
                                onDelete: 'CASCADE'
                            }
                        }).then(function(){
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
                        migration.createTable('BadgeRequirements', {
                            id: {
                                type: DataTypes.INTEGER,
                                primaryKey: true,
                                autoIncrement: true
                            },
                            requirementRef: {
                                type: DataTypes.STRING(30),
                                allowNull: false
                            },
                            requirementRefId: {
                                type: DataTypes.INTEGER,
                                allowNull: false
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
                            userId: {
                                type: DataTypes.INTEGER,
                                allowNull: false
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
                            createdAt: DataTypes.DATE,
                            updatedAt: DataTypes.DATE
                        }).then(function(){
                            callback();
                        }).catch(callback);
                    },
                    function (callback) {
                        migration.createTable('TodoRequirements', {
                            id: {
                                type: DataTypes.INTEGER,
                                primaryKey: true,
                                autoIncrement: true
                            },
                            requirementRef: {
                                type: DataTypes.STRING(30),
                                allowNull: false
                            },
                            requirementRefId: {
                                type: DataTypes.INTEGER,
                                allowNull: false
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
                            userId: {
                                type: DataTypes.INTEGER,
                                allowNull: false
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