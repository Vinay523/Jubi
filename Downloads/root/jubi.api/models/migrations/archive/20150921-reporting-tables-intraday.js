var app = require('../../../app');
var models = require('../../index')(app);
var services = require('../../../services/index');

var async = require('async');
var Q = require('q');

module.exports = {
    up: function (migration, DataTypes) {
        return Q.Promise(function (resolve, reject) {
            async.series([

                    /* Table FactProgramUserCompletedItemsIntraday */
                    function (callback) {
                        migration.createTable('FactProgramUserCompletedItemsIntraday', {
                            id: {
                                type: DataTypes.INTEGER,
                                primaryKey: true,
                                autoIncrement: true
                            },
                            levelLastCompleted: {
                                type: DataTypes.INTEGER,
                                allowNull: true,
                            },
                            questLastCompleted: {
                                type: DataTypes.INTEGER,
                                allowNull: true,
                            },
                            challengeLastCompleted: {
                                type: DataTypes.INTEGER,
                                allowNull: true,
                            },
                            todoLastCompleted: {
                                type: DataTypes.INTEGER,
                                allowNull: true,
                            },
                            programLinkId: DataTypes.INTEGER,
                            userId: {
                                type: DataTypes.INTEGER,
                                references: {
                                    model: 'Users',
                                    key: 'id'
                                },
                                onUpdate: 'CASCADE',
                                onDelete: 'CASCADE'
                            },
                            dimDateId: {
                                type: DataTypes.INTEGER,
                                references: {
                                    model: 'DimDates',
                                    key: 'id'
                                },
                                onUpdate: 'CASCADE',
                                onDelete: 'CASCADE'
                            },
                            createdAt: DataTypes.DATE,
                            updatedAt: DataTypes.DATE
                        }).then(function () { callback(); }).catch(callback);
                    },

                    /* Table FactProgramUserStatsIntraday */
                    function (callback) {
                        migration.createTable('FactProgramUserStatsIntraday', {
                            id: {
                                type: DataTypes.INTEGER,
                                primaryKey: true,
                                autoIncrement: true
                            },
                            levelsCompletedCount: {
                                type: DataTypes.INTEGER,
                                allowNull: false,
                                defaultValue: 0
                            },
                            levelsCompletedPoints: {
                                type: DataTypes.INTEGER,
                                allowNull: false,
                                defaultValue: 0
                            },
                            questsCompletedCount: {
                                type: DataTypes.INTEGER,
                                allowNull: false,
                                defaultValue: 0
                            },
                            questsCompletedPoints: {
                                type: DataTypes.INTEGER,
                                allowNull: false,
                                defaultValue: 0
                            },
                            challengesCompletedCount: {
                                type: DataTypes.INTEGER,
                                allowNull: false,
                                defaultValue: 0
                            },
                            challengesCompletedPoints: {
                                type: DataTypes.INTEGER,
                                allowNull: false,
                                defaultValue: 0
                            },
                            challenges1stAttemptCorrectCount: {
                                type: DataTypes.INTEGER,
                                allowNull: false,
                                defaultValue: 0
                            },
                            todosCompletedCount: {
                                type: DataTypes.INTEGER,
                                allowNull: false,
                                defaultValue: 0
                            },
                            todosCompletedPoints: {
                                type: DataTypes.INTEGER,
                                allowNull: false,
                                defaultValue: 0
                            },
                            totalBasePoints: {
                                type: DataTypes.INTEGER,
                                allowNull: false,
                                defaultValue: 0
                            },
                            programLinkId: DataTypes.INTEGER,
                            userId: {
                                type: DataTypes.INTEGER,
                                references: {
                                    model: 'Users',
                                    key: 'id'
                                },
                                onUpdate: 'CASCADE',
                                onDelete: 'CASCADE'
                            },
                            dimDateId: {
                                type: DataTypes.INTEGER,
                                references: {
                                    model: 'DimDates',
                                    key: 'id'
                                },
                                onUpdate: 'CASCADE',
                                onDelete: 'CASCADE'
                            },
                            createdAt: DataTypes.DATE,
                            updatedAt: DataTypes.DATE
                        }).then(function () { callback(); }).catch(callback);
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