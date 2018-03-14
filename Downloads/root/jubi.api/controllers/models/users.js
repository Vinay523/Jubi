var models = require('../../models');
var services = require('../../services');
var controllerBase = require('./controllerBase');
var Q = require('q');
var util = require('util');
var bcrypt = require('bcrypt-nodejs');
var async = require('async');
var _ = require('underscore');


function UserController(model) {
    controllerBase.call(this, model);
}
util.inherits(UserController, controllerBase);
var controller = new UserController(models.User);
module.exports = controller;

UserController.prototype.retrieveDeletedCount = function (req, res) {
    var clients = [];

    var continueLoadUsers = function () {
        if (clients.length == 0) {
            var opts = {
                where: {
                    deletedAt: {
                        $ne: null
                    }
                },
                paranoid: false,
            };
        } else {
            var opts = {
                where: {
                    deletedAt: {
                        $ne: null
                    }
                },
                paranoid: false,
                include: [{
                    model: models.Client,
                    as: 'clients',
                    where: {
                        id: {
                            $in: _.pluck(clients, 'id')
                        }
                    }
                }]
            };
        }

        models.User.count(opts)
            .then(function (count) {
                res.sendSuccess({count: count});
            })
            .catch(function (err) {
                res.sendError(err);
            });
    };

    if (services.helpers.isInRole(services.helpers.roleIds.ClientAdmin, req.user)) {
        services.helpers.getClientHierarchy(req.user.clients[0].id)
            .then(function (foundClients) {
                clients.push(req.user.clients[0]);
                clients = clients.concat(foundClients);
                continueLoadUsers();
            })
    } else {
        continueLoadUsers();
    }

};

UserController.prototype.getSecurityCode = function (req, res) {
    var token = services.helpers.makeToken(50);
    models.User.find({
            where: {
                id: req.user.id
            }
        })
        .then(function (user) {
            user.securityCode = token;
            user.securityCodeCreatedAt = new Date();
            user.save()
                .then(function (count) {
                    res.sendSuccess({code: token})
                })
                .catch(function (err) {
                    res.sendError(err);
                });
        });
};

UserController.prototype.redirectToUi = function (req, res) {
    res.redirect(config.web.appUrl + '/auth/redirect/' + req.params.code);
};

UserController.prototype._create = function (newUser, t) {
    return Q.Promise(function (resolve, reject) {
            async.waterfall([
                    // Create new user as needed
                    function (callback) {
                        // New user?
                        if (newUser.id == 0) {
                            models.User.find(
                                {
                                    where: {email: newUser.email}
                                })
                                .then(function (user) {
                                    if (!user) {
                                        models.User.build({
                                            firstName: newUser.firstName,
                                            lastName: newUser.lastName,
                                            email: newUser.email,
                                            password: bcrypt.hashSync(newUser.password),
                                            title: newUser.title,
                                            why: newUser.why,
                                            destination: newUser.destination
                                        }).save({transaction: t})
                                            .then(function (user) {
                                                logger.info('User created: [%d] %s %s', user.id, user.firstName, user.lastName);
                                                callback(null, user);
                                            })
                                            .catch(function (err) {
                                                services.helpers.handleReject(err, callback);
                                            });
                                    } else {
                                        services.helpers.handleReject('Cannot create user, email address in use!', callback);
                                    }
                                })
                                .catch(function (err) {
                                    services.helpers.handleReject(err, callback);
                                })
                        } else {
                            // Update user!
                            models.User.findById(newUser.id)
                                .then(function (user) {
                                    user.firstName = newUser.firstName;
                                    user.lastName = newUser.lastName;
                                    user.email = newUser.email;
                                    user.why = newUser.why;
                                    user.destination = newUser.destination;
                                    if (newUser.password)
                                        user.password = bcrypt.hashSync(newUser.password);
                                    user.title = newUser.title;
                                    user.save({transaction: t})
                                        .then(function (user) {
                                            logger.info('User updated: [%d] %s %s', user.id, user.firstName, user.lastName);
                                            callback(null, user);
                                        })
                                        .catch(function (err) {
                                            services.helpers.handleReject(err, callback);
                                        });

                                })
                                .catch(function (err) {
                                    services.helpers.handleReject(err, callback);
                                });
                        }
                    },

                    // Update user's role
                    function (user, callback) {

                        // Remove all existing roles links, as needed.
                        models.UserRole.destroy({
                                where: {userId: user.id},
                                transaction: t
                            })
                            .then(function () {
                                // Link to role
                                models.UserRole.build({
                                    userId: user.id,
                                    roleId: newUser.role.id
                                }).save({transaction: t})
                                    .then(function (ur) {
                                        logger.info('User [%d] added to role [%d]', ur.userId, ur.roleId);
                                        callback(null, user);
                                    })
                                    .catch(function (err) {
                                        services.helpers.handleReject(err, callback);
                                    });
                            })
                            .catch(function (err) {
                                services.helpers.handleReject(err, callback);
                            });
                    },

                    // Update user's client
                    function (user, callback) {

                        models.ClientUser.find({
                            where: {userId: user.id}
                        }).then(function (clientUser) {

                            var continueUpdateClientUsers = function () {
                                // Remove all existing client links, as needed.
                                models.ClientUser.destroy({
                                        where: {userId: user.id},
                                        transaction: t
                                    })
                                    .then(function () {
                                        // Link to client
                                        models.ClientUser.build({
                                            userId: user.id,
                                            clientId: newUser.client.id
                                        }).save({transaction: t})
                                            .then(function (cu) {
                                                logger.info('User [%d] added to client [%d]', cu.userId, cu.clientId);
                                                callback(null, user);
                                            })
                                            .catch(function (err) {
                                                services.helpers.handleReject(err, callback);
                                            });


                                    })
                                    .catch(function (err) {
                                        services.helpers.handleReject(err, callback);
                                    });

                            };

                            if (clientUser && clientUser.clientId != newUser.client.id) {
                                // If the client has changes, then remove all of the users programUser records since those are programs
                                //from the old client
                                models.ProgramUser.destroy({
                                    where: {userId: user.id},
                                    transaction: t
                                }).then(continueUpdateClientUsers)
                            } else {
                                continueUpdateClientUsers();
                            }
                        })
                    }
                ],
                function (err, user) {
                    if (err) {
                        reject(err)
                    }
                    resolve(user)
                }
            );
        });
};

UserController.prototype.create = function (req, res) {
    models.sequelize.transaction().then(function (t) {
        UserController.prototype._create(req.body , t).then(function (user) {
            t.commit().then(function () {
                res.sendSuccess(user);
            });
        }).catch(function (err) {
            t.rollback().then(function () {
                res.sendError(err);
            });
        })
    });
};

UserController.prototype.checkEmail = function (req, res) {
    this.context.find({
            where: {
                email: req.body.email
            }
        })
        .then(function (result) {
            if (result == null) return res.sendSuccess('OK');
            else if (result.id == req.user.id) return res.sendSuccess('OWN');
            res.sendSuccess('DUP');
        }).catch(function (err) {
        res.sendError(err);
    });
};

UserController.prototype.cancelEmailUpdate = function (req, res) {
    this.context.find({
            where: {
                id: req.user.id
            }
        })
        .then(function (user) {
            user.pendingEmail = null;
            user.tempToken = null;
            user.save();
            res.sendSuccess('OK');
        }).catch(function (err) {
        res.sendError(err);
    });
};

UserController.prototype.validateEmailUpdate = function (req, res) {
    this.context.find({
            where: {
                tempToken: req.params.token
            }
        })
        .then(function (user) {
            user.email = user.pendingEmail;
            user.pendingEmail = null;
            user.tempToken = null;
            user.save();
            res.sendSuccess('OK');
        }).catch(function (err) {
        res.sendError(err);
    });
};


UserController.prototype.retrieve = function (req, res) {

    var id = req.params.id;

    this.context.findOne({
            where: {id: id},
            include: [
                {model: models.Client, as: 'clients'},
                {model: models.Role, as: 'roles'}
            ]
        })
        .then(function (result) {
            if (result == null) return res.json({count: 0, data: null});
            result.avatarUrl = services.helpers.makeMediaUrl(result.avatarUrl);
            res.sendSuccess({count: 1, data: result});
        })
        .catch(function (err) {
            res.sendError(err);
        });

};

UserController.prototype.retrieveNetworkUser = function (req, res) {

    var id = req.params.id;
    Q.all([
        this.context.findOne({
            where: {id: id},
            include: [
                {model: models.Client, as: 'clients'},
                {model: models.Role, as: 'roles'}
            ],
            attributes: ['id', 'avatarUrl', 'firstName', 'lastName', 'why', 'destination', 'title', 'email']
        }),
        models.UserBadge.findAll({
            where: {
                earned: true,
                userId: req.params.id
            },
            include: [
                {
                    model: models.Badge,
                    as: 'badge',
                    where: {
                        programId: req.params.programId
                    }
                }
            ]
        })
    ]).spread(function (result, userBadges) {
        result = JSON.stringify(result);
        result = JSON.parse(result);
        userBadges = JSON.stringify(userBadges);
        userBadges = JSON.parse(userBadges);

        if (result == null) return res.json(null);
        result.avatarUrl = services.helpers.makeMediaUrl(result.avatarUrl);
        result.badges = userBadges;
        _.each(result.badges, function (badge) {
            badge.badge.imageUrl = services.helpers.makeMediaUrl(badge.badge.imageUrl);
        });
        res.sendSuccess(result);
    }).catch(function (err) {
        res.sendError(err);
    });

};

UserController.prototype.retrieveAll = function (req, res) {
    var clients = [];
    var that = this;

    var continueLoadUsers = function () {
        var opts = {};
        if (req.query.trash) {
            opts = {
                where: {
                    deletedAt: {
                        $ne: null
                    }
                },
                paranoid: false
            }
        }
        opts.attributes = ['firstName', 'lastName', 'id', 'avatarUrl', 'updatedAt', 'createdAt', 'email', 'pendingEmail', 'title', 'why', 'destination'];

        opts.include = [
            {
                model: models.Client,
                as: 'clients'
            },
            {
                model: models.Role,
                as: 'roles'
            },
            {
                model: models.ProgramUser,
                as: 'programUsers'
            }
        ];

        if (clients.length > 0) {
            opts.include[0].where = {
                id: {
                    $in: _.pluck(clients, 'id')
                }
            }
        }

        var user = req.user;


        that.context.findAndCountAll(opts)
            .then(function (users) {
                if (users == null) {
                    return res.sendSuccess({count: 0, data: null});
                }
                res.sendSuccess({count: users.count, users: users.rows, allPrograms: allPrograms});
            }).catch(function (err) {
            res.sendError(err);
        });
    };

    if (services.helpers.isInRole(services.helpers.roleIds.ClientAdmin, req.user)) {
        services.helpers.getClientHierarchy(req.user.clients[0].id)
            .then(function (foundClients) {
                clients.push(req.user.clients[0]);
                clients = clients.concat(foundClients);
                continueLoadUsers();
            })
    } else {
        continueLoadUsers();
    }
};

UserController.prototype.getProgramsForAssign = function (req, res) {
    var clients = [];
    var continueGetPrograms = function () {
        var sql =
            'SELECT P.id, P.linkId, P.slug, P.title, P.contentProviderId, P.clientId  FROM Programs P \n' +
            'JOIN Clients C ON C.id=P.clientId \n' +
            'WHERE P.deletedAt IS NULL \n' +
            'AND P.status != \'preview\' \n' +
            'AND P.published IS NOT NULL \n' +
            'AND P.id in \n' +
            '(SELECT MAX(P.id) FROM Programs P \n' +
            'JOIN Clients C ON C.id=P.clientId \n' +
            'WHERE P.deletedAt IS NULL \n' +
            'AND P.status != \'preview\' \n' +
            'AND P.published IS NOT NULL \n' +
            'GROUP BY P.linkId) \n';
        if (clients.length > 0) {
            sql += ' AND C.id in (' + _.pluck(clients, 'id').join(',') + ')';
        }
        sql += 'GROUP BY P.linkId';


        //Took this query from get_program_user stored proc to get only the most recent published programs
        models.sequelize.query(sql, {
                type: models.sequelize.QueryTypes.SELECT
            }
        ).then(function (programs) {
            res.sendSuccess(programs);
        }).catch(function (err) {
            res.sendError(err);
        })
    };


    if (services.helpers.isInRole(services.helpers.roleIds.ClientAdmin, req.user)) {
        services.helpers.getClientHierarchy(req.user.clients[0].id)
            .then(function (foundClients) {
                clients.push(req.user.clients[0]);
                clients = clients.concat(foundClients);
                continueGetPrograms();
            })
    } else {
        continueGetPrograms();
    }
};

UserController.prototype.retrieveByClientPagedFilteredAndSorted = function (req, res) {
    var that = this;
    order = [];

    //Have to handle order columns manually because the datatables grid wont send the column name for templated columns
    _.each(req.query.order, function (sortObj) {
        var column = req.query.columns[Number(sortObj.column)].data;
        if (column == 'client') {
            column = 'name';
            var newSort = [{model: models.Client, as: 'clients'}, column, sortObj.dir];
            order.push(newSort);
        }
        else if (column == 'name') {
            column = 'firstName';
            var newSort = [column, sortObj.dir];
            order.push(newSort);
        } else if (column == 'role') {
            column = 'name';
            var newSort = [{model: models.Role, as: 'roles'}, column, sortObj.dir];
            order.push(newSort);
        } else if (sortObj.column == 5) {
            column = 'updatedAt';
            var newSort = [{model: models.User, as: 'User'}, column, sortObj.dir];
            order.push(newSort);
        } else if (sortObj.column == 0) {
            column = 'firstName';
            var newSort = [column, sortObj.dir];
            order.push(newSort);
        } else if (column == 'email') {
            var newSort = [column, sortObj.dir];
            order.push(newSort);
        }
    });

    //Gets filtered resultset with ordering, filtering, and paging. Its complicated because of the paging since the joins introdue
    //n number of records per user there is no simple way to limit to the grid page size.
    var sql = 'SELECT `User`.*,' +
        ' `clients`.`id`                  AS `clients.id`,' +
        ' `clients`.`name`                AS `clients.name`,' +
        ' `clients`.`slug`                AS `clients.slug`,' +
        ' `clients`.`seats`               AS `clients.seats`,' +
        ' `clients`.`createdAt`           AS `clients.createdAt`,' +
        ' `clients`.`updatedAt`           AS `clients.updatedAt`,' +
        ' `clients`.`deletedAt`           AS `clients.deletedAt`,' +
        ' `clients`.`parentId`            AS `clients.parentId`,' +
        ' `clients.ClientUser`.`userId`   AS `clients.ClientUser.userId`,' +
        ' `clients.ClientUser`.`clientId` AS `clients.ClientUser.clientId`,' +
        ' `roles`.`id`                    AS `roles.id`,' +
        ' `roles`.`name`                  AS `roles.name`,' +
        ' `roles.UserRole`.`userId`       AS `roles.UserRole.userId`,' +
        ' `roles.UserRole`.`roleId`       AS `roles.UserRole.roleId`,' +
        ' `programusers`.`id`             AS `programUsers.id`,' +
        ' `programusers`.`linkId`         AS `programUsers.linkId`,' +
        ' `programusers`.`createdAt`      AS `programUsers.createdAt`,' +
        ' `programusers`.`updatedAt`      AS `programUsers.updatedAt`,' +
        ' `programusers`.`userId`         AS `programUsers.userId`' +
        ' FROM   (SELECT `User`.`firstName`,' +
        ' `User`.`lastName`,' +
        ' `User`.`id`,' +
        ' `User`.`avatarUrl`,' +
        ' `User`.`updatedAt`,' +
        ' `User`.`createdAt`,' +
        ' `User`.`email`,' +
        ' `User`.`pendingEmail`,' +
        ' `User`.`title`,' +
        ' `User`.`why`,' +
        ' `User`.`destination`' +
        ' FROM   `Users` AS `User`' +
        ' WHERE  ( `User`.`deletedAt` IS NULL' +
        ' AND (( `User`.`firstName` LIKE :firstName' +
        ' OR (CONCAT(`User`.`firstName`, \' \', `User`.`lastName`) LIKE :firstName) ' +
        ' OR `User`.`lastName` LIKE :lastName )' +
        ' AND `User`.`email` LIKE :email ))) AS `User`' +
        ' INNER JOIN (`ClientUsers` AS `clients.ClientUser`' +
        ' INNER JOIN `Clients` AS `clients`' +
        ' ON `clients`.`id` = `clients.ClientUser`.`clientId`)' +
        ' ON `User`.`id` = `clients.ClientUser`.`userId`' +
        ' AND ( `clients`.`deletedAt` IS NULL' +
        ' AND ( `clients`.`name` LIKE :clientName' +
        ' AND `clients`.`id` = :clientId))' +
        ' INNER JOIN (`UserRoles` AS `roles.UserRole`' +
        ' INNER JOIN `Roles` AS `roles`' +
        ' ON `roles`.`id` = `roles.UserRole`.`roleId`)' +
        ' ON `User`.`id` = `roles.UserRole`.`userId`' +
        ' AND `roles`.`name` LIKE :roleName' +
        ' LEFT OUTER JOIN `ProgramUsers` AS `programusers`' +
        ' ON `User`.`id` = `programusers`.`userId`' +
        ' INNER JOIN' +
        ' (SELECT `User`.`id`' +
        ' FROM   (SELECT `User`.`firstName`,' +
        ' `User`.`lastName`,' +
        ' `User`.`id`,' +
        ' `User`.`avatarUrl`,' +
        ' `User`.`updatedAt`,' +
        ' `User`.`createdAt`,' +
        ' `User`.`email`,' +
        ' `User`.`pendingEmail`,' +
        ' `User`.`title`,' +
        ' `User`.`why`,' +
        ' `User`.`destination`' +
        ' FROM   `Users` AS `User`' +
        ' WHERE  ( `User`.`deletedAt` IS NULL' +
        ' AND (( `User`.`firstName` LIKE :firstName' +
        ' OR (CONCAT(`User`.`firstName`, \' \', `User`.`lastName`) LIKE :firstName) ' +
        ' OR `User`.`lastName` LIKE :lastName )' +
        ' AND `User`.`email` LIKE :email ))) AS `User`' +
        ' INNER JOIN (`ClientUsers` AS `clients.ClientUser`' +
        ' INNER JOIN `Clients` AS `clients`' +
        ' ON `clients`.`id` = `clients.ClientUser`.`clientId`)' +
        ' ON `User`.`id` = `clients.ClientUser`.`userId`' +
        ' AND ( `clients`.`deletedAt` IS NULL ' +
        ' AND ( `clients`.`name` LIKE :clientName' +
        ' AND `clients`.`id` = :clientId))' +
        ' INNER JOIN (`UserRoles` AS `roles.UserRole`' +
        ' INNER JOIN `Roles` AS `roles`' +
        ' ON `roles`.`id` = `roles.UserRole`.`roleId`)' +
        ' ON `User`.`id` = `roles.UserRole`.`userId`' +
        ' AND `roles`.`name` LIKE :roleName' +
        ' LEFT OUTER JOIN `ProgramUsers` AS `programusers`' +
        ' ON `User`.`id` = `programusers`.`userId`' +
        ' GROUP BY User.id ' +
        (order[0] ? 'ORDER BY ' + (order[0][0].as ? order[0][0].as + '.' + order[0][1] + ' ' + order[0][2] + ',User.id' : order[0][0] + ' ' + order[0][1] + ',User.id') : null) + ' ' +
        'LIMIT ' + req.query.length + ' ' +
        'OFFSET ' + req.query.start + ') as u2 ON User.id = u2.id ' +
        (order[0] ? 'ORDER BY ' + (order[0][0].as ? order[0][0].as + '.' + order[0][1] + ' ' + order[0][2] + ',User.id' : order[0][0] + ' ' + order[0][1] + ',User.id') : null) + ' ';

    //Gets the filtered result count without paging
    var countSql = ' SELECT COUNT(*) FROM (' +
        ' SELECT `User`.`id` FROM  `Users` as `User`' +
        ' INNER JOIN (`ClientUsers` AS `clients.ClientUser` INNER JOIN `Clients` AS `clients` ON `clients`.`id` = `clients.ClientUser`.`clientId`) ON `User`.`id` = `clients.ClientUser`.`userId` AND ( `clients`.`deletedAt` IS NULL  ' +
        ' AND ( `clients`.`name` LIKE :clientName AND `clients`.`id` = :clientId)) ' +
        ' INNER JOIN (`UserRoles` AS `roles.UserRole` INNER JOIN `Roles` AS `roles` ON `roles`.`id` = `roles.UserRole`.`roleId`)' +
        ' ON `User`.`id` = `roles.UserRole`.`userId` AND `roles`.`name` LIKE :roleName ' +
        ' LEFT OUTER JOIN `ProgramUsers` AS `programusers` ON `User`.`id` = `programusers`.`userId`' +
        ' WHERE' +
        '    `User`.`deletedAt` IS NULL' +
        ' AND (' +
        '    ( `User`.`firstName` LIKE :firstName' +
        ' OR (CONCAT(`User`.`firstName`, \' \', `User`.`lastName`) LIKE :firstName) ' +
        ' OR `User`.`lastName` LIKE :lastName )' +
        ' AND `User`.`email` LIKE :email)' +
        ' GROUP BY `User`.`id`) as users';


    var options = {
        replacements: {
            firstName: '%' + req.query.columns[0].search.value + '%',
            lastName: '%' + req.query.columns[0].search.value + '%',
            email: '%' + req.query.columns[1].search.value + '%',
            clientName: '%' + req.query.columns[3].search.value + '%',
            roleName: '%' + req.query.columns[2].search.value + '%',
            clientId: req.query.clientId
        },
        type: models.sequelize.QueryTypes.SELECT
    };

    Q.all([
        models.User.count({
            include: [
                {
                    model: models.Client,
                    as: 'clients',
                    where: {
                        id: req.query.clientId
                    }
                }
            ]
        }),
        models.sequelize.query(sql, options),
        models.sequelize.query(countSql, options)
    ]).spread(function (totalCount, users, count) {
        users = mapUserResults(users);

        var filtered = users.length;
        _.each(users, function (user) {
            user.name = user.firstName + ' ' + user.lastName;
            user.role = user.roles[0].name;
            user.client = user.clients[0].name;
        });


        res.sendSuccess({
            draw: Number(req.query.draw),
            recordsTotal: totalCount,
            recordsFiltered: count[0]['COUNT(*)'],
            data: users
        });
    }).catch(function (err) {
        res.sendError(err);
    });
};

var mapUserResults = function (row) {
    var users = [];
    var currentUser = null;
    _.each(row, function (userRow) {
        if (!currentUser || currentUser.id != userRow.id) {
            var newUser = {
                id: userRow.id,
                firstName: userRow.firstName,
                lastName: userRow.lastName,
                email: userRow.email,
                avatarUrl: userRow.avatarUrl,
                updatedAt: userRow.updatedAt,
                createdAt: userRow.createdAt,
                pendingEmail: userRow.pendingEmail,
                title: userRow.title,
                why: userRow.why,
                destination: userRow.destination,
                clients: [],
                roles: [],
                programUsers: []
            };

            newUser.clients.push(
                {
                    name: userRow['clients.name'],
                    id: userRow['clients.id'],
                    slug: userRow['clients.slug'],
                    seats: userRow['clients.seats'],
                    updatedAt: userRow['clients.updatedAt'],
                    createdAt: userRow['clients.createdAt'],
                    deletedAt: userRow['clients.deletedAt'],
                    parentId: userRow['clients.parentId']
                });

            newUser.roles.push({
                id: userRow['roles.id'],
                name: userRow['roles.name']
            });

            if (Number(userRow['programUsers.id']) > 0) {
                newUser.programUsers.push({
                    id: userRow['programUsers.id'],
                    linkId: userRow['programUsers.linkId'],
                    userId: userRow['programUsers.userId']
                })
            }

            currentUser = newUser;
            users.push(newUser);
        } else {
            if (currentUser.clients[currentUser.clients.length - 1].id != userRow['clients.id']) {
                currentUser.clients.push(
                    {
                        name: userRow['clients.name'],
                        id: userRow['clients.id'],
                        slug: userRow['clients.slug'],
                        seats: userRow['clients.seats'],
                        updatedAt: userRow['clients.updatedAt'],
                        createdAt: userRow['clients.createdAt'],
                        deletedAt: userRow['clients.deletedAt'],
                        parentId: userRow['clients.parentId']
                    });
            }

            if (currentUser.roles[currentUser.roles.length - 1].id != userRow['roles.id']) {
                currentUser.roles.push(
                    {
                        id: userRow['roles.id'],
                        name: userRow['roles.name']
                    });
            }

            if (currentUser.programUsers[currentUser.programUsers.length - 1].id != userRow['programUsers.id']) {
                currentUser.programUsers.push(
                    {
                        id: userRow['programUsers.id'],
                        linkId: userRow['programUsers.linkId'],
                        userId: userRow['programUsers.userId']
                    });
            }
        }
    });

    return users;
};


UserController.prototype.retrieveAllPagedFilteredAndSorted = function (req, res) {
    var clients = [];

    var continueLoadUsers = function () {


        var totalCountsOpts = {
            include: [
                {
                    model: models.Client,
                    as: 'clients'
                }
            ]
        };

        //If clients is populated then the user only has access to these clients
        if (clients.length > 0) {
            totalCountsOpts.include[0].where = {
                id: {
                    $in: _.pluck(clients, 'id')
                }
            };
        } else {
            totalCountsOpts.include[0].required = false;
        }


        //If trash then we need to count only deleted users
        //if not trash then we need to only count users with a client
        if (req.query.trash) {
            totalCountsOpts.where = {
                deletedAt: {
                    $ne: null
                }
            };
            totalCountsOpts.paranoid = false
        }


        var order = [];

        //Have to handle order columns manually because the datatables grid wont send the column name for templated columns
        _.each(req.query.order, function (sortObj) {
            var column = req.query.columns[Number(sortObj.column)].data;
            if (column == 'client') {
                column = 'name';
                var newSort = [{model: models.Client, as: 'clients'}, column, sortObj.dir];
                order.push(newSort);
            }
            else if (column == 'name') {
                column = 'firstName';
                var newSort = [column, sortObj.dir];
                order.push(newSort);
            } else if (column == 'role') {
                column = 'name';
                var newSort = [{model: models.Role, as: 'roles'}, column, sortObj.dir];
                order.push(newSort);
            } else if (sortObj.column == 5) {
                column = 'updatedAt';
                var newSort = [{model: models.User, as: 'User'}, column, sortObj.dir];
                order.push(newSort);
            } else if (sortObj.column == 0) {
                column = 'firstName';
                var newSort = [column, sortObj.dir];
                order.push(newSort);
            } else if (column == 'email') {
                var newSort = [column, sortObj.dir];
                order.push(newSort);
            }
        });

        //Gets filtered resultset with ordering, filtering, and paging. Its complicated because of the paging since the joins introdue
        //n number of records per user there is no simple way to limit to the grid page size.
        var sql = 'SELECT `User`.*,' +
            ' `clients`.`id`                  AS `clients.id`,' +
            ' `clients`.`name`                AS `clients.name`,' +
            ' `clients`.`slug`                AS `clients.slug`,' +
            ' `clients`.`seats`               AS `clients.seats`,' +
            ' `clients`.`createdAt`           AS `clients.createdAt`,' +
            ' `clients`.`updatedAt`           AS `clients.updatedAt`,' +
            ' `clients`.`deletedAt`           AS `clients.deletedAt`,' +
            ' `clients`.`parentId`            AS `clients.parentId`,' +
            ' `clients.ClientUser`.`userId`   AS `clients.ClientUser.userId`,' +
            ' `clients.ClientUser`.`clientId` AS `clients.ClientUser.clientId`,' +
            ' `roles`.`id`                    AS `roles.id`,\n' +
            ' `roles`.`name`                  AS `roles.name`,\n' +
            ' `roles.UserRole`.`userId`       AS `roles.UserRole.userId`,\n' +
            ' `roles.UserRole`.`roleId`       AS `roles.UserRole.roleId`,\n' +
            ' `programusers`.`id`             AS `programUsers.id`,' +
            ' `programusers`.`linkId`         AS `programUsers.linkId`,' +
            ' `programusers`.`createdAt`      AS `programUsers.createdAt`,' +
            ' `programusers`.`updatedAt`      AS `programUsers.updatedAt`,' +
            ' `programusers`.`userId`         AS `programUsers.userId`' +
            ' FROM   (SELECT `User`.`firstName`,\n' +
            ' `User`.`lastName`,' +
            ' `User`.`id`,' +
            ' `User`.`avatarUrl`,' +
            ' `User`.`updatedAt`,' +
            ' `User`.`createdAt`,' +
            ' `User`.`deletedAt`,' +
            ' `User`.`email`,' +
            ' `User`.`pendingEmail`,' +
            ' `User`.`title`,' +
            ' `User`.`why`,' +
            ' `User`.`destination`' +
            ' FROM   `Users` AS `User`';
        if (req.query.trash) {
            sql += ' WHERE  ( `User`.`deletedAt` IS NOT NULL AND';
        } else {
            sql += ' WHERE  ( `User`.`deletedAt` IS NULL AND';
        }
        sql += ' (( `User`.`firstName` LIKE \'%' + req.query.columns[0].search.value + '%\'' +
            ' OR `User`.`lastName` LIKE \'%' + req.query.columns[0].search.value + '%\'' +
            ' OR (CONCAT(`User`.`firstName`, \' \', `User`.`lastName`) LIKE \'%' + req.query.columns[0].search.value + '%\')) ' +
            ' AND `User`.`email` LIKE \'%' + req.query.columns[1].search.value + '%\'  ))) AS `User`';
        if (clients.length == 0) {
            sql += ' LEFT OUTER JOIN (`ClientUsers` AS `clients.ClientUser`';
        } else {
            sql += ' INNER JOIN (`ClientUsers` AS `clients.ClientUser`';
        }
        if (clients.length > 0) {
            sql += ' INNER JOIN `Clients` AS `clients`';
        } else {
            sql += ' LEFT OUTER JOIN `Clients` AS `clients`';
        }
        sql += ' ON `clients`.`id` = `clients.ClientUser`.`clientId`)' +
            ' ON `User`.`id` = `clients.ClientUser`.`userId`';
        if (req.query.trash) {
            sql += ' AND ( ';
        } else {
            sql += ' AND ( `clients`.`deletedAt` IS NULL AND';
        }
        sql += ' ( `clients`.`name` LIKE \'%' + req.query.columns[3].search.value + '%\'';
        if (clients.length > 0) {
            sql += ' AND `clients`.`id` in (' + _.pluck(clients, 'id').join(',') + ')))';
        } else {
            sql += '))'
        }
        sql += ' INNER JOIN (`UserRoles` AS `roles.UserRole`' +
            ' INNER JOIN `Roles` AS `roles`' +
            ' ON `roles`.`id` = `roles.UserRole`.`roleId`)' +
            ' ON `User`.`id` = `roles.UserRole`.`userId`' +
            ' AND `roles`.`name` LIKE \'%' + req.query.columns[2].search.value + '%\'' +
            ' LEFT OUTER JOIN `ProgramUsers` AS `programusers`' +
            ' ON `User`.`id` = `programusers`.`userId`' +
            ' INNER JOIN' +
            ' (SELECT `User`.`id`' +
            ' FROM   (SELECT `User`.`firstName`,' +
            ' `User`.`lastName`,' +
            ' `User`.`id`,' +
            ' `User`.`avatarUrl`,' +
            ' `User`.`updatedAt`,' +
            ' `User`.`createdAt`,' +
            ' `User`.`deletedAt`,' +
            ' `User`.`email`,' +
            ' `User`.`pendingEmail`,' +
            ' `User`.`title`,' +
            ' `User`.`why`,' +
            ' `User`.`destination`' +
            ' FROM   `Users` AS `User`';
        if (req.query.trash) {
            sql += ' WHERE  ( `User`.`deletedAt` IS NOT NULL AND';
        } else {
            sql += ' WHERE  ( `User`.`deletedAt` IS NULL AND';
        }
        sql += ' (( `User`.`firstName` LIKE \'%' + req.query.columns[0].search.value + '%\'' +
            ' OR `User`.`lastName` LIKE \'%' + req.query.columns[0].search.value + '%\'' +
            ' OR (CONCAT(`User`.`firstName`, \' \', `User`.`lastName`) LIKE \'%' + req.query.columns[0].search.value + '%\')) ' +
            ' AND `User`.`email` LIKE \'%' + req.query.columns[1].search.value + '%\'  ))) AS `User`';
        if (clients.length == 0) {
            sql += ' LEFT OUTER JOIN (`ClientUsers` AS `clients.ClientUser`';
        } else {
            sql += ' INNER JOIN (`ClientUsers` AS `clients.ClientUser`';
        }
        if (clients.length > 0) {
            sql += ' INNER JOIN `Clients` AS `clients`';
        } else {
            sql += ' LEFT OUTER JOIN `Clients` AS `clients`';
        }
        sql += ' ON `clients`.`id` = `clients.ClientUser`.`clientId`)' +
            ' ON `User`.`id` = `clients.ClientUser`.`userId`';
        if (req.query.trash) {
            sql += ' AND ( ';
        } else {
            sql += ' AND ( `clients`.`deletedAt` IS NULL AND';
        }
        sql += ' ( `clients`.`name` LIKE \'%' + req.query.columns[3].search.value + '%\'';
        if (clients.length > 0) {
            sql += ' AND `clients`.`id` in (' + _.pluck(clients, 'id').join(',') + ')))';
        } else {
            sql += '))'
        }
        sql += ' INNER JOIN (`UserRoles` AS `roles.UserRole`' +
            ' INNER JOIN `Roles` AS `roles`' +
            ' ON `roles`.`id` = `roles.UserRole`.`roleId`)' +
            ' ON `User`.`id` = `roles.UserRole`.`userId`' +
            ' AND `roles`.`name` LIKE \'%' + req.query.columns[2].search.value + '%\'' +
            ' LEFT OUTER JOIN `ProgramUsers` AS `programusers`' +
            ' ON `User`.`id` = `programusers`.`userId`';

        if (clients.length == 0) {
            sql += ' WHERE (`clients`.`name` LIKE \'%' + req.query.columns[3].search.value + '%\' OR ((\'%' + req.query.columns[3].search.value + '%\' = \'%\' OR \'%' + req.query.columns[3].search.value + '%\' = \'%%\') AND `clients`.`name` IS NULL))';
        }
        sql += ' GROUP BY User.id ' +
            (order[0] ? 'ORDER BY ' + (order[0][0].as ? order[0][0].as + '.' + order[0][1] + ' ' + order[0][2] + ',User.id' : order[0][0] + ' ' + order[0][1] + ',User.id') : null) + ' ' +
            'LIMIT ' + req.query.length + ' ' +
            'OFFSET ' + req.query.start + ') as u2 ON User.id = u2.id ' +
            (order[0] ? 'ORDER BY ' + (order[0][0].as ? order[0][0].as + '.' + order[0][1] + ' ' + order[0][2] + ',User.id' : order[0][0] + ' ' + order[0][1] + ',User.id') : null) + ' ';


        //Gets the filtered result count without paging
        var countSql = ' SELECT COUNT(*) FROM (' +
            ' SELECT `User`.`id`,`User`.`deletedAt` FROM  `Users` as `User`';
        if (clients.length == 0) {
            countSql += ' LEFT OUTER JOIN (`ClientUsers` AS `clients.ClientUser`';
        } else {
            countSql += ' INNER JOIN (`ClientUsers` AS `clients.ClientUser`';
        }
        if (clients.length > 0) {
            countSql += ' INNER JOIN `Clients` AS `clients`';
        } else {
            countSql += ' LEFT OUTER JOIN `Clients` AS `clients`';
        }
        countSql += 'ON `clients`.`id` = `clients.ClientUser`.`clientId`) ON `User`.`id` = `clients.ClientUser`.`userId`';
        if (req.query.trash) {
            countSql += ' AND ( ';
        } else {
            countSql += ' AND ( `clients`.`deletedAt` IS NULL AND';
        }
        countSql += ' ( `clients`.`name` LIKE \'%' + req.query.columns[3].search.value + '%\'';
        if (clients.length > 0) {
            countSql += ' AND `clients`.`id` in (' + _.pluck(clients, 'id').join(',') + ')))';
        } else {
            countSql += '))'
        }
        countSql += ' INNER JOIN (`UserRoles` AS `roles.UserRole` INNER JOIN `Roles` AS `roles` ON `roles`.`id` = `roles.UserRole`.`roleId`)' +
            ' ON `User`.`id` = `roles.UserRole`.`userId` AND `roles`.`name` LIKE  \'%' + req.query.columns[2].search.value + '%\' ' +
            ' LEFT OUTER JOIN `ProgramUsers` AS `programusers` ON `User`.`id` = `programusers`.`userId`';
        if (!req.query.trash) {
            countSql += ' WHERE  ( `User`.`deletedAt` IS NULL AND';
        } else {
            countSql += ' WHERE  ( `User`.`deletedAt` IS NOT NULL AND';
        }
        if (clients.length == 0) {
            countSql += ' (`clients`.`name` LIKE \'%' + req.query.columns[3].search.value + '%\' OR ((\'%' + req.query.columns[3].search.value + '%\' = \'%\' OR \'%' + req.query.columns[3].search.value + '%\' = \'%%\') AND `clients`.`name` IS NULL)) AND';
        }
        countSql += ' ( `User`.`firstName` LIKE \'%' + req.query.columns[0].search.value + '%\'' +
            ' OR `User`.`lastName` LIKE \'%' + req.query.columns[0].search.value + '%\'' +
            ' OR (CONCAT(`User`.`firstName`, \' \', `User`.`lastName`) LIKE \'%' + req.query.columns[0].search.value + '%\')) ' +
            ' AND `User`.`email` LIKE \'%' + req.query.columns[1].search.value + '%\')' +
            ' GROUP BY `User`.`id`) as users';


        var opts = {
            type: models.sequelize.QueryTypes.SELECT,
            raw: true
        };


        Q.all([
            models.User.count(totalCountsOpts),
            models.sequelize.query(sql, opts),
            models.sequelize.query(countSql, opts)
        ]).spread(function (totalCount, users, count) {
            users = mapUserResults(users);
            _.each(users, function (user) {
                user.name = user.firstName + ' ' + user.lastName;
                user.role = user.roles[0].name;
                user.client = user.clients[0].name;
            });


            res.sendSuccess({
                draw: Number(req.query.draw),
                recordsTotal: totalCount,
                recordsFiltered: count[0]['COUNT(*)'],
                data: users
            });
        }).catch(function (err) {
            res.sendError(err);
        });
    };

    if (services.helpers.isInRole(services.helpers.roleIds.ClientAdmin, req.user)) {
        services.helpers.getClientHierarchy(req.user.clients[0].id)
            .then(function (foundClients) {
                clients.push(req.user.clients[0]);
                clients = clients.concat(foundClients);
                continueLoadUsers();
            })
    } else {
        continueLoadUsers();
    }
};


UserController.prototype.retrieveUsersForNetwork = function (req, res) {
    var linkId = req.params.linkId;
    var programId = req.params.programId;
    models.ProgramUser.findAll({
        attributes: ['id', 'userId'],
        where: {
            linkId: linkId
        },
        include: [
            {
                model: models.User,
                as: 'user',
                attributes: ['id', 'firstName', 'lastName', 'avatarUrl', 'email']
            }
        ]
    }).then(function (programUsers) {
        var userIds = _.pluck(programUsers, 'userId');

        Q.all([
            models.ForumItem.findAll({
                attributes: ['id', 'createdById', 'type', 'subType', 'createdAgainstId', 'questId'],
                where: {
                    createdById: {
                        $in: userIds
                    }
                },
                include: [
                    {
                        model: models.Forum,
                        as: 'forum',
                        where: {
                            linkId: linkId
                        }
                    },
                    {
                        model: models.BonusPoints,
                        as: 'bonusPoints'
                    },
                    {
                        model: models.ForumItem,
                        as: 'parent'
                    }
                ]
            }),
            models.ForumItem.findAll({
                attributes: ['id', 'createdById', 'type', 'subType', 'createdAgainstId', 'questId'],
                where: {
                    createdAgainstId: {
                        $in: userIds
                    }
                },
                include: [
                    {
                        model: models.Forum,
                        as: 'forum',
                        where: {
                            linkId: linkId
                        }
                    },
                    {
                        model: models.BonusPoints,
                        as: 'bonusPoints'
                    },
                    {
                        model: models.ForumItem,
                        as: 'parent'
                    }
                ]
            }),
            models.ForumItemLike.findAll({
                where: {
                    createdById: {
                        $in: userIds
                    }
                },
                include: [
                    {
                        model: models.ForumItem,
                        as: 'forumItem',
                        include: [
                            {
                                model: models.Forum,
                                as: 'forum',
                                where: {
                                    linkId: linkId
                                }
                            },
                            {
                                model: models.ForumItem,
                                as: 'parent'
                            }
                        ]
                    }
                ],
                attributes: ['id', 'createdById', 'createdAgainstId']
            }),
            models.ForumItemLike.findAll({
                where: {
                    createdAgainstId: {
                        $in: userIds
                    }
                },
                include: [
                    {
                        model: models.ForumItem,
                        as: 'forumItem',
                        include: [
                            {
                                model: models.Forum,
                                as: 'forum',
                                where: {
                                    linkId: linkId
                                }
                            },
                            {
                                model: models.ForumItem,
                                as: 'parent'
                            }
                        ]
                    }
                ],
                attributes: ['id', 'createdById', 'createdAgainstId']
            }),
            models.ForumItemDislike.findAll({
                where: {
                    createdById: {
                        $in: userIds
                    }
                },
                include: [
                    {
                        model: models.ForumItem,
                        as: 'forumItem',
                        include: [
                            {
                                model: models.Forum,
                                as: 'forum',
                                where: {
                                    linkId: linkId
                                }
                            },
                            {
                                model: models.ForumItem,
                                as: 'parent'
                            }
                        ]
                    }
                ],
                attributes: ['id', 'createdById', 'createdAgainstId']
            }),
            models.ForumItemDislike.findAll({
                attributes: ['id'],
                where: {
                    createdAgainstId: {
                        $in: userIds
                    }
                },
                include: [
                    {
                        model: models.ForumItem,
                        as: 'forumItem',
                        include: [
                            {
                                model: models.Forum,
                                as: 'forum',
                                where: {
                                    linkId: linkId
                                }
                            },
                            {
                                model: models.ForumItem,
                                as: 'parent'
                            }
                        ]
                    }
                ],
                attributes: ['id', 'createdById', 'createdAgainstId']
            }),
            models.ChallengeResult.findAll({
                attributes: ['id', 'userId', 'createdAt', 'points'],
                where: {
                    userId: {
                        $in: userIds
                    }
                },
                include: [
                    {
                        model: models.Challenge,
                        as: 'challenge',
                        attributes: ['points', 'id'],
                        include: [
                            {
                                model: models.Quest,
                                as: 'quest',
                                attributes: ['id', 'title', 'levelId', 'programId','inspirePoints'],
                                include: [
                                    {
                                        model: models.Level,
                                        as: 'level',
                                        attributes: ['id', 'title'],
                                        required: false
                                    },
                                    {
                                        model: models.Program,
                                        as: 'program',
                                        attributes: ['id'],
                                        where: {
                                            id: programId
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                ],
                required: false
            }),
            models.UserBadge.findAll({
                where: {
                    userId: {
                        $in: userIds
                    },
                    earned: true
                },
                include: [
                    {
                        model: models.Badge,
                        as: 'badge',
                        where: {
                            programId: programId
                        }
                    }
                ],
                attributes: ['id', 'userId', 'earned']
            }),
            models.UserTodo.findAll({
                where: {
                    userId: {
                        $in: userIds
                    },
                    hasBeenCompleted: true
                },
                attributes: ['id', 'userId', 'status', 'hasBeenCompleted'],
                include: [
                    {
                        model: models.Todo,
                        as: 'todo',
                        where: {
                            programId: programId
                        }
                    },
                    {
                        model: models.BonusPoints,
                        as: 'bonusPoints'
                    }
                ]
            }),
            models.ProgramUserAssociation.findAll({
                where: {
                    typeId: services.helpers.programUserAssociationTypes.buddy.id
                },
                include: [
                    {
                        model: models.ProgramUser,
                        as: 'programUser',
                        where: {
                            linkId: linkId
                        },
                        include: [
                            {
                                model: models.User,
                                as: 'user',
                                where: {
                                    id: req.user.id
                                },
                                required: true,
                                attributes: ['id', 'firstName', 'lastName', 'email', 'title', 'email', 'avatarUrl', 'why', 'destination']
                            }
                        ]
                    }
                ]
            }),
            models.ForumItem.findAll({
                where: {
                    subType: 'appreciation'
                },
                include: [
                    {
                        model: models.ForumItemUser,
                        as: 'users',
                        where: {
                            userId: {
                                $in: userIds
                            }
                        }
                    },
                    {
                        model: models.BonusPoints,
                        as: 'bonusPoints'
                    },
                    {
                        model: models.Forum,
                        as: 'forum',
                        where: {
                            linkId: linkId
                        }
                    }
                ]
            }),
            models.Program.find({
                where: {
                    id: programId
                },
                attributes: ['id'],
                include: [
                    {
                        model: models.Quest,
                        as: 'programQuests',
                        attributes: ['id','type','inspirePoints']
                    }
                ]
            })
        ]).spread(function (createdForumItems, recievedForumItems, createdForumLikes, recievedForumLikes, createdForumDislikes, recievedForumDislikes, challengeResults, userBadges, userTodos, buddyAssociations, appreciations, program) {
            programUsers = JSON.stringify(programUsers);
            programUsers = JSON.parse(programUsers);

            createdForumItems = JSON.stringify(createdForumItems);
            createdForumItems = JSON.parse(createdForumItems);
            recievedForumItems = JSON.stringify(recievedForumItems);
            recievedForumItems = JSON.parse(recievedForumItems);
            createdForumLikes = JSON.stringify(createdForumLikes);
            createdForumLikes = JSON.parse(createdForumLikes);
            recievedForumLikes = JSON.stringify(recievedForumLikes);
            recievedForumLikes = JSON.parse(recievedForumLikes);
            createdForumDislikes = JSON.stringify(createdForumDislikes);
            createdForumDislikes = JSON.parse(createdForumDislikes);
            recievedForumDislikes = JSON.stringify(recievedForumDislikes);
            recievedForumDislikes = JSON.parse(recievedForumDislikes);
            challengeResults = JSON.stringify(challengeResults);
            challengeResults = JSON.parse(challengeResults);
            userBadges = JSON.stringify(userBadges);
            userBadges = JSON.parse(userBadges);
            userTodos = JSON.stringify(userTodos);
            userTodos = JSON.parse(userTodos);
            buddyAssociations = JSON.stringify(buddyAssociations);
            buddyAssociations = JSON.parse(buddyAssociations);
            appreciations = JSON.stringify(appreciations);
            appreciations = JSON.parse(appreciations);

            var questIds = [];
            _.each(program.programQuests, function (quest) {
                questIds.push(quest.id);
            });


            var programUsersToRemove = [];
            _.each(programUsers, function (programUser) {
                if (!programUser.user) {
                    programUsersToRemove.push(programUser);
                }
            });
            programUsers = _.difference(programUsers, programUsersToRemove);

            _.each(programUsers, function (programUser) {
                var discussionScore = {
                    newTopicPoints: 0,
                    newCommentPoints: 0,
                    likePoints: 0,
                    topicCommentPoints: 0,
                    itemLikePoints: 0,
                    newEncouragePoints: 0,
                    newAppreciatePoints: 0,
                    newStoryPoints: 0
                };

                programUser.user.challengeResults = _.filter(challengeResults, function (result) {
                    return result.userId == programUser.user.id;
                });
                programUser.user.todos = _.filter(userTodos, function (todo) {
                    return todo.userId == programUser.user.id;
                });
                programUser.user.badges = _.filter(userBadges, function (badge) {
                    return badge.userId == programUser.user.id;
                });
                programUser.user.createdForumItems = _.filter(createdForumItems, function (forumItem) {
                    return forumItem.createdById == programUser.user.id;
                });
                programUser.user.recievedForumItems = _.filter(recievedForumItems, function (forumItem) {
                    return forumItem.createdAgainstId == programUser.user.id;
                });
                programUser.user.createdForumLikes = _.filter(createdForumLikes, function (forumItem) {
                    return forumItem.createdById == programUser.user.id;
                });
                programUser.user.recievedForumLikes = _.filter(recievedForumLikes, function (forumItem) {
                    return forumItem.createdAgainstId == programUser.user.id;
                });
                programUser.user.createdForumDislikes = _.filter(createdForumDislikes, function (forumItem) {
                    return forumItem.createdById == programUser.user.id;
                });
                programUser.user.recievedForumDislikes = _.filter(recievedForumDislikes, function (forumItem) {
                    return forumItem.createdAgainstId == programUser.user.id;
                });
                programUser.user.recievedAppreciations = _.filter(appreciations, function (appreciation) {
                    //Checking if length equals 2 because we only allow bonus points on appreciations sent to a single user,
                    //meaning there are 2 users total (the user who sent it and the user who recieved it)
                    if (appreciation.users.length == 2) {
                        var user = _.find(appreciation.users, function (user) {
                            return user.userId == programUser.user.id
                        });
                        return user != null && appreciation.createdById != user.userId;
                    } else {
                        return false;
                    }
                });

                programUser.points = 0;
                programUser.avatarUrl = services.helpers.makeMediaUrl(programUser.user.avatarUrl);
                _.each(program.programQuests, function (quest) {
                    if (quest.type == 'I' && services.quests.isQuestComplete(quest, programUser.user.createdForumItems)) {
                        programUser.points += quest.inspirePoints;
                    }
                });

                _.each(programUser.user.todos, function (userTodo) {
                    if (userTodo.hasBeenCompleted) {
                        programUser.points += userTodo.todo.points;
                        if (userTodo.bonusPoints) {
                            _.each(userTodo.bonusPoints, function (pointsRecord) {
                                programUser.points += pointsRecord.points;
                            })
                        }
                    }
                });

                //Get all results for this program
                var currentResults = _.filter(programUser.user.challengeResults, function (challengeResult) {
                    return challengeResult.challenge.quest && challengeResult.challenge.quest.program && challengeResult.challenge.quest.program.id == programId;
                });

                //Ensure that only one result from a challenge is counted
                var challengeIdsAnswered = [];
                _.each(programUser.user.challengeResults, function (challengeResult) {
                    if (challengeIdsAnswered.indexOf(challengeResult.challenge.id) == -1) {
                        challengeIdsAnswered.push(challengeResult.challenge.id);
                        programUser.points += challengeResult.points;
                    }
                });


                if (currentResults.length > 0) {
                    //Get the most recent result
                    var currentResult = _.max(currentResults, function (result) {
                        return new Date(result.createdAt);
                    });
                }

                if (currentResult && currentResult.challenge.quest.level) {
                    programUser.level = currentResult.challenge.quest.level.title;
                } else if (currentResult) {
                    programUser.level = currentResult.challenge.quest.title;
                }

                programUser.user.challengeResults = undefined;

                var topicsCreatedByUser = _.filter(programUser.user.createdForumItems, function (forumItem) {
                    return forumItem.type == 'topic' && forumItem.subType == null;
                });
                _.each(topicsCreatedByUser, function (topic) {
                    if (topic.questId == null || questIds.indexOf(topic.questId) != -1) {
                        if (!topic.forum.newTopicPointsMax || (discussionScore.newTopicPoints + topic.forum.newTopicPoints) <= topic.forum.newTopicPointsMax) {
                            programUser.points += topic.forum.newTopicPoints ? topic.forum.newTopicPoints : 0;
                            discussionScore.newTopicPoints += topic.forum.newTopicPoints ? topic.forum.newTopicPoints : 0;
                        }
                    }
                });


                var encouragementFromUser = _.filter(programUser.user.createdForumItems, function (forumItem) {
                    return forumItem.type == 'topic' && forumItem.subType == 'encouragement';
                });
                _.each(encouragementFromUser, function (encouragement) {
                    if (!encouragement.forum.newEncouragePointsMax || (discussionScore.newEncouragePoints + encouragement.forum.newEncouragePoints) <= encouragement.forum.newEncouragePointsMax) {
                        programUser.points += encouragement.forum.newEncouragePoints ? encouragement.forum.newEncouragePoints : 0;
                        discussionScore.newEncouragePoints += encouragement.forum.newEncouragePoints ? encouragement.forum.newEncouragePoints : 0;
                    }
                });


                var appreciationFromUser = _.filter(programUser.user.createdForumItems, function (forumItem) {
                    return forumItem.type == 'topic' && forumItem.subType == 'appreciation';
                });
                _.each(appreciationFromUser, function (appreciation) {
                    if (!appreciation.forum.newAppreciatePointsMax || (discussionScore.newAppreciatePoints + appreciation.forum.newAppreciatePoints) <= appreciation.forum.newAppreciatePointsMax) {
                        programUser.points += appreciation.forum.newAppreciatePoints ? appreciation.forum.newAppreciatePoints : 0;
                        discussionScore.newAppreciatePoints += appreciation.forum.newAppreciatePoints ? appreciation.forum.newAppreciatePoints : 0;
                    }
                });


                var storiesFromUser = _.filter(programUser.user.createdForumItems, function (forumItem) {
                    return forumItem.type == 'topic' && forumItem.subType == 'story';
                });
                _.each(storiesFromUser, function (story) {
                    if (!story.forum.newStoryPointsMax || (discussionScore.newStoryPoints + story.forum.newStoryPoints) <= story.forum.newStoryPointsMax) {
                        programUser.points += story.forum.newStoryPoints ? story.forum.newStoryPoints : 0;
                        discussionScore.newStoryPoints += story.forum.newStoryPoints ? story.forum.newStoryPoints : 0;
                    }
                });

                var commentCreatedByUser = _.filter(programUser.user.createdForumItems, function (forumItem) {
                    return forumItem.type == 'comment';
                });
                _.each(commentCreatedByUser, function (comment) {
                    if (comment.parent.questId == null || questIds.indexOf(comment.parent.questId) != -1) {
                        if (!comment.forum.newCommentPointsMax || (discussionScore.newCommentPoints + comment.forum.newCommentPoints) <= comment.forum.newCommentPointsMax) {
                            programUser.points += comment.forum.newCommentPoints ? comment.forum.newCommentPoints : 0;
                            discussionScore.newCommentPoints += comment.forum.newCommentPoints ? comment.forum.newCommentPoints : 0;
                        }
                    }
                });


                var commentCreatedAgainstUser = _.filter(programUser.user.recievedForumItems, function (forumItem) {
                    return forumItem.type == 'comment' && forumItem.createdAgainstId != programUser.user.id;
                });

                _.each(commentCreatedAgainstUser, function (forumItem) {
                    if (comment.parent.questId == null || questIds.indexOf(comment.parent.questId) != -1) {
                        if (!forumItem.forum.topicCommentPointsMax || (discussionScore.topicCommentPoints + forumItem.forum.topicCommentPoints) <= forumItem.forum.topicCommentPointsMax) {
                            programUser.points += forumItem.forum.topicCommentPoints ? forumItem.forum.topicCommentPoints : 0;
                            discussionScore.topicCommentPoints += forumItem.forum.topicCommentPoints ? forumItem.forum.topicCommentPoints : 0;
                        }
                    }
                });

                _.each(programUser.user.createdForumLikes, function (like) {
                    if ((like.forumItem.parent && (like.forumItem.parent.questId == null || questIds.indexOf(like.forumItem.parent.questId) != -1))
                        || (!like.forumItem.parent && (like.forumItem.questId == null || questIds.indexOf(like.forumItem.questId) != -1))) {
                        if (like.createdById != like.createdAgainstId) {
                            if (!like.forumItem.forum.likePointsMax || (discussionScore.likePoints + like.forumItem.forum.likePoints) <= like.forumItem.forum.likePointsMax) {
                                programUser.points += like.forumItem.forum.likePoints ? like.forumItem.forum.likePoints : 0;
                                discussionScore.likePoints += like.forumItem.forum.likePoints ? like.forumItem.forum.likePoints : 0;
                            }
                        }
                    }
                });

                _.each(programUser.user.createdForumDislikes, function (like) {
                    if ((like.forumItem.parent && (like.forumItem.parent.questId == null || questIds.indexOf(like.forumItem.parent.questId) != -1))
                        || (!like.forumItem.parent && (like.forumItem.questId == null || questIds.indexOf(like.forumItem.questId) != -1))) {
                        if (like.createdById != like.createdAgainstId) {
                            if (!like.forumItem.forum.likePointsMax || (discussionScore.likePoints + like.forumItem.forum.likePoints) <= like.forumItem.forum.likePointsMax) {
                                programUser.points += like.forumItem.forum.likePoints ? like.forumItem.forum.likePoints : 0;
                                discussionScore.likePoints += like.forumItem.forum.likePoints ? like.forumItem.forum.likePoints : 0;
                            }
                        }
                    }
                });

                _.each(programUser.user.recievedForumLikes, function (dislike) {
                    if ((dislike.forumItem.parent && (dislike.forumItem.parent.questId == null || questIds.indexOf(dislike.forumItem.parent.questId) != -1))
                        || (!dislike.forumItem.parent && (dislike.forumItem.questId == null || questIds.indexOf(dislike.forumItem.questId) != -1))) {
                        if (dislike.createdById != dislike.createdAgainstId) {
                            if (!dislike.forumItem.forum.itemLikePointsMax || (discussionScore.itemLikePoints + dislike.forumItem.forum.itemLikePoints) <= dislike.forumItem.forum.itemLikePointsMax) {
                                programUser.points += dislike.forumItem.forum.itemLikePoints ? dislike.forumItem.forum.itemLikePoints : 0;
                                discussionScore.itemLikePoints += dislike.forumItem.forum.itemLikePoints ? dislike.forumItem.forum.itemLikePoints : 0;
                            }
                        }
                    }
                });

                _.each(programUser.user.recievedForumDislikes, function (dislike) {
                    if ((dislike.forumItem.parent && (dislike.forumItem.parent.questId == null || questIds.indexOf(dislike.forumItem.parent.questId) != -1))
                        || (!dislike.forumItem.parent && (dislike.forumItem.questId == null || questIds.indexOf(dislike.forumItem.questId) != -1))) {
                        if (dislike.createdById != dislike.createdAgainstId) {
                            if (!dislike.forumItem.forum.itemLikePointsMax || (discussionScore.itemLikePoints + dislike.forumItem.forum.itemLikePoints) <= dislike.forumItem.forum.itemLikePointsMax) {
                                programUser.points += dislike.forumItem.forum.itemLikePoints ? dislike.forumItem.forum.itemLikePoints : 0;
                                discussionScore.itemLikePoints += dislike.forumItem.forum.itemLikePoints ? dislike.forumItem.forum.itemLikePoints : 0;
                            }
                        }
                    }
                });

                _.each(programUser.user.recievedAppreciations, function (recAppreciation) {
                    _.each(recAppreciation.bonusPoints, function (pointsRecord) {
                        programUser.points += pointsRecord.points;
                    })
                });

            });

            _.each(buddyAssociations, function (association) {
                association.programUser = undefined;
            });

            res.sendSuccess({programUsers: programUsers, buddyAssociations: buddyAssociations});
        });
    }).catch(function (err) {
        res.sendError(err);
    });
};

UserController.prototype.retrieveUsersForNetworkSimple = function (req, res) {
    models.ProgramUser.findAll({
        attributes: ['id', 'userId'],
        where: {
            linkId: req.params.linkId
        },
        include: [
            {
                model: models.User,
                as: 'user',
                attributes: ['id', 'firstName', 'lastName', 'avatarUrl', 'email']
            }
        ]
    }).then(function (programUsers) {
        programUsers = JSON.stringify(programUsers);
        programUsers = JSON.parse(programUsers);
        var usersToRemove = [];
        _.each(programUsers, function (programUser) {
            if (programUser.user) {
                programUser.user.avatarUrl = services.helpers.makeMediaUrl(programUser.user.avatarUrl);
            } else {
                usersToRemove.push(programUser);
            }
        });
        programUsers = _.difference(programUsers, usersToRemove);
        res.sendSuccess(programUsers);
    }).catch(function (err) {
        res.sendError(err);
    });
};


UserController.prototype.update = function (req, res) {

    models.sequelize.transaction().then(function (t) {
        models.User.find({
                where: {id: req.params.id}
            })
            .then(function (user) {
                if (user == null) {
                    t.rollback().then(function () {
                        res.status(404).end('Not Found');
                    });
                    return null;
                }

                if (!user.pendingEmail && req.body.pendingEmail && !user.tempToken) {
                    user.tempToken = services.helpers.encrypt(util.format('%d|%d', user.id, new Date().getTime()));
                } else {
                    user.tempToken = null;
                }

                user.pendingEmail = req.body.pendingEmail;
                if (req.body.password) user.password = bcrypt.hashSync(req.body.password);
                user.firstName = req.body.firstName;
                user.lastName = req.body.lastName;
                user.title = req.body.title;
                user.avatarUrl = services.helpers.makeImageRef(req.body.avatarUrl);
                user.why = req.body.why;
                user.destination = req.body.destination;

                user.save({transaction: t})
                    .then(function (user) {
                        if (user.tempToken && user.pendingEmail) {
                            var reset_url = config.web.appUrl + '/?token=' + user.tempToken;
                            var data = {
                                resetUrl: reset_url
                            };
                            services.email.email("Jubi Platform Email Updated Confirmation", user.pendingEmail, "confirmEmailUpdate", "main", data);
                            services.email.email("Jubi Platform Email Updated Notification", user.email, "emailUpdated", "main", data);
                        }
                        t.commit().then(function () {
                            res.status(200).end('OK');
                        });
                    })
                    .catch(function (err) {
                        t.rollback().then(function () {
                            res.sendError(err);
                        });
                    });
            })
            .catch(function (err) {
                t.rollback().then(function () {
                    res.sendError(err);
                });
            });
    });
};

UserController.prototype.addBuddy = function (req, res) {
    models.sequelize.transaction().then(function (t) {
        models.ProgramUser.find({
            where: {id: req.params.id}
        }).then(function (programUser) {
                models.ProgramUser.find({
                    where: {
                        userId: req.user.id,
                        linkId: programUser.linkId
                    }
                }).then(function (myProgramUser) {
                    models.ProgramUserAssociation.findOne({
                        where: {
                            programUserId: myProgramUser.id,
                            associatedProgramUserId: programUser.id,
                            typeId: services.helpers.programUserAssociationTypes.buddy.id
                        },
                        paranoid: true
                    }).then(function (association) {
                        if (!association) {
                            models.ProgramUserAssociation.create({
                                programUserId: myProgramUser.id,
                                associatedProgramUserId: programUser.id,
                                typeId: services.helpers.programUserAssociationTypes.buddy.id
                            }, {transaction: t}).then(function () {
                                t.commit().then(function () {
                                    res.sendSuccess(programUser);
                                });
                            }).catch(function (err) {
                                t.rollback().then(function () {
                                    res.sendError(err);
                                });
                            });
                        } else {
                            if (association.deletedAt) {
                                association.deletedAt = null;
                                association.save({transaction: t});
                                t.commit().then(function () {
                                    res.sendSuccess(programUser);
                                });
                            } else {
                                t.rollback().then(function () {
                                    res.sendError('User already associated');
                                });
                            }
                        }
                    }).catch(function (err) {
                        t.rollback().then(function () {
                            res.sendError(err);
                        });
                    });
                }, {transaction: t}).catch(function (err) {
                    t.rollback().then(function () {
                        res.sendError(err);
                    });
                });
            })
            .catch(function (err) {
                t.rollback().then(function () {
                    res.sendError(err);
                });
            });
    });
};

UserController.prototype.removeBuddy = function (req, res) {
    models.sequelize.transaction().then(function (t) {
        models.ProgramUser.find({
                where: {id: req.params.id}
            })
            .then(function (programUser) {
                models.ProgramUser.find({
                    where: {
                        userId: req.user.id,
                        linkId: programUser.linkId
                    }
                }).then(function (myProgramUser) {
                    models.ProgramUserAssociation.findOne({
                        where: {
                            programUserId: myProgramUser.id,
                            associatedProgramUserId: programUser.id,
                            typeId: services.helpers.programUserAssociationTypes.buddy.id
                        }
                    }).then(function (association) {
                        association.destroy({transaction: t}).then(function () {
                            t.commit().then(function () {
                                res.sendSuccess(programUser);
                            });
                        }).catch(function (err) {
                            t.rollback().then(function () {
                                res.sendError(err);
                            });
                        });
                    }).catch(function (err) {
                        t.rollback().then(function () {
                            res.sendError(err);
                        });
                    });
                }, {transaction: t}).catch(function (err) {
                    t.rollback().then(function () {
                        res.sendError(err);
                    });
                });
            })
            .catch(function (err) {
                t.rollback().then(function () {
                    res.sendError(err);
                });
            });
    });
};

UserController.prototype.unassignProgramUser = function (req, res) {
    models.sequelize.transaction().then(function (t) {
        controller._unassignProgramUser(req.body.userId, req.body.linkId, t).then(function (response) {
            t.commit().then(function () {
                res.sendSuccess(response);
            });
        }).catch(function (err) {
            t.rollback().then(function () {
                res.sendError(err);
            });
        })
    });
};


UserController.prototype._unassignProgramUser = function (userId, linkId, t) {
    return Q.Promise(function (resolve, reject) {
        models.ProgramUser.destroy({
            where: {
                linkId: linkId,
                userId: userId
            }
        }, {transaction: t}).then(function () {
            resolve();
        }).catch(function (err) {
            reject(err);
        })
    });
};

UserController.prototype._getProgramUserGroup = function (groupId) {
    return Q.Promise(function (resolve, reject) {
        models.ProgramUserGroup.find({
            where: {
                id: groupId
            },
            include: [
                {
                    model: models.ProgramUserGroupUser,
                    as: 'programUsers',
                    include: [
                        {
                            model: models.ProgramUser,
                            as: 'programUser',
                            include: [
                                {
                                    model: models.User,
                                    as: 'user'
                                }
                            ]
                        }
                    ]
                }
            ]
        }).then(function (group) {
            resolve(group);
        })
    });
};

UserController.prototype.deleteProgramUserGroup = function (req, res) {
    return Q.Promise(function (resolve, reject) {
        models.ProgramUserGroup.find({
            where: {
                id: req.params.groupId
            }
        }).then(function (group) {
            if (group) {
                group.destroy().then(function () {
                    resolve();
                    res.sendSuccess();
                });
            } else {
                resolve();
                res.sendSuccess();
            }
        })
    });
};

UserController.prototype.getProgramUserGroups = function (req, res) {
    return Q.Promise(function (resolve, reject) {
        models.ProgramUser.find({
            where: {
                userId: req.user.id,
                linkId: req.params.linkId
            }
        }).then(function (programUser) {
            if (programUser) {
                models.ProgramUserGroup.findAll({
                    where: {
                        ownerId: programUser.id
                    },
                    include: [
                        {
                            model: models.ProgramUserGroupUser,
                            as: 'programUsers',
                            include: [
                                {
                                    model: models.ProgramUser,
                                    as: 'programUser',
                                    include: [
                                        {
                                            model: models.User,
                                            as: 'user'
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }).then(function (groups) {
                    resolve(groups);
                    res.sendSuccess(groups);
                })
            } else {
                resolve();
                res.sendSuccess([]);
            }
        });
    });
};

UserController.prototype.createProgramUserGroup = function (req, res) {
    return Q.Promise(function (resolve, reject) {
        models.sequelize.transaction().then(function (t) {
            models.ProgramUser.find({
                where: {
                    userId: req.user.id,
                    linkId: req.body.linkId
                }
            }).then(function (programUser) {
                models.ProgramUserGroup.findAll({
                    where: {
                        ownerId: programUser.id
                    }
                }).then(function (groups) {
                    if (_.findWhere(groups, {name: req.body.name})) {
                        reject('Cannot have duplicate group names');
                        res.sendError('Cannot have duplicate group names');
                    } else {
                        models.ProgramUserGroup.create({
                            name: req.body.name,
                            ownerId: programUser.id
                        }, {transaction: t}).then(function (newGroup) {
                            async.eachSeries(req.body.networkUsers,
                                function (programUser, callback) {
                                    models.ProgramUserGroupUser.create({
                                        programUserId: programUser.id,
                                        programUserGroupId: newGroup.id
                                    }, {transaction: t}).then(function () {
                                        callback(null);
                                    })
                                },
                                function (err) {
                                    if (!err) {
                                        t.commit()
                                            .then(function () {
                                                controller._getProgramUserGroup(newGroup.id).then(function (group) {
                                                    resolve(group);
                                                    res.sendSuccess(group);
                                                });
                                            });

                                    } else {
                                        t.rollback().then(function () {
                                            reject(err);
                                            res.sendError(err);
                                        });
                                    }
                                });
                        });
                    }
                })
            })
        })
    });
};

UserController.prototype.bulkUnassignProgramUsers = function (req, res) {
    models.sequelize.transaction().then(function (t) {
        async.eachSeries(req.body.programs,
            function (program, callback) {
                async.eachSeries(req.body.users,
                    function (userId, callback) {
                        controller._unassignProgramUser(userId, program.linkId, t).then(function () {
                            callback();
                        }).catch(function (err) {
                            callback(err);
                        })
                    },
                    function (err) {
                        if (err) {
                            callback(err);
                        } else {
                            callback();
                        }
                    })
            },
            function (err) {
                if (err) {
                    t.rollback().then(function () {
                        res.sendError(err);
                    });
                } else {
                    t.commit().then(function () {
                        res.sendSuccess();
                    });
                }
            })
    });
};

UserController.prototype.bulkAssignProgramUsers = function (req, res) {
    models.sequelize.transaction().then(function (t) {
        async.eachSeries(req.body.programs,
            function (program, callback) {
                async.eachSeries(req.body.users,
                    function (userId, callback) {
                        program.userId = userId;
                        controller._assignProgramUser(program, t).then(function () {
                            callback();
                        }).catch(function (err) {
                            callback(err);
                        })
                    },
                    function (err) {
                        if (err) {
                            callback(err);
                        } else {
                            callback();
                        }
                    })
            },
            function (err) {
                if (err && err.indexOf('seats') != -1) {
                    err = 'There are not enough available seats to complete the requested action.'
                }
                if (err) {
                    t.rollback().then(function () {
                        res.sendError(err);
                    });
                } else {
                    t.commit().then(function () {
                        res.sendSuccess();
                    });
                }
            })
    });
};

UserController.prototype.assignProgramUser = function (req, res) {
    models.sequelize.transaction().then(function (t) {
        controller._assignProgramUser(req.body, t).then(function (response) {
            t.commit().then(function () {
                res.sendSuccess(response);
            });
        }).catch(function (err) {
            t.rollback().then(function () {
                res.sendError(err);
            });
        })
    });
};

UserController.prototype._assignProgramUser = function (model, t) {

    return Q.Promise(function (resolve, reject) {

        if (!model.userId) {
            reject('userId cannot be null');
        }

        var continueAddProgramUser = function (model) {
            models.ProgramUser.create({
                linkId: model.linkId,
                userId: model.userId,
                transactionId: model.transactionId
            }, {transaction: t}).then(function () {
                resolve(null);
            }).catch(function (err) {
                reject(err);
            })
        };

        models.ProgramUser.find({
            where: {
                linkId: model.linkId,
                userId: model.userId
            }
        }).then(function (programUser) {
            if (programUser) {
                resolve();
            } else {
                //If the program is licenses from a content provider, check the license seats
                if (model.contentProviderId && model.clientId != model.contentProviderId) {
                    var sql =
                        'SELECT P.clientId, P.linkId, P.title, PL.seats\n' +
                        'FROM ProgramLicenses PL\n' +
                        'JOIN Programs P ON PL.linkId=P.linkId AND P.id IN\n' +
                        '(SELECT MAX(P2.id) from Programs P2 where P2.linkId = P.linkId)\n' +
                        'WHERE P.linkId=:linkId\n';

                    Q.all([
                        models.ProgramUser.count({
                            where: {
                                linkId: model.linkId
                            },
                            transaction: t
                        }),
                        //Took this query from get_program_user stored proc to get only the most recent published programs
                        models.sequelize.query(sql, {
                            replacements: {linkId: model.linkId},
                            type: models.sequelize.QueryTypes.SELECT,
                            transaction: t
                        })
                    ]).spread(function (programUsersCount, program) {
                        program = program[0];
                        if (programUsersCount >= program.seats) {
                            t.rollback().then(function () {
                                reject('All ' + program.seats + ' licensed seats at program ' + program.title + ' are assigned.');
                            })
                        } else {
                            continueAddProgramUser(model);
                        }
                    })
                } else {
                    var sql2 =
                        'SELECT P.clientId, P.linkId, PU.userId\n' +
                        'FROM ProgramUsers PU\n' +
                        'JOIN Programs P ON PU.linkId=P.linkId AND P.id IN\n' +
                        '(SELECT MAX(P2.id) from Programs P2 where P2.linkId = P.linkId)\n' +
                        'JOIN Clients C ON C.id=P.clientId\n' +
                        'WHERE C.id=:clientId AND (P.clientId = P.contentProviderId OR P.contentProviderId IS NULL)\n';

                    models.Program.find({
                        where: {
                            linkId: model.linkId
                        },
                        attributes: ['id', 'clientId'],
                        include: [
                            {
                                model: models.Client,
                                as: 'client',
                                attributes: ['seats', 'name']
                            }
                        ]
                    }).then(function (program) {
                        //Took this query from get_program_user stored proc to get only the most recent published programs
                        models.sequelize.query(sql2, {
                            replacements: {clientId: program.clientId},
                            type: models.sequelize.QueryTypes.SELECT,
                            transaction: t
                        }).then(function (programUsers) {
                            var uniqueUsers = _.uniq(programUsers, function (pu) {
                                return pu.userId;
                            });
                            var ownUser = _.findWhere(uniqueUsers, {userId: model.userId});

                            if (!ownUser && uniqueUsers.length >= program.client.seats) {
                                reject('All ' + program.client.seats + ' licensed seats at client ' + program.client.name + ' are assigned')
                            } else {
                                continueAddProgramUser(model);
                            }
                        })
                    })
                }
            }
        })
    })
};

UserController.prototype.deleteUser = function (req, res) {
    var self = this;
    self.context.find({
            where: {id: req.params.id}
        })
        .then(function (result) {
            if (result == null) return res.status(404).end('Not Found');

            models.sequelize.transaction().then(function (t) {
                // Delete the data.
                result.destroy({transaction: t})
                    .then(function () {
                        models.ProgramUser.destroy({
                            where: {
                                userId: req.params.id
                            }
                        }, {transaction: t}).then(function () {
                            t.commit().then(function () {
                                res.status(200).end('OK');
                            });
                        })
                    })
                    .catch(function (error) {
                        t.rollback().then(function () {
                            res.sendError(error);
                        });
                    });
            });
        })
        .catch(function (error) {
            res.sendError(error);
        });
};



 
 

 
