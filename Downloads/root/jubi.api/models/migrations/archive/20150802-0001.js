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
                        migration.addColumn(
                            'Challenges',
                            'todoId', {
                                type: DataTypes.STRING(150),
                                references: {
                                    model: 'Todos',
                                    key: 'id'
                                },
                                onUpdate: 'CASCADE',
                                onDelete: 'CASCADE'
                            }).then(function () {
                                callback();
                            })
                            .catch(callback)
                    },
                    function (callback) {
                        migration.createTable('UserChallengeMedia', {
                            id: {
                                type: DataTypes.INTEGER,
                                primaryKey: true,
                                autoIncrement: true
                            },
                            type: {
                                type: DataTypes.ENUM('text', 'link', 'image', 'video', 'audio', 'resource'),
                                allowNull: false
                            },
                            status: {
                                type: DataTypes.ENUM('ready', 'encoding'),
                                defaultValue: 'ready'
                            },
                            source: DataTypes.STRING(50),
                            ref: DataTypes.STRING(50),
                            data: DataTypes.TEXT,
                            name: DataTypes.STRING(500),
                            description: DataTypes.STRING(5000),
                            coverUrl: DataTypes.STRING(200),
                            sourceDate: DataTypes.DATE,
                            sequence: DataTypes.INTEGER,
                            challengeId: {
                                type: DataTypes.INTEGER,
                                references: {
                                    model: 'Challenges',
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