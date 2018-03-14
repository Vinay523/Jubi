var models = require('../models');
var services = require('../services');
var moment = require('moment');
var bcrypt = require('bcrypt-nodejs');
var async = require('async');
var Q = require('q');
var _ = require('underscore');
var util = require('util');
var request = require('request');
var uuid = require('node-uuid');
var xml2js = require('xml2js');
var userController = require('./models/users');

function LoginController() {
}
var controller = Object.create(LoginController.prototype);

LoginController.prototype._getSessionUser = function (id) {

    var format = function (rows) {
        var user = null;
        var client = {id: 0};

        _.each(rows, function (row) {
            if (!user) {
                user = {
                    id: row.id,
                    email: row.email,
                    pendingEmail: row.pendingEmail,
                    firstName: row.firstName,
                    lastName: row.lastName,
                    title: row.title,
                    avatarUrl: services.helpers.makeMediaUrl(row.avatarUrl),
                    tzOffset: row.tzOffset,
                    securityCode: row.securityCode,
                    securityCodeCreatedAt: row.securityCodeCreatedAt,
                    accessToken: row.accessToken,
                    accessTokenCreatedAt: row.accessTokenCreatedAt,
                    createdAt: row.createdAt,
                    updatedAt: row.updatedAt,
                    why: row.why,
                    destination: row.destination,
                    clients: [],
                    roles: []
                };
            }
            if (row.clientId && client.id != row.clientId) {
                client = {
                    id: row.clientId,
                    slug: row.clientSlug,
                    name: row.clientName,
                    allowCreateClient: row.allowCreateClient,
                    trialClientSeats: row.trialClientSeats,
                    trialLicenseSeats: row.trialLicenseSeats,
                    headerColor: row.headerColor,
                    headerFontColor: row.headerFontColor,
                    backgroundColor: row.backgroundColor,
                    backgroundFontColor: row.backgroundFontColor,
                    logoAlignment: row.logoAlignment,
                    logoImageUrl: services.helpers.makeMediaUrl(row.logoImageUrl),
                    buddyLabel: row.buddyLabel,
                    badgeLabel: row.badgeLabel,
                    roles: []
                };
                user.clients.push(client);
            }
            if (client && row.clientRoleId) {
                var clientRole = _.find(client.roles, function (role) {
                    return role.id == row.clientRoleId;
                });
                if (!clientRole) {
                    client.roles.push({
                        id: row.clientRoleId,
                        name: row.clientRoleName
                    });
                }
            }
            if (row.roleId) {
                var role = _.find(user.roles, function (role) {
                    return role.id == row.roleId;
                });
                if (!role) {
                    user.roles.push({
                        id: row.roleId,
                        name: row.roleName
                    });
                }
            }
        });

        return user;
    };

    return Q.Promise(function (resolve, reject) {
        try {
            models.sequelize.query('CALL get_session_user(?)', {
                    raw: true,
                    replacements: [id]
                })
                .then(function (rows) {
                    resolve(format(rows));
                })
                .catch(function (err) {
                    services.helpers.handleReject(err, reject);
                });
        }
        catch (err) {
            res.sendError(err);
        }
    });
};

LoginController.prototype.authenticate = function (req, res) {

    try {
        var data = req.body;
        //console.log(data);
        models.User.find({
                where: {email: data.email}
            })
            .then(function (user) {
                if (!user) {
                    logger.warn('Authenticate failed, no user %s', data.email);
                    return res.status(401).end('Unauthorized');
                }
                if (!bcrypt.compareSync(data.password, user.password)) {
                    logger.warn('Authenticate failed, bad pass %s', data.email);
                    return res.status(401).end('Unauthorized, bad pass');
                }

                // Destroy all existing previews for this user
                services.helpers.releaseProgramPreviews(0, user.id, null);

                async.waterfall([

                    // Update time zone as needed
                    function (callback) {
                        if (user.tzOffset == data.tzOffset) return callback(null, user);

                        user.tzOffset = (data.tzOffset ? data.tzOffset : 300);
                        user.save()
                            .then(function () {
                                callback(null, user);
                            })
                            .catch(function (err) {
                                services.helpers.handleReject(err, callback);
                            });
                    },
                    // Get the session user
                    function (user, callback) {
                        controller._getSessionUser(user.id)
                            .then(function (user) {
                                callback(null, user);
                            })
                            .catch(function (err) {
                                services.helpers.handleReject(err, callback);
                            });
                    }

                ], function (err, user) {
                    if (err) return res.sendError(err);
                    if (user.clients.length < 1 && user.roles[0].id > 1) {
                        // user is not associated with any clients AND they are not administrators
                        logger.warn('Authenticate failed, no client for %s.', data.email);
                        return res.status(401).send({noClient: true});
                    }

                    user.apiKey = new Buffer(data.email + ':' + data.password).toString('base64');
                    user.authHeader = {'Authorization': ('Basic ' + user.apiKey)};

                    //Remove the security code from the user being returned, so as not to be confusing (security code should only come from route get-security-code)
                    //Note to anyone editing this code, DO NOT save the user after setting security code to undefined as that will break a SSO in progress potentially
                    user.securityCode = undefined;
                    user.securityCodeCreatedAt = undefined;

                    res.sendSuccess(user);
                });
            })
            .catch(function (err) {
                res.sendError(err);
            });
    }
    catch (err) {
        res.sendError(err);
    }
};

LoginController.prototype.authenticateWithCode = function (req, res) {

    try {
        var data = req.body;
        models.User.find({
                where: {securityCode: data.code}
            })
            .then(function (user) {
                if (!user) {
                    logger.warn('Authenticate failed, no user %s', data.email);
                    return res.status(401).end('Unauthorized');
                }

                // Destroy all existing previews for this user
                services.helpers.releaseProgramPreviews(0, user.id, null);


                controller._getSessionUser(user.id)
                    .then(function (sessionUser) {
                        if (moment(sessionUser.securityCodeCreatedAt).add(1, 'minutes') < new Date()) {
                            res.sendError('Security code is expired');
                        }
                        if (sessionUser.clients.length < 1 && sessionUser.roles[0].id > 1) {
                            // user is not associated with any clients AND they are not administrators
                            logger.warn('Authenticate failed, no client for %s.', data.email);
                            return res.status(401).send({noClient: true});
                        } else {
                            user.securityCode = null;
                            user.secirtyCodeCreatedAt = null;
                            user.accessToken = services.helpers.makeToken(50);
                            user.accessTokenCreatedAt = new Date();

                            sessionUser.accessToken = user.accessToken;
                            sessionUser.accessTokenCreatedAt = user.accessTokenCreatedAt;

                            //Remove the security code from the sessionUser being returned, so as not to be confusing (security code should only come from route get-security-code)
                            sessionUser.securityCode = undefined;
                            sessionUser.secirtyCodeCreatedAt = undefined;


                            user.save().then(function () {
                                res.sendSuccess(sessionUser);
                            })
                        }
                    })
                    .catch(function (err) {
                        services.helpers.handleReject(err, callback);
                    });
            })
            .catch(function (err) {
                res.sendError(err);
            });
    }
    catch (err) {
        res.sendError(err);
    }
};

LoginController.prototype.getAuthenticateSessionLink = function (req, res) {
    try {
        var key = req.params.key;
        models.ssoProvider.find({
                where: {key: key}
            })
            .then(function (provider) {
                switch (provider.scheme) {
                    case 'YM':
                    {
                        var requestBodyStr =
                            "<YourMembership><Version>2.01</Version><ApiKey>" + provider.apiKey + "</ApiKey>" +
                            "<CallID>" + uuid().substring(0, 20) + "</CallID>" +
                            "<Call Method=\"Session.Create\"></Call>" +
                            "</YourMembership>";

                        request.post({
                            method: 'POST',
                            url: provider.apiUrl,
                            body: requestBodyStr,
                            headers: {"Content-Type": 'application/x-www-form-urlencoded'}
                        }, function (error, response, body) {

                            xml2js.parseString(body, function (err, result) {
                                var sessionId = result.YourMembership_Response["Session.Create"][0].SessionID[0];

                                requestBodyStr =
                                    "<YourMembership><Version>2.01</Version><ApiKey>" + provider.apiKey + "</ApiKey>" +
                                    "<CallID>" + uuid().substring(0, 20) + "</CallID>" +
                                    "<SessionID>" + sessionId + "</SessionID>" +
                                    "<Call Method=\"Auth.CreateToken\"></Call>" +
                                    "</YourMembership>";

                                request.post({
                                    method: 'POST',
                                    url: provider.apiUrl,
                                    body: requestBodyStr,
                                    headers: {"Content-Type": 'application/x-www-form-urlencoded'}
                                }, function (error, response, body) {
                                    xml2js.parseString(body, function (err, result) {
                                        var goToUrl = result.YourMembership_Response["Auth.CreateToken"][0].GoToUrl[0];
                                        var authToken = result.YourMembership_Response["Auth.CreateToken"][0].AuthToken[0];

                                        res.sendSuccess({
                                            url: goToUrl,
                                            sessionId: sessionId
                                        });
                                    });
                                })
                            });
                        });
                        break;
                    }
                }
            })
            .catch(function (err) {
                res.sendError(err);
            });
    }
    catch (err) {
        res.sendError(err);
    }
};

LoginController.prototype.authenticateUserWithSession = function (req, res) {
    try {
        models.sequelize.transaction().then(function (t) {
            var key = req.params.key;
            models.ssoProvider.find({
                    where: {key: key},
                    include: {
                        model: models.Client,
                        as: 'client'
                    }
                })
                .then(function (provider) {
                    switch (provider.scheme) {
                        case 'YM':
                        {
                            var requestBodyStr =
                                "<YourMembership><Version>2.01</Version><ApiKey>" + provider.apiKey + "</ApiKey>" +
                                "<CallID>" + uuid().substring(0, 20) + "</CallID>" +
                                "<SessionID>" + req.params.sessionId + "</SessionID>" +
                                "<Call Method=\"Member.Profile.Get\"></Call>" +
                                "</YourMembership>";


                            request.post({
                                method: 'POST',
                                url: provider.apiUrl,
                                body: requestBodyStr,
                                headers: {"Content-Type": 'application/x-www-form-urlencoded'}
                            }, function (error, response, body) {
                                if (error) {
                                    services.helpers.handleReject(error, callback);
                                }

                                xml2js.parseString(body, function (err, result) {
                                    var user = result.YourMembership_Response["Member.Profile.Get"][0];
                                    var email = user.EmailAddr[0];
                                    var firstName = user.FirstName[0];
                                    var lastName = user.LastName[0];
                                    var clientId = provider.clientId;
                                    models.User.find({
                                            where: {
                                                email: email
                                            }
                                        })
                                        .then(function (user) {
                                            var continueVerifyProgramRegistration = function (user) {

                                                requestBodyStr = "<YourMembership><Version>2.01</Version><ApiKey>" + provider.apiKey + "</ApiKey>" +
                                                    "<CallID>" + uuid().substring(0, 20) + "</CallID>" +
                                                    "<SessionID>" + req.params.sessionId + "</SessionID>" +
                                                    "<Call Method=\"Member.Commerce.Store.GetOrderIDs\">" +
                                                    "</Call>" +
                                                    "</YourMembership>";

                                                request.post({
                                                    method: 'POST',
                                                    url: provider.apiUrl,
                                                    body: requestBodyStr,
                                                    headers: {"Content-Type": 'application/x-www-form-urlencoded'}
                                                }, function (error, response, body) {
                                                    if (error) {
                                                        services.helpers.handleReject(error, callback);
                                                    }

                                                    xml2js.parseString(body, function (err, result) {

                                                        var orders = result.YourMembership_Response["Member.Commerce.Store.GetOrderIDs"][0].Orders[0].Order;

                                                        async.forEach(orders, function (order, callback) {

                                                            var invoiceId = order.InvoiceID[0];

                                                            requestBodyStr = "<YourMembership><Version>2.03</Version><ApiKey>" + provider.apiKey + "</ApiKey>" +
                                                                "<CallID>" + uuid().substring(0, 20) + "</CallID>" +
                                                                "<SessionID>" + req.params.sessionId + "</SessionID>" +
                                                                "<Call Method=\"Member.Commerce.Store.Order.Get\">" +
                                                                "<InvoiceID>" + invoiceId + "</InvoiceID>" +
                                                                "</Call>" +
                                                                "</YourMembership>";

                                                            request.post({
                                                                method: 'POST',
                                                                url: provider.apiUrl,
                                                                body: requestBodyStr,
                                                                headers: {"Content-Type": 'application/x-www-form-urlencoded'}
                                                            }, function (error, response, body) {
                                                                if (error) {
                                                                    services.helpers.handleReject(error, callback);
                                                                }

                                                                xml2js.parseString(body, function (err, result) {

                                                                    var products = result.YourMembership_Response["Member.Commerce.Store.Order.Get"][0].Order[0].Products[0].Product;

                                                                    async.forEach(products, function (product, callback) {
                                                                        models.ssoProviderProgram.find({
                                                                            where: {
                                                                                providerId: provider.id,
                                                                                providerProgramId: product.ProductID[0]
                                                                            }
                                                                        }).then(function (ssoProviderProgram) {
                                                                                if (ssoProviderProgram) { //If we have a program for this product register the user, otherwise ignore it
                                                                                    //If the order is valid
                                                                                    models.ProgramUser.find({
                                                                                            where: {
                                                                                                userId: user.id,
                                                                                                linkId: ssoProviderProgram.linkId
                                                                                            }
                                                                                        })
                                                                                        .then(function (programUser) {
                                                                                            if (!programUser) {
                                                                                                userController._assignProgramUser({
                                                                                                        userId: user.id,
                                                                                                        linkId: ssoProviderProgram.linkId
                                                                                                    }, t)
                                                                                                    .then(function (newProgramUser) {
                                                                                                        callback();
                                                                                                    })
                                                                                                    .catch(function (err) {
                                                                                                        callback(err);
                                                                                                    });
                                                                                            }
                                                                                            else {
                                                                                                callback();
                                                                                            }
                                                                                        })
                                                                                        .catch(function (err) {
                                                                                            services.helpers.handleReject(err, callback);
                                                                                        });
                                                                                } else {
                                                                                    callback();
                                                                                }
                                                                            })
                                                                            .catch(function (err) {
                                                                                services.helpers.handleReject(err, callback);
                                                                            });
                                                                    }, function (err) {
                                                                        if (err) {
                                                                            services.helpers.handleReject(err, callback);
                                                                        }
                                                                        else {
                                                                            callback();
                                                                        }
                                                                    });
                                                                });
                                                            })
                                                        }, function (err) {
                                                            if (err) {
                                                                t.rollback().then(function () {
                                                                    res.sendError(err);
                                                                })
                                                            }

                                                            user.securityCode = uuid();
                                                            user.save();

                                                            t.commit().then(function () {
                                                                res.sendSuccess({
                                                                    securityCode: user.securityCode
                                                                })
                                                            })
                                                        });
                                                    });
                                                });
                                            };

                                            if (!user) {
                                                //create the user
                                                userController._create({
                                                        id: 0,
                                                        firstName: firstName,
                                                        lastName: lastName,
                                                        email: email,
                                                        password: '1234xyzyoullneverGuEsSme0916758',
                                                        clientId: clientId,
                                                        role: {
                                                            id: 4
                                                        },
                                                        client: {
                                                            id: clientId
                                                        }
                                                    }, t)
                                                    .then(function (newUser) {
                                                        continueVerifyProgramRegistration(newUser);
                                                    })
                                                    .catch(function (err) {
                                                        t.rollback().then(function () {
                                                            res.sendError(err);
                                                        })
                                                    });
                                            } else {
                                                continueVerifyProgramRegistration(user)
                                            }
                                        })
                                        .catch(function (err) {
                                            t.rollback().then(function () {
                                                res.sendError(err);
                                            })
                                        });
                                });
                            });
                            break;
                        }
                    }
                })
                .catch(function (err) {
                    t.rollback().then(function () {
                        res.sendError(err);
                    })
                });
        });
    }
    catch (err) {
        res.sendError(err);
    }
};

LoginController.prototype.me = function (req, res) {
    controller._getSessionUser(req.user.id)
        .then(function (user) {
            res.sendSuccess(user);
        })
        .catch(function (err) {
            res.sendError(err);
        });
};

LoginController.prototype.logout = function (req, res) {
    if (req.user) {
        // Destroy all existing previews for this user
        services.helpers.releaseProgramPreviews(0, req.user.id, null);
    }
    req.logout();
    res.status(200).end('OK');
};

LoginController.prototype.restartSession = function (req, res) {
    controller._getSessionUser(req.params.id)
        .then(function (user) {
            // Destroy all existing previews for this user
            services.helpers.releaseProgramPreviews(0, user.id, null);
            // Send user
            res.sendSuccess(user);
        })
        .catch(function (err) {
            res.sendError(err);
        });
};

LoginController.prototype.postForgotPassword = function (req, res) {

    models.sequelize.transaction().then(function (t) {
        async.waterfall([

            function (callback) {
                models.User.find({
                        where: {
                            email: req.body.email
                        }
                    })
                    .then(function (user) {
                        callback(null, user);
                    })
                    .catch(function (err) {
                        services.helpers.handleReject(err, callback);
                    });
            },
            function (user, callback) {
                if (!user) return callback(null, null);

                user.tempToken = services.helpers.encrypt(util.format('%d|%d', user.id, new Date().getTime()));
                user.save({transaction: t})
                    .then(function (user) {
                        logger.info('User temp token set: (%d) %s', user.id, user.email);
                        callback(null, user);
                    })
                    .catch(function (err) {
                        services.helpers.handleReject(err, callback);
                    });
            },
            function (user, callback) {
                if (!user) return callback(null, null);

                var model = {
                    user: user,
                    resetUrl: util.format(config.web.appUrl + '/reset-password?token=%s', user.tempToken)
                };
                var to = util.format('%s %s <%s>', user.firstName, user.lastName, user.email);
                services.email.email('Jubi: Password Reset', to, 'forgotPassword', null, model)
                    .then(function () {
                        logger.info('Forgot password email sent to (%d) %s %s <%s>', user.id, user.firstName, user.lastName, user.email);
                        callback(null, user);
                    })
                    .catch(function (err) {
                        services.helpers.handleReject(err, callback);
                    });
            }

        ], function (err, user) {
            if (err) {
                t.rollback().then(function () {
                    res.sendError(err);
                });
                return null;
            }
            t.commit().then(function () {
                res.sendSuccess(user ? 'ok' : 'na');
            });
        })
    });

};

LoginController.prototype.postResetPassword = function (req, res) {

    var result = null;
    var userId = 0;

    models.sequelize.transaction().then(function (t) {
        async.waterfall([

            function (callback) {

                var token = services.helpers.decrypt(req.body.token);
                if (!token) {
                    logger.warn('Cannot decrypt token: %s', req.body.token);
                    result = 'Token is not valid.';
                }
                else {
                    var parts = token.split('|');
                    if (parts.length != 2 || isNaN(parts[0]) || isNaN(parts[1])) {
                        logger.warn('Invalid token content: %s', token);
                        result = 'Token is not valid.';
                    }
                    else {

                        // Has token expired?
                        var d = new Date().getTime() - ((60 * 60 * 24 * config.password.resetTimeout) * 1000);
                        if (parseInt(parts[1]) < d) {
                            logger.warn('Temp token has expired: %s', token);
                            result = 'Token is not valid.';
                        }
                        else
                            userId = parseInt(parts[0]);
                    }
                }
                callback(null);
            },
            function (callback) {
                if (userId <= 0) return callback(null, null);

                // Get the user
                models.User.findById(userId)
                    .then(function (user) {
                        if (!user) {
                            logger.warn('User not found: %d', userId);
                            result = 'Token is not valid.';
                        }
                        callback(null, user);
                    })
                    .catch(function (err) {
                        services.helpers.handleReject(err, callback);
                    });
            },
            function (user, callback) {
                if (!user) return callback(null, null);

                // Update user and save
                user.password = bcrypt.hashSync(req.body.password);
                user.tempToken = null;
                user.save({transaction: t})
                    .then(function () {
                        logger.info('User password reset %d %s', user.id, user.email);
                        callback(null);
                    })
                    .catch(function (err) {
                        services.helpers.handleReject(err, callback);
                    });
            }

        ], function (err) {
            if (err) {
                t.rollback().then(function () {
                    res.sendError(err);
                });
                return null;
            }
            t.commit().then(function () {
                res.sendSuccess(result || 'ok');
            });
        })
    });

};

module.exports = controller;
