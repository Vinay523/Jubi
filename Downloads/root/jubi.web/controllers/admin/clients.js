var app = require('../../app');
var services = require('../../services');

// Client listing page
exports.getClients = function(req, res) {
    // Reload all clients
    services.subdomains.loadClients()
        .then(function() {
            // Render listing
            res.render(config.appName, 'admin/clients/listing', {trash:false}, 'admin');
        });
};

// Client listing page
exports.getProgramLicenses = function(req, res) {
    // Reload all clients
    services.subdomains.loadClients()
        .then(function() {
            // Render listing
            res.render(config.appName, 'admin/clients/programLicenses', {programId: parseInt(req.params.programId), clientId: parseInt(req.params.clientId)}, 'admin');
        });
};

// Client trash listing page
exports.getClientTrash = function(req, res) {
    // Reload all clients
    services.subdomains.loadClients()
        .then(function() {
            // Render listing
            res.render(config.appName, 'admin/clients/listing', {trash:true}, 'admin');
        });
};

// Client edit page
exports.newClient = function(req, res) {
    // Reload all clients
    services.subdomains.loadClients()
        .then(function() {
            // Render page
            res.render(config.appName, 'admin/clients/edit', { clientId: 0 }, 'admin');
        });
};

// Client edit page
exports.editClient = function(req, res) {
    // Reload all clients
    services.subdomains.loadClients()
        .then(function() {
            // Render page
            res.render(config.appName, 'admin/clients/edit', { clientId: parseInt(req.params.id) }, 'admin');
        });
};

