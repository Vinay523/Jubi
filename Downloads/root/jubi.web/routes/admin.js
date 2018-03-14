var controllers = require('../controllers/admin');
var services = require('../services');

var express = require('express');
var router = express.Router();

// Route to check is user is can admin
var canAdmin = function(req, res, next) {
    if (req.authorizeById(services.session.roleIds.ClientAdmin)) return next();
}; 

// GET: /admin
router.get('/', canAdmin, controllers.home.getHome);

// GET: /admin/clients
router.get('/clients', canAdmin, controllers.clients.getClients);
// GET: /admin/clients/trash
router.get('/clients/trash', canAdmin, controllers.clients.getClientTrash);
// GET: /admin/clients/new
router.get('/clients/new', canAdmin, controllers.clients.newClient);
// GET: /admin/clients/:id([0-9]+)
router.get('/clients/:id([0-9]+)', canAdmin, controllers.clients.editClient);
router.get('/clients/:clientId([0-9]+)/programs/:programId([0-9]+)/licenses', canAdmin, controllers.clients.getProgramLicenses);


// GET: /admin/users
router.get('/users', canAdmin, controllers.users.getUsers);
// GET: /admin/users/trash
router.get('/users/trash', canAdmin, controllers.users.getUserTrash);
// GET: /admin/users/new
router.get('/users/new', canAdmin, controllers.users.newUser);
// GET: /admin/users/:id([0-9]+)
router.get('/users/:id([0-9]+)', canAdmin, controllers.users.editUser);

// GET: /admin/authoringConfig
router.get('/system-configuration', canAdmin, controllers.systemConfiguration.getHome);

module.exports = router;
