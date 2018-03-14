var models = require('../../models');
var controllerBase = require('./controllerBase');
var services = require('../../services/index');
var Q = require('q');
var _ = require('underscore');
var async = require('async');
var util = require('util');


function TodoController(model) {
    controllerBase.call(this, model);
}

util.inherits(TodoController, controllerBase);

var controller = new TodoController(models.Todo);

TodoController.prototype.getUserTodos = function (req, res) {
    controller._getUserTodos(req.user)
        .then(function (program) {
            res.sendSuccess(program);
        })
        .catch(function (err) {
            res.sendError(err);
        });
};

TodoController.prototype._getUserTodos = function (user) {
    return Q.Promise(function (resolve, reject) {
        models.UserTodo.findAll({
            where: {
                userId: user.id,
                status: {
                    $ne: 'locked'
                }
            },
            include: [
                {
                    model: models.Todo,
                    as: 'todo'
                }
            ]
        }).then(function (userTodos) {
            resolve(userTodos);
        })
    });
};

TodoController.prototype.removeTodoChallengeResult = function (req, res) {
    controller._removeTodoChallengeResult(req.user, req.params.resultId)
        .then(function (program) {
            res.sendSuccess(program);
        })
        .catch(function (err) {
            res.sendError(err);
        });
};

TodoController.prototype._removeTodoChallengeResult = function (user, resultId) {
    return Q.Promise(function (resolve, reject) {
        models.ChallengeResult.find({
            where: {
                id: resultId,
                userId: user.id
            }
        }).then(function (challengeResult) {
            if (challengeResult) {
                challengeResult.destroy().then(function () {
                    resolve();
                });
            } else {
                reject('Not found!');
            }
        });
    });
};

TodoController.prototype.getBuddyTodos = function (req, res) {
    controller._getBuddyTodos(req.user, req.params.programId)
        .then(function (todos) {
            res.sendSuccess(todos);
        })
        .catch(function (err) {
            res.sendError(err);
        });
};

TodoController.prototype._getBuddyTodos = function (user, programId) {
    return Q.Promise(function (resolve, reject) {
        models.Program.find({
            where: {
                id: programId
            },
            attributes: ['linkId']
        }).then(function (program) {
            models.ProgramUser.find({
                where: {
                    userId: user.id,
                    linkId: program.linkId
                }
            }).then(function (myProgramUser) {
                if (!myProgramUser) {
                    resolve([]);
                    return null;
                }
                models.ProgramUserAssociation.findAll({
                    where: {
                        associatedProgramUserId: myProgramUser.id,
                        typeId: services.helpers.programUserAssociationTypes.buddy.id
                    },
                    paranoid: true
                }).then(function (associations) {
                    models.ProgramUser.findAll({
                        where: {
                            id: {
                                $in: _.pluck(associations, 'programUserId')
                            }
                        },
                        attributes: ['userId']
                    }).then(function (programUsers) {
                        models.UserTodo.findAll({
                            where: {
                                userId: {
                                    $in: _.pluck(programUsers, 'userId')
                                },
                                status: {
                                    $and: [
                                        {$ne: 'unlocked'},
                                        {$ne: 'locked'}
                                    ]
                                }
                            },
                            include: [
                                {
                                    model: models.BonusPoints,
                                    as: 'bonusPoints',
                                    include: [
                                        {
                                            model: models.User,
                                            as: 'user',
                                            attributes: ['id', 'firstName', 'lastName', 'avatarUrl']
                                        }
                                    ]
                                },
                                {
                                    model: models.User,
                                    as: 'user',
                                    attributes: ['id', 'firstName', 'lastName', 'avatarUrl']
                                },
                                {
                                    model: models.ChallengeResult,
                                    as: 'results',
                                    include: [
                                        {
                                            model: models.ChallengeResultItem,
                                            as: 'items'
                                        },
                                        {
                                            model: models.User,
                                            as: 'user',
                                            attributes: ['id', 'firstName', 'lastName', 'email', 'title', 'email', 'avatarUrl', 'why', 'destination'],
                                            paranoid:false
                                        }
                                    ],
                                    required: false
                                },
                                {
                                    model: models.UserChallengeMedia,
                                    as: 'userMedia',
                                    required: false
                                },
                                {
                                    model: models.Todo,
                                    as: 'todo',
                                    include: [
                                        {
                                            model: models.Challenge,
                                            as: 'challenges',
                                            include: [
                                                {
                                                    model: models.ChallengeQuestion,
                                                    as: 'questions'
                                                }
                                            ]
                                        }
                                    ],
                                    where: {
                                        programId: programId
                                    }
                                }
                            ]
                        }).then(function (userTodos) {
                            userTodos = JSON.stringify(userTodos);
                            userTodos = JSON.parse(userTodos);

                            _.each(userTodos, function (userTodo) {
                                userTodo.user.avatarUrl = services.helpers.makeMediaUrl(userTodo.user.avatarUrl);
                                if (userTodo.todo.resourceUrl) {
                                    userTodo.todo.resourceUrl = services.helpers.makeResourceUrl(userTodo.todo.resourceUrl)
                                }

                                _.each(userTodo.bonusPoints, function (pointsRecord) {
                                    pointsRecord.user.avatarUrl = services.helpers.makeMediaUrl(pointsRecord.user.avatarUrl)
                                });

                                _.each(userTodo.todo.challenges, function (challenge) {
                                    challenge.results = _.filter(userTodo.results, function (result) {
                                        return result.challengeId == challenge.id;
                                    });
                                    challenge.userMedia = _.filter(userTodo.userMedia, function (media) {
                                        return media.challengeId == challenge.id;
                                    });

                                    _.each(challenge.userMedia, function (media) {
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

                                    _.each(challenge.results, function (result) {
                                        result.user.avatarUrl = services.helpers.makeMediaUrl(result.user.avatarUrl);
                                    })
                                });
                            });
                            resolve(userTodos);
                        })
                    });
                });
            });
        });
    });
};

TodoController.prototype.updateUserTodo = function (req, res) {


    models.sequelize.transaction({ isolationLevel: models.sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED }).then(function (t) {
        controller._updateUserTodo(req.user, req.body.userTodo, req.body.status, t)
            .then(function (result) {
                t.commit()
                    .then(function() {
                        if (result.todoJustCompleted) {
                            //HOOK: Todo Completed
                            services.stats.logTodoComplete(req.body.userTodo.userId, req.body.userTodo.todoId, req.body.userTodo.todo.points);
                        }

                        var user = req.user;
                        var todo = req.body.userTodo;

                        models.UserTodo.findOne({
                            where: {
                                id: todo.id
                            },
                            include: [
                                {
                                    model: models.BonusPoints,
                                    as: 'bonusPoints',
                                    include: [
                                        {
                                            model: models.User,
                                            as: 'user',
                                            attributes: ['id', 'firstName', 'lastName', 'avatarUrl']
                                        }
                                    ]
                                },
                                {
                                    model: models.ChallengeResult,
                                    as: 'results',
                                    include: [
                                        {
                                            model: models.ChallengeResultItem,
                                            as: 'items'
                                        },
                                        {
                                            model: models.User,
                                            as: 'user',
                                            attributes: ['id', 'firstName', 'lastName', 'email', 'title', 'email', 'avatarUrl', 'why', 'destination']
                                        }
                                    ],
                                    required: false
                                },
                                {
                                    model: models.UserChallengeMedia,
                                    as: 'userMedia',
                                    required: false
                                },
                                {
                                    model: models.User,
                                    as: 'user',
                                    attributes: ['id', 'firstName', 'lastName', 'email', 'title', 'email', 'avatarUrl', 'why', 'destination']
                                },
                                {
                                    model: models.Todo,
                                    as: 'todo',
                                    include: [
                                        {
                                            model: models.Challenge,
                                            as: 'challenges',
                                            include: [
                                                {
                                                    model: models.ChallengeQuestion,
                                                    as: 'questions'
                                                }
                                            ]
                                        },
                                        {
                                            model: models.Program,
                                            as: 'program'
                                        }
                                    ]
                                }
                            ]
                        }).then(function (userTodo) {
                            userTodo = JSON.stringify(userTodo);
                            userTodo = JSON.parse(userTodo);


                            _.each(userTodo.bonusPoints, function (pointsRecord) {
                                pointsRecord.user.avatarUrl = services.helpers.makeMediaUrl(pointsRecord.user.avatarUrl)
                            });

                            _.each(userTodo.todo.challenges, function (challenge) {

                                challenge.results = _.filter(userTodo.results, function (result) {
                                    return result.challengeId == challenge.id;
                                });
                                console.log('challenge', challenge);
                                console.log('userTodo.userMedia', userTodo.userMedia);
                                challenge.userMedia = _.filter(userTodo.userMedia, function (media) {
                                    return media.challengeId == challenge.id;
                                });
                                //Format the challenge media
                                _.each(challenge.userMedia, function (media) {
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

                                _.each(challenge.results, function (result) {
                                    result.user.avatarUrl = services.helpers.makeMediaUrl(result.user.avatarUrl);
                                })
                            });

                            userTodo.user.avatarUrl = services.helpers.makeMediaUrl(userTodo.user.avatarUrl);

                            res.sendSuccess(userTodo);
                        });
                    });
            })
            .catch(function (err) {
                t.rollback().then(function() { res.sendError(err); });
            });
    });
};

TodoController.prototype._updateUserTodo = function (user, userTodo, status, t) {
    return Q.Promise(function (resolve, reject) {
        models.UserTodo.find({
            where: {
                id: userTodo.id
            },
            include: [
                {
                    model: models.Todo,
                    as: 'todo',
                    include: [
                        {
                            model: models.Challenge,
                            as: 'challenges',
                            where: {
                                title: 'Todo Media Upload'
                            },
                            required: false,
                            include: [
                                {
                                    model: models.UserChallengeMedia,
                                    as: 'userMedia'
                                }
                            ]
                        }
                    ]
                }
            ]
        }).then(function (foundUserTodo) {
            if (userTodo.dueDate) {
                foundUserTodo.dueDate = userTodo.dueDate;
            }
            if (userTodo.addedBonusPoints && Number(userTodo.addedBonusPoints) > 0) {
                models.BonusPoints.build({
                    userTodoId: foundUserTodo.id,
                    points: userTodo.addedBonusPoints,
                    userId: user.id
                }).save({ transaction: t });
            }

            if (foundUserTodo.status != 'completed' && status == 'completed'
                && !foundUserTodo.hasBeenCompleted) {
                var todoJustCompleted = true;
            }

            //If to-do has been completed hasBeenCompleted is set to true, never set back to false
            if(status == 'completed'){
                foundUserTodo.hasBeenCompleted = true;
            }

            foundUserTodo.status = status;
            foundUserTodo.save({ transaction: t }).then(function () {
                if (userTodo.todo.challenges.length > 0) {
                    async.eachSeries(userTodo.todo.challenges,
                        function (challenge, callback) {
                            Q.all([
                                Q.Promise(function (resolve, reject) {
                                    if (challenge.answer) {
                                        models.ChallengeResult.create({
                                            challengeId: challenge.id,
                                            userId: user.id,
                                            userTodoId: foundUserTodo.id
                                        }, { transaction: t }).then(function (newChallengeResult) {
                                            models.ChallengeResultItem.create({
                                                data: challenge.answer,
                                                resultId: newChallengeResult.id
                                            }, { transaction: t })
                                                .then(function () {
                                                    resolve();
                                                }).catch(function (err) {
                                                    reject(err)
                                                });
                                        })
                                    } else {
                                        resolve();
                                    }
                                }),
                                Q.Promise(function (resolve, reject) {
                                    if (challenge.title == 'Todo Media Upload') {
                                        Q.all([
                                            Q.Promise(function (resolve) {
                                                async.eachSeries(foundUserTodo.todo.challenges[0].userMedia,
                                                    function (media, callback) {
                                                        if (media.userId == user.id && _.findWhere(challenge.userMedia, { id: media.id }) == null) {
                                                            models.UserChallengeMedia.destroy({
                                                                where: {
                                                                    id: media.id
                                                                }
                                                            }, { transaction: t })
                                                                .then(function () {
                                                                    return callback(null);
                                                                }).catch(function(err) {
                                                                    services.helpers.handleReject(err, callback);
                                                                })
                                                        } else {
                                                            return callback(null);
                                                        }
                                                    },
                                                    function (err) {
                                                        if(err) {
                                                            return reject(err);
                                                        }
                                                        resolve();
                                                    })
                                            }),
                                            Q.Promise(function (resolve, reject) {
                                                async.eachSeries(challenge.userMedia,
                                                    function (media, callback) {
                                                        if (!media.id) {
                                                            if (media.type == 'image') {
                                                                models.UserChallengeMedia.create({
                                                                    userId: user.id,
                                                                    type: media.type,
                                                                    name: media.name,
                                                                    ref: media.ref,
                                                                    userTodoId: foundUserTodo.id,
                                                                    description: media.description,
                                                                    data: services.helpers.makeImageRef(media.url),
                                                                    sourceDate: media.date,
                                                                    sequence: challenge.userMedia.indexOf(media),
                                                                    challengeId: challenge.id
                                                                }, { transaction: t })
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

                                                                models.UserChallengeMedia.create({
                                                                    userId: user.id,
                                                                    type: media.type,
                                                                    status: (media.encoding ? 'encoding' : 'ready'),
                                                                    source: media.source,
                                                                    ref: media.ref,
                                                                    userTodoId: foundUserTodo.id,
                                                                    name: media.name,
                                                                    description: media.description,
                                                                    coverUrl: media.coverUrl,
                                                                    data: data,
                                                                    sourceDate: media.date,
                                                                    sequence: challenge.userMedia.indexOf(media),
                                                                    challengeId: challenge.id
                                                                }, { transaction: t })
                                                                    .then(function () {
                                                                        return callback(null);
                                                                    })
                                                                    .catch(function (err) {
                                                                        services.helpers.handleReject(err, callback);
                                                                    });
                                                            }

                                                            if (media.type == 'audio') {
                                                                models.UserChallengeMedia.create({
                                                                    userId: user.id,
                                                                    type: media.type,
                                                                    status: (media.encoding ? 'encoding' : 'ready'),
                                                                    ref: media.ref,
                                                                    userTodoId: foundUserTodo.id,
                                                                    name: media.name,
                                                                    description: media.description,
                                                                    data: services.helpers.makeAudioRef(media.url, '.mp3'),
                                                                    sourceDate: media.date,
                                                                    sequence: challenge.userMedia.indexOf(media),
                                                                    challengeId: challenge.id
                                                                }, { transaction: t })
                                                                    .then(function () {
                                                                        return callback(null);
                                                                    })
                                                                    .catch(function (err) {
                                                                        services.helpers.handleReject(err, callback);
                                                                    });
                                                            }

                                                            if (media.type == 'text') {

                                                                models.UserChallengeMedia.create({
                                                                    userId: user.id,
                                                                    type: media.type,
                                                                    data: media.text,
                                                                    userTodoId: foundUserTodo.id,
                                                                    description: media.description,
                                                                    sequence: challenge.userMedia.indexOf(media),
                                                                    challengeId: challenge.id
                                                                }, { transaction: t })
                                                                    .then(function () {
                                                                        return callback(null);
                                                                    })
                                                                    .catch(function (err) {
                                                                        services.helpers.handleReject(err, callback);
                                                                    });
                                                            }

                                                            if (media.type == 'link') {
                                                                models.UserChallengeMedia.create({
                                                                    userId: user.id,
                                                                    type: media.type,
                                                                    data: media.link,
                                                                    userTodoId: foundUserTodo.id,
                                                                    description: media.description,
                                                                    sequence: challenge.userMedia.indexOf(media),
                                                                    challengeId: challenge.id
                                                                }, { transaction: t })
                                                                    .then(function () {
                                                                        return callback(null);
                                                                    })
                                                                    .catch(function (err) {
                                                                        services.helpers.handleReject(err, callback);
                                                                    });
                                                            }

                                                            if (media.type == 'resource') {
                                                                models.UserChallengeMedia.create({
                                                                    userId: user.id,
                                                                    type: media.type,
                                                                    ref: media.ref,
                                                                    userTodoId: foundUserTodo.id,
                                                                    name: media.name,
                                                                    description: media.description,
                                                                    data: services.helpers.makeResourceRef(media.url),
                                                                    sourceDate: media.date,
                                                                    sequence: challenge.userMedia.indexOf(media),
                                                                    challengeId: challenge.id
                                                                }, { transaction: t })
                                                                    .then(function () {
                                                                        return callback(null);
                                                                    })
                                                                    .catch(function (err) {
                                                                        services.helpers.handleReject(err, callback);
                                                                    });
                                                            }
                                                        } else {
                                                            models.UserChallengeMedia.find({
                                                                where: {
                                                                    id: media.id
                                                                }
                                                            }).then(function (foundMedia) {
                                                                foundMedia.description = media.description;
                                                                foundMedia.name = media.name;
                                                                foundMedia.save({ transaction: t })
                                                                    .then(function () {
                                                                        return callback(null);
                                                                    }).catch(function(err){
                                                                        return services.helpers.handleReject(err, callback);
                                                                    })
                                                            }).catch(function(err){
                                                                return services.helpers.handleReject(err, callback);
                                                            })
                                                        }
                                                    },
                                                    function (err) {
                                                        if(err){
                                                            return services.helpers.handleReject(err, reject);
                                                        }
                                                        resolve();
                                                    })
                                            })
                                        ]).then(function () {
                                            resolve();
                                        }).catch(function(err){
                                            services.helpers.handleReject(err, reject);
                                        })
                                    } else {
                                        resolve();
                                    }
                                })
                            ]).then(function () {
                                callback();
                            }).catch(function (err) {
                                services.helpers.handleReject(err, callback);
                            });
                        },
                        function (err) {
                            if (err) {
                                return reject(err);
                            }
                            resolve({ todoJustCompleted: todoJustCompleted });
                        })
                }
                else {
                    resolve({ todoJustCompleted: todoJustCompleted });
                }
            }).catch(function(err){
                services.helpers.handleReject(err, reject);
            });
        })
    })
};

TodoController.prototype.markUserTodoRead = function (req, res) {
    return Q.Promise(function (resolve, reject) {
        models.UserTodo.find({
            where: {
                id: req.body.userTodo.id
            }
        }).then(function (foundUserTodo) {
            foundUserTodo.status = 'completed';
            foundUserTodo.save().then(function(){
                res.sendSuccess();
            })
        })
    })
};

module.exports = controller;