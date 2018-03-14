var app = require('../../../app');
var models = require('../../index')(app);
var services = require('../../../services/index');

var async = require('async');
var Q = require('q');

module.exports = {
    up: function (migration, DataTypes) {
        return Q.Promise(function (resolve, reject) {
            async.series([
                    function (callback) {
                        migration.createTable('Forums', {
                            id: {
                                type: DataTypes.INTEGER,
                                primaryKey: true,
                                autoIncrement: true
                            },
                            name: DataTypes.STRING(150),
                            newTopicPoints: DataTypes.INTEGER,
                            newCommentPoints: DataTypes.INTEGER,
                            likePoints: DataTypes.INTEGER,
                            programId: {
                                type: DataTypes.INTEGER,
                                references: {
                                    model: 'Programs',
                                    key: 'id'
                                },
                                onUpdate: 'CASCADE',
                                onDelete: 'CASCADE'
                            },
                            createdAt: DataTypes.DATE,
                            updatedAt: DataTypes.DATE
                        }).then(function () { callback(); }).catch(callback);
                    },
                    function (callback) {
                        migration.addIndex('Forums', ['name'])
                            .then(function(){ callback(); }).catch(callback);
                    },
                    function (callback) {
                        migration.addIndex('Forums', ['programId'])
                            .then(function(){ callback(); }).catch(callback);
                    },
                    function (callback) {
                        migration.addIndex('Forums', ['createdAt'])
                            .then(function(){ callback(); }).catch(callback);
                    },
                    function (callback) {
                        migration.addIndex('Forums', ['updatedAt'])
                            .then(function(){ callback(); }).catch(callback);
                    },




                    function (callback) {
                        migration.createTable('ForumItemCategories', {
                            id: {
                                type: DataTypes.INTEGER,
                                primaryKey: true,
                                autoIncrement: true
                            },
                            name: DataTypes.STRING(150),
                            description: DataTypes.STRING(1000),
                            forumId: {
                                type: DataTypes.INTEGER,
                                references: {
                                    model: 'Forums',
                                    key: 'id'
                                },
                                onUpdate: 'CASCADE',
                                onDelete: 'CASCADE'
                            },
                            createdAt: DataTypes.DATE,
                            updatedAt: DataTypes.DATE
                        }).then(function () { callback(); }).catch(callback);
                    },
                    function (callback) {
                        migration.addIndex('ForumItemCategories', ['name'])
                            .then(function(){ callback(); }).catch(callback);
                    },
                    function (callback) {
                        migration.addIndex('ForumItemCategories', ['createdAt'])
                            .then(function(){ callback(); }).catch(callback);
                    },
                    function (callback) {
                        migration.addIndex('ForumItemCategories', ['updatedAt'])
                            .then(function(){ callback(); }).catch(callback);
                    },
                    function (callback) {
                        migration.addIndex('ForumItemCategories', ['forumId'])
                            .then(function(){ callback(); }).catch(callback);
                    },

                    function (callback) {
                        migration.createTable('ForumItems', {
                            id: {
                                type: DataTypes.INTEGER,
                                primaryKey: true,
                                autoIncrement: true
                            },
                            type: {
                                type: DataTypes.ENUM('topic', 'comment'),
                                allowNull: false
                            },
                            title: DataTypes.STRING(150),
                            content: DataTypes.TEXT,
                            contentLink: DataTypes.STRING(150),
                            contentLinkType: DataTypes.ENUM('image', 'video', 'audio'),
                            parentId: {
                                type: DataTypes.INTEGER,
                                references: {
                                    model: 'ForumItems',
                                    key: 'id'
                                },
                                onUpdate: 'CASCADE',
                                onDelete: 'CASCADE'
                            },
                            forumId: {
                                type: DataTypes.INTEGER,
                                references: {
                                    model: 'Forums',
                                    key: 'id'
                                },
                                onUpdate: 'CASCADE',
                                onDelete: 'CASCADE'
                            },
                            questId: {
                                type: DataTypes.INTEGER,
                                references: {
                                    model: 'Quests',
                                    key: 'id'
                                },
                                onUpdate: 'CASCADE',
                                onDelete: 'CASCADE'
                            },
                            categoryId: {
                                type: DataTypes.INTEGER,
                                references: {
                                    model: 'ForumItemCategories',
                                    key: 'id'
                                },
                                onUpdate: 'CASCADE',
                                onDelete: 'CASCADE'
                            },
                            createdById: {
                                type: DataTypes.INTEGER,
                                references: {
                                    model: 'Users',
                                    key: 'id'
                                },
                                onUpdate: 'CASCADE',
                                onDelete: 'CASCADE'
                            },
                            createdAt: DataTypes.DATE,
                            updatedAt: DataTypes.DATE
                        }).then(function () { callback(); }).catch(callback);
                    },
                    function (callback) {
                        migration.addIndex('ForumItems', ['type'])
                            .then(function(){ callback(); }).catch(callback);
                    },
                    function (callback) {
                        migration.addIndex('ForumItems', ['title'])
                            .then(function(){ callback(); }).catch(callback);
                    },
                    function (callback) {
                        migration.addIndex('ForumItems', ['contentLinkType'])
                            .then(function(){ callback(); }).catch(callback);
                    },
                    function (callback) {
                        migration.addIndex('ForumItems', ['parentId'])
                            .then(function(){ callback(); }).catch(callback);
                    },
                    function (callback) {
                        migration.addIndex('ForumItems', ['forumId'])
                            .then(function(){ callback(); }).catch(callback);
                    },
                    function (callback) {
                        migration.addIndex('ForumItems', ['questId'])
                            .then(function(){ callback(); }).catch(callback);
                    },
                    function (callback) {
                        migration.addIndex('ForumItems', ['categoryId'])
                            .then(function(){ callback(); }).catch(callback);
                    },
                    function (callback) {
                        migration.addIndex('ForumItems', ['createdById'])
                            .then(function(){ callback(); }).catch(callback);
                    },
                    function (callback) {
                        migration.addIndex('ForumItems', ['createdAt'])
                            .then(function(){ callback(); }).catch(callback);
                    },
                    function (callback) {
                        migration.addIndex('ForumItems', ['updatedAt'])
                            .then(function(){ callback(); }).catch(callback);
                    },


                    function (callback) {
                        migration.createTable('ForumItemLikes', {
                            id: {
                                type: DataTypes.INTEGER,
                                primaryKey: true,
                                autoIncrement: true
                            },
                            forumItemId: {
                                type: DataTypes.INTEGER,
                                references: {
                                    model: 'ForumItems',
                                    key: 'id'
                                },
                                onUpdate: 'CASCADE',
                                onDelete: 'CASCADE'
                            },
                            createdById: {
                                type: DataTypes.INTEGER,
                                references: {
                                    model: 'Users',
                                    key: 'id'
                                },
                                onUpdate: 'CASCADE',
                                onDelete: 'CASCADE'
                            },
                            createdAt: DataTypes.DATE,
                            updatedAt: DataTypes.DATE
                        }).then(function () { callback(); }).catch(callback);
                    },
                    function (callback) {
                        migration.addIndex('ForumItemLikes', ['forumItemId'])
                            .then(function(){ callback(); }).catch(callback);
                    },
                    function (callback) {
                        migration.addIndex('ForumItemLikes', ['createdById'])
                            .then(function(){ callback(); }).catch(callback);
                    },
                    function (callback) {
                        migration.addIndex('ForumItemLikes', ['createdAt'])
                            .then(function(){ callback(); }).catch(callback);
                    },
                    function (callback) {
                        migration.addIndex('ForumItemLikes', ['updatedAt'])
                            .then(function(){ callback(); }).catch(callback);
                    },



                    function (callback) {
                        migration.createTable('ForumItemDislikes', {
                            id: {
                                type: DataTypes.INTEGER,
                                primaryKey: true,
                                autoIncrement: true
                            },
                            forumItemId: {
                                type: DataTypes.INTEGER,
                                references: {
                                    model: 'ForumItems',
                                    key: 'id'
                                },
                                onUpdate: 'CASCADE',
                                onDelete: 'CASCADE'
                            },
                            createdById: {
                                type: DataTypes.INTEGER,
                                references: {
                                    model: 'Users',
                                    key: 'id'
                                },
                                onUpdate: 'CASCADE',
                                onDelete: 'CASCADE'
                            },
                            createdAt: DataTypes.DATE,
                            updatedAt: DataTypes.DATE
                        }).then(function () { callback(); }).catch(callback);
                    },
                    function (callback) {
                        migration.addIndex('ForumItemDislikes', ['forumItemId'])
                            .then(function(){ callback(); }).catch(callback);
                    },
                    function (callback) {
                        migration.addIndex('ForumItemDislikes', ['createdById'])
                            .then(function(){ callback(); }).catch(callback);
                    },
                    function (callback) {
                        migration.addIndex('ForumItemDislikes', ['createdAt'])
                            .then(function(){ callback(); }).catch(callback);
                    },
                    function (callback) {
                        migration.addIndex('ForumItemDislikes', ['updatedAt'])
                            .then(function(){ callback(); }).catch(callback);
                    },



                    function (callback) {
                        migration.createTable('ForumUsers', {
                            id: {
                                type: DataTypes.INTEGER,
                                primaryKey: true,
                                autoIncrement: true
                            },
                            forumId: {
                                type: DataTypes.INTEGER,
                                references: {
                                    model: 'Forums',
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
                            createdAt: DataTypes.DATE,
                            updatedAt: DataTypes.DATE
                        }).then(function () { callback(); }).catch(callback);
                    },
                    function (callback) {
                        migration.addIndex('ForumUsers', ['forumId'])
                            .then(function(){ callback(); }).catch(callback);
                    },
                    function (callback) {
                        migration.addIndex('ForumUsers', ['userId'])
                            .then(function(){ callback(); }).catch(callback);
                    },
                    function (callback) {
                        migration.addIndex('ForumUsers', ['createdAt'])
                            .then(function(){ callback(); }).catch(callback);
                    },
                    function (callback) {
                        migration.addIndex('ForumUsers', ['updatedAt'])
                            .then(function(){ callback(); }).catch(callback);
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