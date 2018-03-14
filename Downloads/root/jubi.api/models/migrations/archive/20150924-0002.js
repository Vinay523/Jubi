var app = require('../../../app');
var models = require('../../index')(app);
var services = require('../../../services/index');

var async = require('async');
var Q = require('q');

module.exports = {
    up: function (migration, DataTypes) {
        return Q.Promise(function (resolve, reject) {
            migration.sequelize.models.Forum.findAll().then(function (forums) {
                async.eachSeries(forums,
                    function (forum, callback) {
                        Q.all([
                            Q.Promise(function (resolve, reject) {
                                models.ForumItemCategory.find({
                                    where: {
                                        name: 'Encouragement',
                                        forumId: forum.id
                                    }
                                }).then(function (item) {
                                    if(item) {
                                        item.destroy({forced: true}).then(function () {
                                            resolve();
                                        })
                                    }else{
                                        resolve();
                                    }
                                })
                            }),
                            Q.Promise(function (resolve, reject) {
                                models.ForumItemCategory.find({
                                    where: {
                                        name: 'Appreciation',
                                        forumId: forum.id
                                    }
                                }).then(function (item) {
                                    if(item) {
                                        item.destroy({forced: true}).then(function () {
                                            resolve();
                                        })
                                    }else{
                                        resolve();
                                    }
                                })
                            }),
                            Q.Promise(function (resolve, reject) {
                                models.ForumItemCategory.find({
                                    where: {
                                        name: 'Stories',
                                        forumId: forum.id
                                    }
                                }).then(function (item) {
                                    if(item) {
                                        item.destroy({forced: true}).then(function () {
                                            resolve();
                                        })
                                    }else{
                                        resolve();
                                    }
                                })
                            }),
                            Q.Promise(function (resolve, reject) {
                                models.ForumItemCategory.find({
                                    where: {
                                        name: 'Narratives',
                                        forumId: forum.id
                                    }
                                }).then(function (item) {
                                    if(item) {
                                        item.destroy({forced: true}).then(function () {
                                            resolve();
                                        })
                                    }else{
                                        resolve();
                                    }
                                })
                            })
                        ]).then(function () {
                            callback();
                        })
                    },
                    function (err) {
                        if (err) return services.helpers.handleReject(err, reject);
                        resolve();
                    });
            });
        });
    },
    down: function (migration) {
        return Q.Promise(function (resolve, reject) {

        });
    }
};