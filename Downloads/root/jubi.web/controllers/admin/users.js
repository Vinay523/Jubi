var app = require('../../app');
var services = require('../../services');

// User listing page
exports.getUsers = function(req, res) {
	res.render(config.appName, 'admin/users/listing', {trash:false}, 'admin');
};

// User trash listing page
exports.getUserTrash = function(req, res) {
	res.render(config.appName, 'admin/users/listing', {trash:true}, 'admin');
};

// User edit page
exports.newUser = function(req, res) {
	var data = { userId: 0 };
	res.render(config.appName, 'admin/users/edit', data, 'admin');
};

// User edit page
exports.editUser = function(req, res) {
	var data = { userId: parseInt(req.params.id) };
	res.render(config.appName, 'admin/users/edit', data, 'admin');
};


