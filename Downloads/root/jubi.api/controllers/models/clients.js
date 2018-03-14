var models = require('../../models');
var services = require('../../services');
var controllerBase = require('./controllerBase');
var usersController = require('./users');
var programsController = require('./programs');
var Q = require('q');
var async = require('async');
var util = require('util');
var formidable = require('formidable');
var _ = require('underscore');
var bcrypt = require('bcrypt-nodejs');

function ClientController(model) {
    controllerBase.call(this, model);
}

util.inherits(ClientController, controllerBase);

module.exports = new ClientController(models.Client);

ClientController.prototype.retrieveDeletedCount = function (req, res) {
    var clients = [];

    var continueLoadClients = function () {
        if (clients.length == 0) {
            var opts = {
                where: {
                    deletedAt: {
                        $ne: null
                    }
                },
                paranoid: false
            };
        } else {
            var opts = {
                where: {
                    deletedAt: {
                        $ne: null
                    },
                    id: {
                        $in: _.pluck(clients, 'id')
                    }
                },
                paranoid: false
            };
        }


        models.Client.count(opts)
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
                continueLoadClients();
            })
    } else {
        continueLoadClients();
    }

};

ClientController.prototype.retrieveClientListing = function (req, res) {
    var clients = [];
    var self = this;

    var continueLoadClients = function () {

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

        opts.include = [
            {
                model: models.ClientRole,
                as: 'roles'
            },
            {
                model: models.Client,
                as: 'parent',
                attributed: ['name']
            }
        ];

        if (clients.length > 0) {
            if (opts.where) {
                opts.where.id = {
                    $in: _.pluck(clients, 'id')
                }
            } else {
                opts.where = {
                    id: {
                        $in: _.pluck(clients, 'id')
                    }
                }
            }
        }

        self.context.findAndCountAll(opts)
            .then(function (result) {
                if (result == null) return res.sendSuccess({count: 0, data: null});
                res.sendSuccess({count: result.count, data: result.rows});
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
                continueLoadClients();
            })
    } else {
        continueLoadClients();
    }
};

ClientController.prototype.retrieveContentConsumersClients = function (req, res) {

    var self = this;
    var clients = [];
    var continueLoadClients = function () {

        var opts = {
            include: [
                {
                    model: models.ClientRole,
                    as: 'roles',
                    where: {
                        name: 'Content Consumer'
                    },
                    required: true
                }
            ]
        };

        if (clients.length > 0) {
            opts.where = {
                id: {
                    $in: _.pluck(clients, 'id')
                }
            }
        }

        self.context.findAll(opts)
            .then(function (clients) {
                res.sendSuccess(clients);
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
                continueLoadClients();
            })
    } else {
        continueLoadClients();
    }
};

ClientController.prototype.retrieveClient = function (req, res) {
    var id = req.params.id;
    var clients = [];
    var self = this;

    var continueLoadClient = function () {
        if (clients.length > 0) {
            if (_.findWhere(clients, {id: Number(id)}) == null) {
                res.sendError('User does not have access to this client.');
                return;
            }
        }

        self.context.find({
            where: {id: id},
            include: {
                model: models.ClientRole,
                as: 'roles'
            }
        }).then(function (result) {
                if (result == null) return res.json({count: 0, data: null});
                if (result.logoImageUrl) {
                    result.logoImageUrl = services.helpers.makeMediaUrl(result.logoImageUrl)
                }
                if (result.loginImageUrl) {
                    result.loginImageUrl = services.helpers.makeMediaUrl(result.loginImageUrl)
                }
                res.sendSuccess({count: 1, data: result});
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
                continueLoadClient();
            })
    } else {
        continueLoadClient();
    }
};

ClientController.prototype.createClient = function (req, res) {
    var self = this;
    models.sequelize.transaction().then(function (t) {

        if (services.helpers.isInRole(services.helpers.roleIds.ClientAdmin, req.user)) {
            req.body.parentId = req.user.clients[0].id
        }

        models.Client.find({
            where: {
                id: req.user.clients[0].id
            }
        }).then(function (client) {
            if (client.allowCreateClient) {
                self.context.create(req.body, {transaction: t})
                    .then(function (client) {

                        var roles = [];
                        if (req.body.contentProvider)
                            roles.push({clientId: client.id, roleId: 1});
                        if (req.body.contentConsumer)
                            roles.push({clientId: client.id, roleId: 2});

                        if (roles.length <= 0) {
                            t.commit().then(function() { res.status(201).sendSuccess({id: client.id}); });
                            return null;
                        }

                        models.ClientClientRole.bulkCreate(roles, {transaction: t})
                            .then(function () {
                                t.commit().then(function() { res.status(201).sendSuccess({id: client.id}); });
                            })
                            .catch(function (err) {
                                t.rollback().then(function() { res.sendError(err); });
                            });
                    })
                    .catch(function (err) {
                        t.rollback().then(function() { res.sendError(err); });
                    });
            } else {
                t.rollback().then(function() { res.sendError('Client creation is not allowed.'); });
            }
        });
    });
};

ClientController.prototype.checkSlug = function (req, res) {
    var c = this;
    var index = 1;
    var slug = req.body.slug;

    var done = false;
    async.whilst(
        function () {
            return !done;
        },
        function (callback) {

            c.context.find({where: {slug: slug}})
                .then(function (result) {
                    if (!result) {
                        done = true;
                        return callback();
                    }
                    slug = req.body.slug + index++;
                    callback();
                })
                .catch(function (err) {
                    callback(err);
                });

        },
        function (err) {
            if (err) return res.sendError(err);
            return res.sendSuccess({slug: slug});
        });
};

ClientController.prototype.checkProgramSlug = function (req, res) {
    var index = 1;
    var slug = req.body.slug;

    var done = false;
    async.whilst(
        function () {
            return !done;
        },
        function (callback) {

            models.Program.find({where: {slug: slug, clientId: req.params.id}})
                .then(function (result) {
                    if (!result) {
                        done = true;
                        return callback();
                    }
                    slug = req.body.slug + index++;
                    callback();
                })
                .catch(function (err) {
                    callback(err);
                });

        },
        function (err) {
            if (err) return res.sendError(err);
            return res.sendSuccess({slug: slug});
        });
};

ClientController.prototype.checkProgramTitle = function (req, res) {
    programsController._retrieveProgramListing(req.user, true)
        .then(function (results) {

            models.Program.find({
                where:{
                    id: req.params.id
                }
            }).then(function(programItem){
                var matchingProgram = _.find(results, function (program) {
                    return program.title == req.body.title && program.id != Number(req.params.id)
                        && programItem.linkId != program.linkId //Make sure this isn't the same program
                });
                if (!matchingProgram) {
                    res.sendSuccess(true);
                } else {
                    res.sendSuccess(false);
                }
            });
        })
        .catch(function (err) {
            res.sendError(err);
        });
};

ClientController.prototype.updateClient = function (req, res) {
    var self = this;
    Q.all([
        self.context.find({
            where: {id: req.params.id}
        }),
        self.context.find({
            where: {
                slug: req.body.slug,
                id: {
                    $ne: req.params.id
                }
            }
        })
    ]).spread(function (client, clientWithMatchingSlug) {
        if (client == null) return res.status(404).end('Not Found');
        if (clientWithMatchingSlug) {
            return res.sendError('Slug already in use!')
        }

        // Get the req data.
        var data = req.body;

        if (data.logoImageUrl) {
            data.logoImageUrl = services.helpers.makeImageRef(data.logoImageUrl);
        }
        if (data.loginImageUrl) {
            data.loginImageUrl = services.helpers.makeImageRef(data.loginImageUrl);
        }

        var continueUpdateClient = function () {
            models.sequelize.transaction().then(function (t) {
                // Save the data.
                client.updateAttributes(data, {transaction: t})
                    .then(function () {

                        models.ClientClientRole.destroy({
                                where: {
                                    clientId: client.id
                                },
                                transaction: t
                            })
                            .then(function () {

                                var roles = [];
                                if (req.body.contentProvider)
                                    roles.push({clientId: client.id, roleId: 1});
                                if (req.body.contentConsumer)
                                    roles.push({clientId: client.id, roleId: 2});

                                if (roles.length <= 0) {
                                    t.commit().then(function() { res.status(200).end('OK'); });
                                    return null;
                                }

                                models.ClientClientRole.bulkCreate(roles, {transaction: t})
                                    .then(function () {
                                        t.commit().then(function() { res.status(200).end('OK'); });
                                        return null;
                                    })
                                    .catch(function (err) {
                                        t.rollback().then(function() { res.sendError(err); });
                                        return null;
                                    });

                            })
                            .catch(function (error) {
                                t.rollback().then(function() { res.sendError(error); });
                                return null;
                            });


                    })
                    .catch(function (error) {
                        t.rollback().then(function() { res.sendError(error); });
                        return null;
                    });
            });
        };

        if (data.seats < client.seats) {
            var sql =
                'SELECT P.clientId, P.linkId\n' +
                'FROM ProgramUsers PU\n' +
                'JOIN Programs P ON PU.linkId=P.linkId AND P.id IN\n' +
                '(SELECT MAX(P2.id) from Programs P2 where P2.linkId = P.linkId)\n' +
                'JOIN Clients C ON C.id=P.clientId\n' +
                'WHERE C.id=:clientId AND (P.clientId = P.contentProviderId OR P.contentProviderId IS NULL)\n';


            //Took this query from get_program_user stored proc to get only the most recent published programs
            models.sequelize.query(sql, {
                    replacements: {clientId: client.id},
                    type: models.sequelize.QueryTypes.SELECT
                })
                .then(function (programUserCount) {
                    if (programUserCount.length > data.seats) {
                        res.sendError({
                            error: true,
                            type: 'seatsValidation',
                            message: 'Cannot lower program seat count to ' + data.seats + ' because there are currently ' + programUserCount.length + ' user(s) assigned at this client'
                        });
                    } else {
                        continueUpdateClient();
                    }
                })
        } else {
            continueUpdateClient();
        }

    });
};

ClientController.prototype.getClientUsers = function (req, res) {

    models.Client.find({
            where: {
                id: req.params.id
            },
            include: [
                {
                    model: models.User,
                    attributes: ['id', 'firstName', 'lastName', 'email', 'title', 'email', 'avatarUrl', 'why', 'destination', 'createdAt'],
                    as: 'users',
                    include: [
                        {
                            model: models.Role,
                            as: 'roles'
                        },
                        {
                            model: models.ProgramUser,
                            as: 'programUsers'
                        }
                    ]
                }
            ]
        })
        .then(function (client) {
            res.sendSuccess(client.users);
        })
        .catch(function (err) {
            res.sendError(err);
        });
};

ClientController.prototype.getClientPrograms = function (req, res) {
    var clients = [];

    var continueLoadPrograms = function () {
        if (clients.length > 0) {
            if (_.findWhere(clients, {id: Number(req.params.id)}) == null) {
                res.sendError('User does not have access to this client.');
                return;
            }
        }

        var sql =
            'SELECT DISTINCT(P.id), PL2.id as licenseId, P.linkId, P.title, P.published, P.contentProviderId, P.clientId,\n' +
            '((SELECT COUNT(*) FROM Programs P2 WHERE P2.linkId=P.linkId && P2.id < P.id AND P2.published IS NOT NULL AND P2.deletedAt IS NULL AND P2.status != \'preview\') + 1) AS version\n' +
            'FROM Programs P\n' +
            'JOIN Clients C ON C.id=P.clientId\n' +
            'LEFT OUTER JOIN ProgramLicenses PL ON PL.linkId=P.linkId && PL.deletedAt IS NULL\n' +
            'LEFT OUTER JOIN ProgramLicenses PL2 ON PL2.licensedProgramId=P.id && PL2.deletedAt IS NULL\n' +
            'WHERE (P.deletedAt IS NULL || PL2.id IS NOT NULL) AND C.id=:clientId AND P.published IS NOT NULL AND P.status != \'preview\'\n' +
            'AND PL.id IS NULL\n' +
            'ORDER BY P.id ASC';

        //Took this query from get_program_user stored proc to get only the most recent published programs
        models.sequelize.query(sql, {
                replacements: {clientId: req.params.id},
                type: models.sequelize.QueryTypes.SELECT
            })
            .then(function (programs) {
                var uniquePrograms = _.uniq(programs, function (item, key, a) {
                    return item.id;
                });

                _.each(uniquePrograms, function (program) {
                    program.licenseProgramCount = _.countBy(programs, function (c) {
                        return c.id == program.id && program.licenseId ? 'counted' : 'not counted';
                    }).counted;
                    program.licenseId = undefined;
                });
                res.sendSuccess(uniquePrograms);
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
                continueLoadPrograms();
            })
    } else {
        continueLoadPrograms();
    }
};

ClientController.prototype.getClientProgramsForAssign = function (req, res) {
    var clients = [];

    var continueLoadPrograms = function () {
        if (clients.length > 0) {
            if (_.findWhere(clients, {id: Number(req.params.clientId)}) == null) {
                res.sendError('User does not have access to this client.');
                return;
            }
        }

        var sql = {
            query: 'SELECT P.id, P.linkId, P.slug, P.title, P.contentProviderId, P.clientId  FROM Programs P \n' +
            'JOIN Clients C ON C.id=P.clientId \n' +
            'WHERE P.deletedAt IS NULL AND \n' +
            'P.status != \'preview\' AND \n' +
            'P.published IS NOT NULL \n' +
            'AND C.id = :clientId \n' +
            'AND P.id IN \n' +

            '(SELECT MAX(P.id) FROM Programs P \n' +
            'JOIN Clients C ON C.id=P.clientId \n' +
            'WHERE P.deletedAt IS NULL AND \n' +
            'P.status != \'preview\' AND \n' +
            'P.published IS NOT NULL \n' +
            'AND C.id = :clientId \n' +
            'GROUP BY P.linkId) \n' +

            'GROUP BY P.linkId'
        };


        //Took this query from get_program_user stored proc to get only the most recent published programs
        models.sequelize.query(sql.query, {
                type: models.sequelize.QueryTypes.SELECT,
                replacements: {clientId: req.params.clientId}
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
                continueLoadPrograms();
            })
    } else {
        continueLoadPrograms();
    }
};

ClientController.prototype.getClientProgramLicenses = function (req, res) {
    Q.all([
            //Took this query from get_program_user stored proc to get only the most recent published programs
            models.ProgramLicense.findAll({
                where: {
                    licensedProgramId: Number(req.params.programId)
                }
            }),
            models.Program.find({
                where: {
                    id: Number(req.params.programId)
                },
                attributes: ['id', 'title', 'linkId'],
                paranoid: false
            })
        ])
        .spread(function (licenses, program) {
            licenses = JSON.stringify(licenses);
            licenses = JSON.parse(licenses);

            var programLicenses = [];

            async.eachSeries(licenses,
                function (license, callback) {
                    models.Program.find({
                        where: {
                            linkId: license.linkId
                        },
                        paranoid: false,
                        attributes: ['clientId']
                    }).then(function (program) {
                        license.clientId = program.clientId;
                        programLicenses.push(license);
                        callback();
                    })
                },
                function () {
                    Q.all([
                        models.Client.findAll({
                            where: {
                                id: {
                                    $in: _.pluck(programLicenses, 'clientId')
                                }
                            }
                        }),
                        models.Program.count({
                            where: {
                                linkId: program.linkId,
                                id: {
                                    $lt: program.id
                                },
                                published: {
                                    $ne: null
                                },
                                status: {
                                    $ne: 'preview'
                                }
                            }
                        })
                    ]).spread(function (clients, version) {
                        res.sendSuccess({
                            licenses: programLicenses,
                            program: program,
                            version: version + 1,
                            clients: clients
                        });
                    })
                });
        })
        .catch(function (err) {
            res.sendError(err);
        });

};


ClientController.prototype.deleteUser = function (req, res) {

    models.sequelize.transaction().then(function (t) {
        Q.all([
            models.ClientUser.destroy({
                where: {
                    userId: parseInt(req.params.userId),
                    clientId: parseInt(req.params.id)
                },
                transaction: t
            }),
            models.ProgramUser.destroy({
                where: {
                    userId: parseInt(req.params.userId)
                },
                transaction: t
            })
        ]).then(function () {
            t.commit().then(function() { res.sendSuccess('ok'); });
            return null;

        }).catch(function (err) {
            t.rollback().then(function() { res.sendError(err); });
            return null;
        });

    });
};


ClientController.prototype.restore = function (req, res) {
    models.Client.find({
        where: {
            id: req.params.id
        },
        paranoid: false
    }).then(function (client) {
        models.Client.find({
            where: {
                slug: client.slug
            }
        }).then(function (clientWithMatchingSlug) {
            if (!clientWithMatchingSlug) {
                client.restore().then(function(){
                    res.sendSuccess('ok');
                });
            } else {
                res.sendError('Client with matching slug already exists, cannot restore client! ');
            }
        })
    }).catch(function (err) {
        res.sendError(err);
    });
};

ClientController.prototype.importUsers = function (req, res) {

    var csv = require('csv');
    var fs = require('fs');

    var clientId = parseInt(req.params.id);

    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        if (err) return res.sendError(err);

        var lines = [];
        var line = 1;
        var errors = [];
        var warnings = [];

        var parser = csv.parse();
        parser.on('readable', function () {

            // First Name, Last Name, Email, Title, Role
            var checkHeader = function (record) {
                if (_.indexOf(record, 'First Name') != 0 ||
                    _.indexOf(record, 'Last Name') != 1 ||
                    _.indexOf(record, 'Email') != 2 ||
                    _.indexOf(record, 'Title') != 3 ||
                    _.indexOf(record, 'Role') != 4) {
                    errors.push(util.format('Line %d: Invalid header row, expecting First Name, Last Name, Email, Title, Role', line));
                }
            };
            var checkRecord = function (record) {
                // General check to make sure we got correct number of fields
                if (record.length < 5) {
                    errors.push(util.format('Line %d: Invalid number of fields, expecting 5.', line));
                    return;
                }

                if (!record[0] || record[0].trim().length <= 0) {
                    errors.push(util.format('Line %d: First Name cannot be empty.', line));
                    return;
                }
                if (!record[1] || record[1].trim().length <= 0) {
                    errors.push(util.format('Line %d: Last Name cannot be empty.', line));
                    return;
                }

                if (!record[2] || record[2].trim().length <= 0) {
                    errors.push(util.format('Line %d: Email cannot be empty.', line));
                    return;
                }
                var r = /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i;
                if (!r.test(record[2].trim())) {
                    errors.push(util.format('Line %d: Email is not properly formatted.', line));
                }
            };

            var record;
            while (record = parser.read()) {
                // Push to collection
                lines.push({
                    line: line,
                    record: record
                });

                // Is first line and does it look like a header row?
                if (line == 1 && record[0] == 'First Name') {
                    checkHeader(record);
                    continue;
                }
                checkRecord(record);
                line++;
            }
        });
        parser.on('error', function (err) {
            res.sendError(err);
        });
        parser.on('finish', function () {

            if (errors.length > 0)
                return res.sendSuccess({
                    status: 'error',
                    errors: errors
                });

            // Do the import
            models.sequelize.transaction().then(function (t) {

                var imported = 0;
                var skipped = 0;

                async.eachSeries(lines,
                    function (line, callback) {
                        // Skip if header row!
                        if (line.record[0] == 'First Name') return callback(null);

                        // See if user already in database
                        models.User.find({
                            where: {email: line.record[2].trim()},
                            attributes: ['id', 'firstName', 'lastName', 'email', 'title', 'email', 'avatarUrl', 'why', 'destination']
                        }).then(function (user) {
                            // Was user found?
                            if (user) {
                                warnings.push(util.format('Line %d: User %s %s <%s> already in database, skipped!',
                                    line.line, line.record[0], line.record[1], line.record[2]));
                                skipped++;
                                return callback(null);
                            }
                            var userObj = {
                                firstName: line.record[0].trim(),
                                lastName: line.record[1].trim(),
                                email: line.record[2].trim(),
                                title: line.record[3] ? line.record[3].trim() : null
                            };

                            if (line.record[5]) {
                                userObj.password = bcrypt.hashSync(line.record[5]);
                            }

                            // Insert new user
                            async.waterfall([
                                    // Create the new user
                                    function (callback) {
                                        models.User.build(userObj).save({transaction: t})
                                            .then(function (user) {
                                                callback(null, user);
                                            })
                                            .catch(function (err) {
                                                services.helpers.handleReject(err, callback);
                                            });
                                    },
                                    // Add user to client
                                    function (user, callback) {
                                        models.ClientUser.build({
                                            userId: user.id,
                                            clientId: clientId
                                        }).save({transaction: t})
                                            .then(function () {
                                                callback(null, user);
                                            })
                                            .catch(function (err) {
                                                services.helpers.handleReject(err, callback);
                                            });
                                    },
                                    // Add user to role
                                    function (user, callback) {

                                        var roleId = 4;
                                        if (line.record[4] == 'Client Admin') roleId = 2;
                                        else if (line.record[4] == 'Client Author') roleId = 3;

                                        models.UserRole.build({
                                            userId: user.id,
                                            roleId: roleId
                                        }).save({transaction: t})
                                            .then(function () {
                                                callback(null, user);
                                            })
                                            .catch(function (err) {
                                                services.helpers.handleReject(err, callback);
                                            });
                                    },
                                    // Assign user programs
                                    function (user, callback) {
                                        if (line.record[6]) {
                                            var programTitles = line.record[6].split(',');
                                            async.eachSeries(programTitles,
                                                function (programTitle, callback) {
                                                    var sql = {
                                                        query: 'SELECT P.id, P.linkId, P.slug, P.title, P.contentProviderId, P.clientId  FROM Programs P \n' +
                                                        'JOIN Clients C ON C.id=P.clientId \n' +
                                                        'WHERE P.deletedAt IS NULL AND \n' +
                                                        'P.status != \'preview\' AND \n' +
                                                        'P.published IS NOT NULL \n' +
                                                        'AND C.id = :clientId \n' +
                                                        'AND P.title = :title \n' +
                                                        'AND P.id in \n' +

                                                        '(SELECT MAX(P.id) FROM Programs P \n' +
                                                        'JOIN Clients C ON C.id=P.clientId \n' +
                                                        'WHERE P.deletedAt IS NULL AND \n' +
                                                        'P.status != \'preview\' AND \n' +
                                                        'P.published IS NOT NULL \n' +
                                                        'AND C.id = :clientId \n' +
                                                        'AND P.title = :title \n' +
                                                        'GROUP BY P.linkId) \n' +

                                                        'GROUP BY P.linkId'
                                                    };

                                                    models.sequelize.query(sql.query, {
                                                            type: models.sequelize.QueryTypes.SELECT,
                                                            replacements: {
                                                                clientId: clientId,
                                                                title: programTitle
                                                            }
                                                        }
                                                    ).then(function (programs) {
                                                        if (programs.length == 0) {
                                                            var error = util.format('Line %d: Program "%s" not found!.', line.line, programTitle);
                                                            callback(error);
                                                            return;
                                                        }
                                                        var program = programs[0];
                                                        program.userId = user.id;
                                                        usersController._assignProgramUser(program, t).then(function () {
                                                            callback();
                                                        }).catch(function (err) {
                                                            callback(err);
                                                        })
                                                    })
                                                }, function (err) {
                                                    if (err) {
                                                        return services.helpers.handleReject(err, callback);
                                                    }
                                                    callback();
                                                })
                                        } else {
                                            callback()
                                        }
                                    }
                                ],
                                function (err) {
                                    if (err) return callback(err);

                                    imported++;
                                    callback(null);
                                });
                        }).catch(function (err) {
                            services.helpers.handleReject(err, callback);
                        });
                    },
                    function (err) {
                        if (err) {
                            t.rollback().then(function() { res.sendError(err); });
                            return null;
                        }
                        t.commit()
                            .then(function() {
                                res.sendSuccess({
                                    status: 'ok',
                                    imported: imported,
                                    skipped: skipped,
                                    warnings: warnings
                                });
                            });
                        return null;

                    });

            });
        });

        fs.readFile(files.file.path, function (err, fileData) {
            if (err) return res.sendError(err);

            parser.write(fileData);
            parser.end();
        });

    });
};