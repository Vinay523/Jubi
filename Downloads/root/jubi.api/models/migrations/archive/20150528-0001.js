

var services = require('../../services');

var async = require('async');
var Q = require('q');

module.exports = {
    up: function (migration, DataTypes) {

        return Q.Promise(function (resolve, reject) {
            async.series([

                    function (callback) {
                        migration.changeColumn(
                            'Levels',
                            'sequence',
                            {
                                type: DataTypes.INTEGER,
                                allowNull: false
                            }
                        ).then(function() { callback(); }).catch(callback);
                    },
                    function (callback) {
                        migration.addColumn(
                            'Levels',
                            'sequencingTypeId', {
                                type: DataTypes.INTEGER,
                                allowNull: false
                            }).then(function() { callback(); }).catch(callback);
                    },
                    function (callback) {
                        migration.dropTable('QuestBadges')
                            .then(function () {
                                callback();
                            }).catch(callback);
                    },
                    function (callback) {
                        migration.dropTable('LevelQuests')
                            .then(function () {
                                callback();
                            }).catch(callback);
                    },
                    function (callback) {
                        migration.dropTable('QuestTodos')
                            .then(function () {
                                callback();
                            }).catch(callback);
                    },
                    function (callback) {
                        migration.createTable('SequencingTypes', {
                            id: {
                                type: DataTypes.INTEGER,
                                primaryKey: true,
                                autoIncrement: false
                            },
                            title: {
                                type: DataTypes.STRING(100),
                                allowNull: false
                            },
                            createdAt: DataTypes.DATE,
                            updatedAt: DataTypes.DATE
                        }).then(function () {
                            callback();
                        }).catch(callback);
                    },
                    function (callback) {
                        migration.addIndex('SequencingTypes', ['title'])
                            .then(function () {
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
            async.series([
                function (callback) {
                    migration.dropTable('SequencingTypes')
                        .then(function(){ callback(); })
                        .catch(function(err) {services.helpers.handleReject(err, callback); });
                },
                function (callback) {
                    migration.changeColumn(
                        'Levels',
                        'sequence',
                        {
                            type: DataTypes.INTEGER
                        }
                    ).then(function () {
                            callback();
                        }).catch(callback);
                },
                function (callback) {
                    migration.removeColumn('Levels', 'sequencingTypeId')
                        .then(function () {
                            callback();
                        }).catch(callback);
                }
            ])
        });
    }
};