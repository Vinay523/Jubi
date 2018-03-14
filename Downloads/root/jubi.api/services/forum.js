var models = require('../models');
var services = require('../services');

var async = require('async');
var Q = require('q');
var _ = require('underscore');

exports.getForum = function (forumId) {
    return Q.Promise(function (resolve, reject) {
        models.Forum.findOne({
                where: {id: forumId},
                include: [{
                    attributes: ['id', 'name', 'description'],
                    model: models.ForumItemCategory,
                    as: 'categories'
                }]
            })
            .then(function (forum) {

                var itemCounts = function (forumId) {
                    return Q.Promise(function (resolve, reject) {

                        models.ForumItem.findAll({
                                attributes: [
                                    'type',
                                    [models.sequelize.fn('count', models.sequelize.col('`ForumItem`.`id`')), 'count']],
                                where: {forumId: forumId},
                                group: ['type'],
                                include: [{
                                    attributes: ['id', 'firstName', 'lastName', 'avatarUrl'],
                                    model: models.User,
                                    as: 'createdBy',
                                    paranoid: false
                                }]
                            })
                            .then(function (counts) {
                                var result = {
                                    topicCount: 0,
                                    commentCount: 0
                                };
                                _.each(counts, function (count) {
                                    result[count.type + 'Count'] = count.dataValues.count;
                                });
                                resolve(result);
                            })
                            .catch(function (err) {
                                services.helpers.handleReject(err, reject);
                            });

                    });
                };

                var likeCounts = function (forumId) {
                    return Q.Promise(function (resolve, reject) {

                        models.ForumItemLike.findOne({
                                attributes: [[models.sequelize.fn('count', models.sequelize.col('`ForumItemLike`.`id`')), 'count']],
                                include: [{
                                    attributes: [],
                                    model: models.ForumItem,
                                    as: 'forumItem',
                                    where: {forumId: forumId}
                                }]
                            })
                            .then(function (count) {
                                resolve(count ? count.dataValues.count : 0);
                            })
                            .catch(function (err) {
                                services.helpers.handleReject(err, reject);
                            });

                    });
                };

                var dislikeCounts = function (forumId) {
                    return Q.Promise(function (resolve, reject) {

                        models.ForumItemDislike.findOne({
                                attributes: [[models.sequelize.fn('count', models.sequelize.col('`ForumItemDislike`.`id`')), 'count']],
                                include: [{
                                    attributes: [],
                                    model: models.ForumItem,
                                    as: 'forumItem',
                                    where: {forumId: forumId}
                                }]
                            })
                            .then(function (count) {
                                resolve(count ? count.dataValues.count : 0);
                            })
                            .catch(function (err) {
                                services.helpers.handleReject(err, reject);
                            });

                    });
                };

                var loadCounts = function (forumId) {
                    return Q.all([
                        itemCounts(forumId),
                        likeCounts(forumId),
                        dislikeCounts(forumId)
                    ]);
                };


                loadCounts(forumId)
                    .then(function (results) {
                        console.log(results);
                        forum.dataValues.topicCount = results[0].topicCount;
                        forum.dataValues.commentCount = results[0].commentCount;
                        forum.dataValues.likeCount = results[1];
                        forum.dataValues.dislikeCount = results[2];
                        console.log(forum.dataValues);
                        resolve(forum);
                    })
                    .catch(function (err) {
                        services.helpers.handleReject(err, reject);
                    });


            })
            .catch(function (err) {
                services.helpers.handleReject(err, reject);
            });
    });
};

exports.getCategories = function (forumId) {
    return Q.Promise(function (resolve, reject) {
        models.ForumItemCategory.findAll({
                attributes: ['id', 'name', 'description'],
                where: {forumId: forumId}
            })
            .then(function (categories) {

                var categoryCounts = function (forumId) {
                    return Q.Promise(function (resolve, reject) {
                        models.ForumItem.findAll({
                                attributes: ['categoryId', [models.sequelize.fn('count', models.sequelize.col('id')), 'count']],
                                where: {
                                    type: 'topic',
                                    forumId: forumId
                                },
                                group: ['categoryId']
                            })
                            .then(resolve)
                            .catch(function (err) {
                                services.helpers.handleReject(err, reject);
                            });
                    });
                };

                categoryCounts(forumId)
                    .then(function (results) {
                        _.each(categories, function (cat) {
                            var result = _.find(results, function (r) {
                                return r.categoryId == cat.id;
                            });
                            cat.dataValues.topicCount = result ? result.dataValues.count : 0;
                        });
                        resolve(categories);
                    })
                    .catch(function (err) {
                        services.helpers.handleReject(err, reject);
                    });

            })
            .catch(function (err) {
                services.helpers.handleReject(err, reject);
            });
    });
};

exports.getTopics = function (forumId, includeCats) {
    return Q.Promise(function (resolve, reject) {

        var query = {
            where: {id: forumId},
            include: [{
                model: models.ForumItem,
                as: 'items',
                where: {parentId: null},
                required: false,
                include: [{
                    attributes: ['id', 'userId'],
                    model: models.ForumItemUser,
                    as: 'users',
                    paranoid: false,
                    include: [
                        {
                            model: models.User,
                            as: 'user',
                            attributes: ['firstName', 'lastName', 'avatarUrl', 'id'],
                            paranoid: false
                        }
                    ]
                }, {
                    attributes: ['id', 'firstName', 'lastName', 'avatarUrl'],
                    model: models.User,
                    as: 'createdBy',
                    paranoid: false
                }, {
                    model: models.ForumItem,
                    as: 'children'
                }, {
                    attributes: ['id', 'name'],
                    model: models.ForumItemCategory,
                    as: 'category'
                }, {
                    attributes: ['id', 'title', 'programId'],
                    model: models.Quest,
                    as: 'quest'
                }, {
                    attributes: ['id', 'title', 'questId'],
                    model: models.Challenge,
                    as: 'challenge'
                }]
            }],
            order: 'items.createdAt DESC'
        };
        if (includeCats) {
            query.include.push({
                attributes: ['id', 'name', 'description'],
                model: models.ForumItemCategory,
                as: 'categories'
            });
        }
        models.Forum.findOne(query)
            .then(function (forum) {
                _.each(forum.items, function (item) {
                    item.createdBy.avatarUrl = services.helpers.makeMediaUrl(item.createdBy.avatarUrl);

                    _.each(item.users, function (user) {
                        user.user.avatarUrl = services.helpers.makeMediaUrl(user.user.avatarUrl);
                    });
                });

                resolve(forum);
            })
            .catch(function (err) {
                services.helpers.handleReject(err, reject);
            });
    });
};

exports.deleteForumItem = function (itemId, isTopic) {
    return Q.Promise(function (resolve, reject) {
        models.ForumItem.findOne({
            where: {id: itemId},
            include: [{
                model: models.ForumItem,
                as: 'children'
            }]
        }).then(function (forumItem) {
            if (forumItem.children.length == 0) {
                forumItem.destroy({
                    id: itemId
                }).then(function () {
                    resolve();
                }).catch(function (err) {
                    services.helpers.handleReject(err, reject);
                });
            } else {
                reject('Cannot delete' + (isTopic ? ' topic ' : ' comment ') + 'with comments!');
            }
        });
    });
};

exports.getTopic = function (topicId) {
    return Q.Promise(function (resolve, reject) {
        models.ForumItem.findOne({
                where: {id: topicId},
                include: [{
                    attributes: ['id', 'userId'],
                    model: models.ForumItemUser,
                    as: 'users',
                    paranoid: false,
                    include: [
                        {
                            model: models.User,
                            as: 'user',
                            attributes: ['firstName', 'lastName', 'avatarUrl', 'id'],
                            paranoid: false
                        }
                    ]
                }, {
                    model: models.Forum,
                    as: 'forum'
                }, {
                    model: models.ForumItemMedia,
                    as: 'media'
                }, {
                    attributes: ['id', 'firstName', 'lastName', 'avatarUrl'],
                    model: models.User,
                    as: 'createdBy',
                    paranoid: false
                }, {
                    attributes: ['id', 'name'],
                    model: models.ForumItemCategory,
                    as: 'category'
                }, {
                    attributes: ['id', 'title'],
                    model: models.Quest,
                    as: 'quest'
                }, {
                    attributes: ['id', 'title', 'questId'],
                    model: models.Challenge,
                    as: 'challenge'
                }, {
                    attributes: ['id', 'createdAt'],
                    model: models.ForumItemLike,
                    as: 'likes',
                    include: [{
                        attributes: ['id', 'firstName', 'lastName'],
                        model: models.User,
                        as: 'createdBy',
                        paranoid: false
                    }]
                }, {
                    attributes: ['id', 'createdAt'],
                    model: models.ForumItemDislike,
                    as: 'dislikes',
                    include: [{
                        attributes: ['id', 'firstName', 'lastName'],
                        model: models.User,
                        as: 'createdBy',
                        paranoid: false
                    }]
                }, {
                    model: models.ForumItem,
                    as: 'children',
                    include: [{
                        attributes: ['id', 'firstName', 'lastName', 'avatarUrl'],
                        model: models.User,
                        as: 'createdBy',
                        paranoid: false
                    }, {
                        model: models.ForumItemMedia,
                        as: 'media'
                    }, {
                        attributes: ['id', 'createdAt'],
                        model: models.ForumItemLike,
                        as: 'likes',
                        include: [{
                            attributes: ['id', 'firstName', 'lastName'],
                            model: models.User,
                            as: 'createdBy',
                            paranoid: false
                        }]
                    }, {
                        attributes: ['id', 'createdAt'],
                        model: models.ForumItemDislike,
                        as: 'dislikes',
                        include: [{
                            attributes: ['id', 'firstName', 'lastName'],
                            model: models.User,
                            as: 'createdBy',
                            paranoid: false
                        }]
                    }]
                }],
                order: 'children.createdAt DESC'
            })
            .then(function (topic) {
                topic = JSON.stringify(topic);
                topic = JSON.parse(topic);
                _.each(topic.children, function (item) {
                    item.createdBy.avatarUrl = services.helpers.makeMediaUrl(item.createdBy.avatarUrl);

                    //Format the challenge media
                    _.each(item.media, function (media) {
                        if (media.type == 'image' || media.type == 'audio')
                            media.url = services.helpers.makeMediaUrl(media.data);
                        else if (media.type == 'video') {
                            if (media.source == 'system')
                                media.url = services.helpers.makeMediaUrl(media.data);
                            else if (media.source == 'youtube') {
                                media.iframe = media.data
                            }
                        }
                        else if (media.type == 'text')
                            media.text = media.data;
                        else if (media.type == 'link')
                            media.link = media.data;
                        else if (media.type == 'resource')
                            media.url = services.helpers.makeResourceUrl(media.data);
                    });
                });
                _.each(topic.users, function (forumItemUser) {
                    forumItemUser.user.avatarUrl = services.helpers.makeMediaUrl(forumItemUser.user.avatarUrl);
                });
                topic.createdBy.avatarUrl = services.helpers.makeMediaUrl(topic.createdBy.avatarUrl);

                //Format the challenge media
                _.each(topic.media, function (media) {
                    if (media.type == 'image' || media.type == 'audio')
                        media.url = services.helpers.makeMediaUrl(media.data);
                    else if (media.type == 'video') {
                        if (media.source == 'system')
                            media.url = services.helpers.makeMediaUrl(media.data);
                        else if (media.source == 'youtube') {
                            media.iframe = media.data
                        }
                    }
                    else if (media.type == 'text')
                        media.text = media.data;
                    else if (media.type == 'link')
                        media.link = media.data;
                    else if (media.type == 'resource')
                        media.url = services.helpers.makeResourceUrl(media.data);
                });


                resolve(topic);
            })
            .catch(function (err) {
                services.helpers.handleReject(err, reject);
            });
    });
};

exports.topic = function (user, forumId, questId, challengeId, categoryId, title, content, contentLink, contentLinkType, allowDuplicate, networkUsers, bonusPoints, subType, mediaItems) {
    return Q.Promise(function (resolve, reject) {
        models.sequelize.transaction().then(function (t) {

            var continueCreateTopic = function (existingItems) {
                if (existingItems.length == 0 || allowDuplicate) {
                    if (allowDuplicate && networkUsers.length == 0) {
                        var matchingTitleItem = _.findWhere(existingItems, {title: title});
                        if (matchingTitleItem) {
                            reject('There is already a post associated to the same content with a matching title. Please comment on the existing post below or change the title of your post before submitting');
                            return;
                        }
                    }
                    models.ForumItem.build({
                        type: 'topic',
                        subType: subType,
                        forumId: forumId,
                        questId: questId,
                        challengeId: challengeId,
                        categoryId: categoryId,
                        title: title,
                        content: content,
                        contentLink: contentLink,
                        contentLinkType: contentLinkType,
                        createdById: user.id
                    }).save({transaction: t})
                        .then(function (item) {
                            Q.all([
                                Q.Promise(function (resolve, reject) {
                                    async.eachSeries(networkUsers,
                                        function (networkUser, callback) {
                                            models.ForumItemUser.build({
                                                forumItemId: item.id,
                                                userId: networkUser.userId
                                            }).save({transaction: t}).then(function (forumItemUser) {
                                                callback(null);
                                            })
                                        },
                                        function (err) {
                                            resolve();
                                        })
                                }),
                                Q.Promise(function (resolve, reject) {
                                    if (bonusPoints && Number(bonusPoints) > 0) {
                                        models.BonusPoints.build({
                                            forumItemId: item.id,
                                            points: bonusPoints,
                                            userId: user.id
                                        }).save({transaction: t}).then(function () {
                                            resolve();
                                        })
                                    } else {
                                        resolve();
                                    }
                                }),
                                Q.Promise(function (resolve, reject) {
                                    async.eachSeries(mediaItems,
                                        function (media, callback) {
                                            if (media.type == 'image') {
                                                models.ForumItemMedia.create({
                                                        forumItemId: item.id,
                                                        userId: user.id,
                                                        type: media.type,
                                                        name: media.name,
                                                        ref: media.ref,
                                                        description: media.description,
                                                        data: services.helpers.makeImageRef(media.url),
                                                        sourceDate: media.date,
                                                        sequence: mediaItems.indexOf(media)
                                                    }, {transaction: t})
                                                    .then(function () {
                                                        return callback(null);
                                                    })
                                                    .catch(function (err) {
                                                        services.helpers.handleReject(err, callback);
                                                    });
                                                return;
                                            }

                                            if (media.type == 'video') {

                                                var data = (typeof media.iframe !== 'undefined') ?
                                                    media.iframe : services.helpers.makeVideoRef(media.url, '.mp4');

                                                models.ForumItemMedia.create({
                                                        forumItemId: item.id,
                                                        userId: user.id,
                                                        type: media.type,
                                                        status: (media.encoding ? 'encoding' : 'ready'),
                                                        source: media.source,
                                                        ref: media.ref,
                                                        name: media.name,
                                                        description: media.description,
                                                        coverUrl: media.coverUrl,
                                                        data: data,
                                                        sourceDate: media.date,
                                                        sequence: mediaItems.indexOf(media)
                                                    }, {transaction: t})
                                                    .then(function () {
                                                        return callback(null);
                                                    })
                                                    .catch(function (err) {
                                                        services.helpers.handleReject(err, callback);
                                                    });
                                            }

                                            if (media.type == 'audio') {
                                                models.ForumItemMedia.create({
                                                        forumItemId: item.id,
                                                        userId: user.id,
                                                        type: media.type,
                                                        status: (media.encoding ? 'encoding' : 'ready'),
                                                        ref: media.ref,
                                                        name: media.name,
                                                        description: media.description,
                                                        data: services.helpers.makeAudioRef(media.url, '.mp3'),
                                                        sourceDate: media.date,
                                                        sequence: mediaItems.indexOf(media)
                                                    }, {transaction: t})
                                                    .then(function () {
                                                        return callback(null);
                                                    })
                                                    .catch(function (err) {
                                                        services.helpers.handleReject(err, callback);
                                                    });
                                            }

                                            if (media.type == 'text') {

                                                models.ForumItemMedia.create({
                                                        forumItemId: item.id,
                                                        userId: user.id,
                                                        type: media.type,
                                                        data: media.text,
                                                        description: media.description,
                                                        sequence: mediaItems.indexOf(media)
                                                    }, {transaction: t})
                                                    .then(function () {
                                                        return callback(null);
                                                    })
                                                    .catch(function (err) {
                                                        services.helpers.handleReject(err, callback);
                                                    });
                                            }

                                            if (media.type == 'link') {
                                                models.ForumItemMedia.create({
                                                        forumItemId: item.id,
                                                        userId: user.id,
                                                        type: media.type,
                                                        data: media.link,
                                                        description: media.description,
                                                        sequence: mediaItems.indexOf(media)
                                                    }, {transaction: t})
                                                    .then(function () {
                                                        return callback(null);
                                                    })
                                                    .catch(function (err) {
                                                        services.helpers.handleReject(err, callback);
                                                    });
                                            }

                                            if (media.type == 'resource') {
                                                models.ForumItemMedia.create({
                                                        forumItemId: item.id,
                                                        userId: user.id,
                                                        type: media.type,
                                                        ref: media.ref,
                                                        name: media.name,
                                                        description: media.description,
                                                        data: services.helpers.makeResourceRef(media.url),
                                                        sourceDate: media.date,
                                                        sequence: mediaItems.indexOf(media)
                                                    }, {transaction: t})
                                                    .then(function () {
                                                        return callback(null);
                                                    })
                                                    .catch(function (err) {
                                                        services.helpers.handleReject(err, callback);
                                                    });
                                            }
                                        },
                                        function (err) {
                                            resolve();
                                        })
                                })
                            ]).then(function () {
                                logger.info('Forum Topic Created [%d:%d] %s', item.forumId, item.id, item.title);
                                t.commit()
                                    .then(function() {
                                        //HOOK: includes discussion creation, encourage, appreciate, and story (which are all subTypes of discussions).
                                        //Check the subType parameter to differentiate them, null mean just a discussion.

                                        services.forum.getTopics(item.forumId, false).then(function (forum) {
                                            var topic = _.findWhere(forum.items, {id: item.id});
                                            resolve({matchingItems: existingItems, topic: topic});
                                        });
                                    });
                            })
                        }).catch(function (err) {
                            t.rollback().then(function() { services.helpers.handleReject(err, reject); });
                        });
                } else {
                    t.rollback()
                        .then(function() {
                            _.each(existingItems, function (item) {
                                item.createdBy.avatarUrl = services.helpers.makeImageRef(item.createdBy.avatarUrl);
                            });
                            resolve({matchingItems: existingItems});
                        });
                }
            };

            var checkForDuplicates = function (where) {
                models.ForumItem.findAll({
                    where: where,
                    include: [{
                        attributes: ['id', 'firstName', 'lastName', 'avatarUrl'],
                        model: models.User,
                        as: 'createdBy',
                        paranoid: false
                    }, {
                        attributes: ['id', 'name'],
                        model: models.ForumItemCategory,
                        as: 'category'
                    }, {
                        attributes: ['id', 'title'],
                        model: models.Quest,
                        as: 'quest'
                    }, {
                        attributes: ['id', 'title', 'questId'],
                        model: models.Challenge,
                        as: 'challenge'
                    }]
                }).then(function (existingItems) {
                    continueCreateTopic(existingItems);
                })
            };

            if (!challengeId && !questId && !subType) {
                var where = {
                    forumId: forumId,
                    title: title,
                    challengeId: null,
                    questId: null
                };
                checkForDuplicates(where);
            } else if (challengeId || questId) {
                var where = {
                    challengeId: challengeId,
                    questId: questId,
                    forumId: forumId
                };
                checkForDuplicates(where);
            } else {
                continueCreateTopic([]);
            }

        });
    });
};

exports.comment = function (user, forumId, topicId, content, mediaItems) {
    return Q.Promise(function (resolve, reject) {
        models.sequelize.transaction().then(function (t) {

            async.waterfall([

                function (callback) {
                    models.ForumItem.findOne({
                            where: {id: topicId},
                            include: [{
                                attributes: ['id'],
                                model: models.User,
                                as: 'createdBy',
                                paranoid: false
                            }]
                        })
                        .then(function (topic) {
                            callback(null, topic);
                        })
                        .catch(function (err) {
                            services.helpers.handleReject(err, callback)
                        })
                },
                function (topic, callback) {
                    models.ForumItem.build({
                        type: 'comment',
                        forumId: forumId,
                        parentId: topicId,
                        content: content,
                        createdById: user.id,
                        createdAgainstId: topic.createdBy.id
                    }).save({transaction: t})
                        .then(function (item) {
                            if (mediaItems) {
                                async.eachSeries(mediaItems,
                                    function (media, callback) {
                                        if (media.type == 'image') {
                                            models.ForumItemMedia.create({
                                                    forumItemId: item.id,
                                                    userId: user.id,
                                                    type: media.type,
                                                    name: media.name,
                                                    ref: media.ref,
                                                    description: media.description,
                                                    data: services.helpers.makeImageRef(media.url),
                                                    sourceDate: media.date,
                                                    sequence: mediaItems.indexOf(media)
                                                }, {transaction: t})
                                                .then(function () {
                                                    return callback(null);
                                                })
                                                .catch(function (err) {
                                                    services.helpers.handleReject(err, callback);
                                                });
                                            return;
                                        }

                                        if (media.type == 'video') {

                                            var data = (typeof media.iframe !== 'undefined') ?
                                                media.iframe : services.helpers.makeVideoRef(media.url, '.mp4');

                                            models.ForumItemMedia.create({
                                                    forumItemId: item.id,
                                                    userId: user.id,
                                                    type: media.type,
                                                    status: (media.encoding ? 'encoding' : 'ready'),
                                                    source: media.source,
                                                    ref: media.ref,
                                                    name: media.name,
                                                    description: media.description,
                                                    coverUrl: media.coverUrl,
                                                    data: data,
                                                    sourceDate: media.date,
                                                    sequence: mediaItems.indexOf(media)
                                                }, {transaction: t})
                                                .then(function () {
                                                    return callback(null);
                                                })
                                                .catch(function (err) {
                                                    services.helpers.handleReject(err, callback);
                                                });
                                        }

                                        if (media.type == 'audio') {
                                            models.ForumItemMedia.create({
                                                    forumItemId: item.id,
                                                    userId: user.id,
                                                    type: media.type,
                                                    status: (media.encoding ? 'encoding' : 'ready'),
                                                    ref: media.ref,
                                                    name: media.name,
                                                    description: media.description,
                                                    data: services.helpers.makeAudioRef(media.url, '.mp3'),
                                                    sourceDate: media.date,
                                                    sequence: mediaItems.indexOf(media)
                                                }, {transaction: t})
                                                .then(function () {
                                                    return callback(null);
                                                })
                                                .catch(function (err) {
                                                    services.helpers.handleReject(err, callback);
                                                });
                                        }

                                        if (media.type == 'text') {

                                            models.ForumItemMedia.create({
                                                    forumItemId: item.id,
                                                    userId: user.id,
                                                    type: media.type,
                                                    data: media.text,
                                                    description: media.description,
                                                    sequence: mediaItems.indexOf(media)
                                                }, {transaction: t})
                                                .then(function () {
                                                    return callback(null);
                                                })
                                                .catch(function (err) {
                                                    services.helpers.handleReject(err, callback);
                                                });
                                        }

                                        if (media.type == 'link') {
                                            models.ForumItemMedia.create({
                                                    forumItemId: item.id,
                                                    userId: user.id,
                                                    type: media.type,
                                                    data: media.link,
                                                    description: media.description,
                                                    sequence: mediaItems.indexOf(media)
                                                }, {transaction: t})
                                                .then(function () {
                                                    return callback(null);
                                                })
                                                .catch(function (err) {
                                                    services.helpers.handleReject(err, callback);
                                                });
                                        }

                                        if (media.type == 'resource') {
                                            models.ForumItemMedia.create({
                                                    forumItemId: item.id,
                                                    userId: user.id,
                                                    type: media.type,
                                                    ref: media.ref,
                                                    name: media.name,
                                                    description: media.description,
                                                    data: services.helpers.makeResourceRef(media.url),
                                                    sourceDate: media.date,
                                                    sequence: mediaItems.indexOf(media)
                                                }, {transaction: t})
                                                .then(function () {
                                                    return callback(null);
                                                })
                                                .catch(function (err) {
                                                    services.helpers.handleReject(err, callback);
                                                });
                                        }
                                    },
                                    function (err) {
                                        logger.info('Forum Comment Created [%d:%d]', item.forumId, item.id);
                                        callback(null);
                                    })
                            } else {
                                callback(null);
                            }
                        })
                        .catch(function (err) {
                            services.helpers.handleReject(err, callback)
                        });
                }
            ], function (err) {
                if (err) {
                    t.rollback().then(function() { services.helpers.handleReject(err, reject); });
                    return null;
                }
                t.commit()
                    .then(function() {
                        //HOOK: comment creation happens here
                        resolve();
                    });
            });
        });
    });
};

var _likeDislike = function (user, forumItemId, main, alt) {
    return Q.Promise(function (resolve, reject) {
        models.sequelize.transaction().then(function (t) {
            var forumId = null;
            async.waterfall([

                // Destroy dislike if needed
                function (callback) {
                    models[alt].destroy({
                            where: {
                                forumItemId: forumItemId,
                                createdById: user.id
                            },
                            transaction: t
                        })
                        .then(function () {
                            callback(null);
                        })
                        .catch(function (err) {
                            services.helpers.handleReject(err, callback)
                        });
                },
                // See if a like already exists
                function (callback) {
                    models[main].findOne({
                            where: {
                                forumItemId: forumItemId,
                                createdById: user.id
                            }
                        })
                        .then(function (like) {
                            callback(null, like);
                        })
                        .catch(function (err) {
                            t.rollback().then(function() { services.helpers.handleReject(err, reject); });
                        });
                },
                // Get the forum item
                function (like, callback) {
                    if (like) return callback(null, like);

                    models.ForumItem.findOne({
                            attributes: ['id'],
                            where: {id: forumItemId},
                            include: [{
                                attributes: ['id'],
                                model: models.User,
                                as: 'createdBy',
                                paranoid: false
                            }]
                        })
                        .then(function (item) {
                            forumId = item.forumId;
                            callback(null, like, item);
                        })
                        .catch(function (err) {
                            services.helpers.handleReject(err, callback)
                        });
                },
                function (like, item, callback) {
                    if (like) return callback(null);

                    models[main].build({
                        forumItemId: forumItemId,
                        createdById: user.id,
                        createdAgainstId: item.createdBy.id
                    }).save({transaction: t})
                        .then(function (like) {
                            logger.info('Forum %s Created [%d:%d] by %d', main, like.forumItemId, like.id, user.id);
                            callback(null);
                        })
                        .catch(function (err) {
                            services.helpers.handleReject(err, callback)
                        });
                }

            ], function (err) {
                if (err) {
                    t.rollback().then(function() { services.helpers.handleReject(err, reject); });
                    return null;
                }
                t.commit()
                    .then(function() {
                        //HOOK: like and dislike happen here
                        //Check the "main" parameter to determine which
                        resolve();
                    });
            });
        });
    });
};

exports.like = function (user, forumItemId) {
    return _likeDislike(user, forumItemId, 'ForumItemLike', 'ForumItemDislike');
};

exports.dislike = function (user, forumItemId) {
    return _likeDislike(user, forumItemId, 'ForumItemDislike', 'ForumItemLike');
};

exports.newCategory = function (forumId, name, description) {
    return Q.Promise(function (resolve, reject) {
        models.sequelize.transaction().then(function (t) {
            models.ForumItemCategory.build({
                forumId: forumId,
                name: name,
                description: description
            }).save({transaction: t})
                .then(function (cat) {
                    logger.info('Forum Category Created [%d:%d] %s', cat.forumId, cat.id, cat.name);
                    t.commit().then(resolve);
                })
                .catch(function (err) {
                    t.rollback().then(function() { ervices.helpers.handleReject(err, reject); });
                });
        });
    });
};

exports.updateCategory = function (categoryId, name, description) {
    return Q.Promise(function (resolve, reject) {
        models.sequelize.transaction().then(function (t) {

            models.ForumItemCategory.findById(categoryId)
                .then(function (cat) {
                    cat.name = name;
                    cat.description = description;
                    cat.save({transaction: t})
                        .then(function (cat) {
                            logger.info('Forum Category Updated [%d:%d] %s', cat.forumId, cat.id, cat.name);
                            t.commit().then(resolve);
                        })
                        .catch(function (err) {
                            t.rollback().then(function() { ervices.helpers.handleReject(err, reject); });
                        });
                })
        });
    });
};

exports.createForumIfNeeded = function (programLinkId, name) {
    return Q.Promise(function (resolve, reject) {

        models.Forum.findOne({
                where: {linkId: programLinkId}
            })
            .then(function (forum) {
                if (forum) return resolve(forum.id);

                models.sequelize.transaction().then(function (t) {

                        async.waterfall([

                            // Create the forum
                            function (callback) {
                                models.Forum.build({
                                    name: name,
                                    linkId: programLinkId
                                }).save({transaction: t})
                                    .then(function (forum) {
                                        callback(null, forum);
                                    })
                                    .catch(function (err) {
                                        services.helpers.handleReject(err, callback);
                                    });
                            },
                            // Create the general category
                            function (forum, callback) {
                                Q.all([
                                    models.ForumItemCategory.create({
                                        name: 'General',
                                        forumId: forum.id
                                    }, {transaction: t}),
                                    models.ForumItemCategory.create({
                                        name: 'Inspiration',
                                        forumId: forum.id
                                    }, {transaction: t}),
                                    models.ForumItemCategory.create({
                                        name: 'Narrative Responses',
                                        forumId: forum.id
                                    }, {transaction: t})
                                ]).then(function () {
                                    callback(null, forum);
                                }).catch(function (err) {
                                    services.helpers.handleReject(err, callback);
                                });
                            }

                        ], function (err, forum) {
                            if (err) {
                                t.rollback().then(function() { services.helpers.handleReject(err, reject); });
                                return null;
                            }
                            t.commit().then(function() {resolve(forum.id);});

                        });
                    })
                    .catch(function (err) {
                        services.helpers.handleReject(err, reject);
                    });
            })
            .catch(function (err) {
                services.helpers.handleReject(err, reject);
            });
    });
};