var app = require('../../../app');
var models = require('../../index')(app);
var services = require('../../../services/index');

var async = require('async');
var Q = require('q');

module.exports = {
    up: function (migration, DataTypes) {
        return Q.Promise(function (resolve, reject) {
            async.series([

                    /* Table FactProgramUserCompletedItems */
                    function (callback) {
                        migration.changeColumn(
                            'FactProgramUserCompletedItems',
                            'levelLastCompleted',
                            {
                                type: DataTypes.INTEGER,
                                allowNull: true,
                            }
                        ).then(function () {
                                callback();
                            })
                            .catch(callback)
                    },
                    function (callback) {
                        migration.changeColumn(
                            'FactProgramUserCompletedItems',
                            'questLastCompleted',
                            {
                                type: DataTypes.INTEGER,
                                allowNull: true,
                            }
                        ).then(function () {
                                callback();
                            })
                            .catch(callback)
                    },
                    function (callback) {
                        migration.changeColumn(
                            'FactProgramUserCompletedItems',
                            'challengeLastCompleted',
                            {
                                type: DataTypes.INTEGER,
                                allowNull: true,
                            }
                        ).then(function () {
                                callback();
                            })
                            .catch(callback)
                    },
                    function (callback) {
                        migration.changeColumn(
                            'FactProgramUserCompletedItems',
                            'todoLastCompleted',
                            {
                                type: DataTypes.INTEGER,
                                allowNull: true,
                            }
                        ).then(function () {
                                callback();
                            })
                            .catch(callback)
                    },

                    /* Table FactProgramUserStats */
                    function (callback) {
                        migration.changeColumn(
                            'FactProgramUserStats',
                            'levelsCompletedCount',
                            {
                                type: DataTypes.INTEGER,
                                allowNull: false,
                                defaultValue: 0
                            }
                        ).then(function () {
                                callback();
                            })
                            .catch(callback)
                    },
                    function (callback) {
                        migration.changeColumn(
                            'FactProgramUserStats',
                            'levelsCompletedPoints',
                            {
                                type: DataTypes.INTEGER,
                                allowNull: false,
                                defaultValue: 0
                            }
                        ).then(function () {
                                callback();
                            })
                            .catch(callback)
                    },
                    function (callback) {
                        migration.changeColumn(
                            'FactProgramUserStats',
                            'questsCompletedCount',
                            {
                                type: DataTypes.INTEGER,
                                allowNull: false,
                                defaultValue: 0
                            }
                        ).then(function () {
                                callback();
                            })
                            .catch(callback)
                    },
                    function (callback) {
                        migration.changeColumn(
                            'FactProgramUserStats',
                            'questsCompletedPoints',
                            {
                                type: DataTypes.INTEGER,
                                allowNull: false,
                                defaultValue: 0
                            }
                        ).then(function () {
                                callback();
                            })
                            .catch(callback)
                    },
                    function (callback) {
                        migration.changeColumn(
                            'FactProgramUserStats',
                            'challengesCompletedCount',
                            {
                                type: DataTypes.INTEGER,
                                allowNull: false,
                                defaultValue: 0
                            }
                        ).then(function () {
                                callback();
                            })
                            .catch(callback)
                    },
                    function (callback) {
                        migration.changeColumn(
                            'FactProgramUserStats',
                            'challengesCompletedPoints',
                            {
                                type: DataTypes.INTEGER,
                                allowNull: false,
                                defaultValue: 0
                            }
                        ).then(function () {
                                callback();
                            })
                            .catch(callback)
                    },
                    function (callback) {
                        migration.changeColumn(
                            'FactProgramUserStats',
                            'challenges1stAttemptCorrectCount',
                            {
                                type: DataTypes.INTEGER,
                                allowNull: false,
                                defaultValue: 0
                            }
                        ).then(function () {
                                callback();
                            })
                            .catch(callback)
                    },
                    function (callback) {
                        migration.changeColumn(
                            'FactProgramUserStats',
                            'todosCompletedCount',
                            {
                                type: DataTypes.INTEGER,
                                allowNull: false,
                                defaultValue: 0
                            }
                        ).then(function () {
                                callback();
                            })
                            .catch(callback)
                    },
                    function (callback) {
                        migration.changeColumn(
                            'FactProgramUserStats',
                            'todosCompletedPoints',
                            {
                                type: DataTypes.INTEGER,
                                allowNull: false,
                                defaultValue: 0
                            }
                        ).then(function () {
                                callback();
                            })
                            .catch(callback)
                    },
                    function (callback) {
                        migration.changeColumn(
                            'FactProgramUserStats',
                            'totalBasePoints',
                            {
                                type: DataTypes.INTEGER,
                                allowNull: false,
                                defaultValue: 0
                            }
                        ).then(function () {
                                callback();
                            })
                            .catch(callback)
                    },

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