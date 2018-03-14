var app = require('../../../app');
var models = require('../../index')(app);
var services = require('../../../services/index');

var async = require('async');
var Q = require('q');

module.exports = {
    up: function (migration, DataTypes) {
        return Q.Promise(function (resolve, reject) {
            async.series([
                    // Add Badges Earned Count column
                    function (callback) {
                        migration.addColumn(
                            'Forums',
                            'newTopicPointsMax',
                            {
                                type: DataTypes.INTEGER
                            }
                        ).then(function () {
                                callback();
                            })
                            .catch(callback)
                    },

                    function (callback) {
                        migration.addColumn(
                            'Forums',
                            'newCommentPointsMax',
                            {
                                type: DataTypes.INTEGER
                            }
                        ).then(function () {
                                callback();
                            })
                            .catch(callback)
                    },

                    function (callback) {
                        migration.addColumn(
                            'Forums',
                            'likePointsMax',
                            {
                                type: DataTypes.INTEGER
                            }
                        ).then(function () {
                                callback();
                            })
                            .catch(callback)
                    },

                    function (callback) {
                        migration.addColumn(
                            'Forums',
                            'topicCommentPointsMax',
                            {
                                type: DataTypes.INTEGER
                            }
                        ).then(function () {
                                callback();
                            })
                            .catch(callback)
                    },

                    function (callback) {
                        migration.addColumn(
                            'Forums',
                            'itemLikePointsMax',
                            {
                                type: DataTypes.INTEGER
                            }
                        ).then(function () {
                                callback();
                            })
                            .catch(callback)
                    },

                    function (callback) {
                        migration.addColumn(
                            'Forums',
                            'newEncouragePoints',
                            {
                                type: DataTypes.INTEGER
                            }
                        ).then(function () {
                                callback();
                            })
                            .catch(callback)
                    },

                    function (callback) {
                        migration.addColumn(
                            'Forums',
                            'newAppreciatePoints',
                            {
                                type: DataTypes.INTEGER
                            }
                        ).then(function () {
                                callback();
                            })
                            .catch(callback)
                    },

                    function (callback) {
                        migration.addColumn(
                            'Forums',
                            'newStoryPoints',
                            {
                                type: DataTypes.INTEGER
                            }
                        ).then(function () {
                                callback();
                            })
                            .catch(callback)
                    },

                    function (callback) {
                        migration.addColumn(
                            'Forums',
                            'newEncouragePointsMax',
                            {
                                type: DataTypes.INTEGER
                            }
                        ).then(function () {
                                callback();
                            })
                            .catch(callback)
                    },

                    function (callback) {
                        migration.addColumn(
                            'Forums',
                            'newAppreciatePointsMax',
                            {
                                type: DataTypes.INTEGER
                            }
                        ).then(function () {
                                callback();
                            })
                            .catch(callback)
                    },

                    function (callback) {
                        migration.addColumn(
                            'Forums',
                            'newStoryPointsMax',
                            {
                                type: DataTypes.INTEGER
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
};