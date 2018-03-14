

var services = require('../../services');

var async = require('async');
var Q = require('q');

module.exports = {
    up: function (migration, DataTypes) {
        return Q.Promise(function (resolve, reject) {
            async.series([
                    function (callback) {
                        migration.createTable('Todos', {
                            id: {
                                type: DataTypes.INTEGER,
                                primaryKey: true,
                                autoIncrement: false
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
                                autoIncrement: false
                            },
                            badgeId: {
                                type: DataTypes.INTEGER,
                                references: {
                                    model: 'Badges',
                                    key: 'id'
                                }
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
                                autoIncrement: false
                            },
                            todoId: {
                                type: DataTypes.INTEGER,
                                references: {
                                    model: 'Todos',
                                    key: 'id'
                                }
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
                                autoIncrement: false
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
                                }
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
                                autoIncrement: false
                            },
                            userId: {
                                type: DataTypes.INTEGER,
                                allowNull: false
                            },
                            fulfilled: {
                                type:       DataTypes.BOOLEAN,
                                allowNull:  false
                            },
                            userBadgeId: {
                                type: DataTypes.INTEGER,
                                references: {
                                    model: 'UserBadges',
                                    key: 'id'
                                }
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
                                autoIncrement: false
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
                                }
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
                                autoIncrement: false
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
                                }
                            },
                            createdAt: DataTypes.DATE,
                            updatedAt: DataTypes.DATE
                        }).then(function(){
                            callback();
                        }).catch(callback);
                    },
                    function(callback) {
                        migration.addColumn(
                            'Badges',
                            'programId', {
                                type: DataTypes.INTEGER
                            }).then(function() {
                                callback();
                            })
                            .catch(callback)
                    },
                    function (callback) {
                        migration.addIndex('Badges', ['programId']).then(function(){
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