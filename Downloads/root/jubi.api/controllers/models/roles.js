var models = require('../../models');
var controllerBase = require('./controllerBase');
var util = require('util');


function RoleController(model){
    controllerBase.call(this, model);
}

util.inherits(RoleController, controllerBase);

module.exports = new RoleController(models.Role);