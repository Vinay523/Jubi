var services = require('../../services');

var async = require('async');
var Q = require('q');

module.exports = {
    up: function (migration, DataTypes) {
        return Q.Promise(function (resolve, reject) {
            async.series([
                    function (callback) {
                        migration.addColumn(
                            'Todos',
                            'publishedAt',
                            {
                                type: DataTypes.DATE,
                                allowNull: true
                            }
                        ).then(function () {
                                callback();
                            })
                            .catch(callback)
                    },
                    function (callback) {
                        migration.addColumn(
                            'Badges',
                            'publishedAt',
                            {
                                type: DataTypes.DATE,
                                allowNull: true
                            }
                        ).then(function () {
                                callback();
                            })
                            .catch(callback)
                    },
                    function (callback) {
                        migration.addColumn(
                            'Badges',
                            'slug',
                            {
                                type: DataTypes.STRING(255),
                                allowNull: true
                            }
                        ).then(function () {
                                callback();
                            })
                            .catch(callback)
                    },
                    function (callback) {
                        migration.addColumn(
                            'Todos',
                            'slug',
                            {
                                type: DataTypes.STRING(255),
                                allowNull: true
                            }
                        ).then(function () {
                                callback();
                            })
                            .catch(callback)
                    },
                    function (callback) {
                        migration.addColumn(
                            'Quests',
                            'slug',
                            {
                                type: DataTypes.STRING(255),
                                allowNull: true
                            }
                        ).then(function () {
                                callback();
                            })
                            .catch(callback)
                    },
                    function (callback) {
                        migration.addColumn(
                            'Challenges',
                            'slug',
                            {
                                type: DataTypes.STRING(255),
                                allowNull: true
                            }
                        ).then(function () {
                                callback();
                            })
                            .catch(callback)
                    },
                    function (callback) {
                        migration.addColumn(
                            'Levels',
                            'slug',
                            {
                                type: DataTypes.STRING(255),
                                allowNull: true
                            }
                        ).then(function () {
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
};/**
 * Created by josh.matthews on 8/30/16.
 */
