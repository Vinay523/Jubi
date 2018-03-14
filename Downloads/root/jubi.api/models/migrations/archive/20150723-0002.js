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
                        migration.addColumn('Forums', 'topicCommentPoints', DataTypes.INTEGER)
                            .then(function () {
                                callback();
                            }).catch(callback);
                    },
                    function (callback) {
                        migration.addColumn('Forums', 'itemLikePoints', DataTypes.INTEGER)
                            .then(function () {
                                callback();
                            }).catch(callback);
                    },
                    function (callback) {
                        migration.addColumn('ForumItems', 'pointsUserId', {
                            type: DataTypes.INTEGER,
                            references: {
                                model: 'Users',
                                key: 'id'
                            }
                        })
                            .then(function () {
                                callback();
                            }).catch(callback);
                    },
                    function (callback) {
                        migration.addColumn('ForumItemLikes', 'pointsUserId', {
                            type: DataTypes.INTEGER,
                            references: {
                                model: 'Users',
                                key: 'id'
                            }
                        })
                            .then(function () {
                                callback();
                            }).catch(callback);
                    },

                    function (callback) {
                        migration.addColumn('ForumItemDislikes', 'pointsUserId', {
                            type: DataTypes.INTEGER,
                            references: {
                                model: 'Users',
                                key: 'id'
                            }
                        })
                            .then(function () {
                                callback();
                            }).catch(callback);
                    },
                    function (callback) {
                        var sql = "ALTER TABLE `jubi`.`Forums` DROP FOREIGN KEY `Forums_ibfk_1`";
                        migration.sequelize.query(sql, {
                            type: migration.sequelize.QueryTypes.RAW
                        }).then(function () {
                            callback();
                        }).catch(callback)
                    },
                    function (callback) {
                        migration.removeColumn('Forums', 'programId')
                            .then(function () {
                                callback();
                            }).catch(callback);
                    },
                    function (callback) {
                        migration.addColumn('Forums', 'linkId', {
                            type: DataTypes.INTEGER,
                            allowNull: false
                        })
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

        });
    }
};