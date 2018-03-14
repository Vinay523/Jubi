var services = require('../services');

var _ = require('underscore');
var Q = require('q');
var request = require('request');
var util = require('util');

var clients = [];
exports.clients = clients;

exports.loadClients = _loadClients = function () {
    console.log("loadClients in /services/subdomains.js ");
    return Q.Promise(function(resolve, reject) {

        // Get all clients
        request.get(config.web.apiUrl + '/clients', { rejectUnauthorized: false },
            function(err, response, body) {
                if (err) return services.helpers.handleReject(err, reject);
                if (response.statusCode != 200) {
                    logger.error('Cannot get clients: %d', response.statusCode);
                    return reject(new Error(util.format('Cannot get clients: %d', response.statusCode)))
                }
                clients = JSON.parse(body).data;
                resolve();
            }).auth(config.systemCredentials.userName, config.systemCredentials.password, true);
    });
};

exports.initialize = function () {
    console.log("initialize in /services/subdomains.js ");
    return _loadClients();
};

exports.middleware = function (req, res, next) {
    console.log("middleware in /services/subdomains.js ");
    req.client = _.find(clients, function(client) {
        return req.headers.host.indexOf(client.slug + '.' + config.web.host) === 0;
    });
    next();
};


