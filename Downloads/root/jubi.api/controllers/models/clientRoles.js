var models = require('../../models');
var controllerBase = require('./controllerBase');

var util = require('util');

function ClientRoleController(model){
    controllerBase.call(this, model);
}
util.inherits(ClientRoleController, controllerBase);
module.exports = new ClientRoleController(models.ClientRole);
