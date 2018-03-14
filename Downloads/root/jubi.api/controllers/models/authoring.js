var models = require('../../models');
var controllerBase = require('./controllerBase');
var Q = require('q');
var util = require('util');
var async = require('async');

function AuthoringController() {
}

util.inherits(AuthoringController, controllerBase);

var controller = new AuthoringController();

AuthoringController.prototype.getConfigurations = function (req, res) {
    controller._getConfigurations()
        .then(function (program) {
            res.sendSuccess(program);
        })
        .catch(function (err) {
            res.sendError(err);
        });
};

AuthoringController.prototype._getConfigurations = function () {
    return Q.Promise(function (resolve, reject) {
        models.SystemConfiguration.findAll().then(function (confiugrations) {
            resolve(confiugrations);
        }).catch(function (err) {
            reject(err);
        })
    });
};

AuthoringController.prototype.saveConfigurations = function (req, res) {
    models.sequelize.transaction().then(function (t) {
        controller._saveConfigurations(req.body, t)
            .then(function (program) {
                t.commit().then(function() { res.sendSuccess(program); });
            })
            .catch(function (err) {
                t.rollback().then(function() { res.sendError(err); });
            });
    });
};

AuthoringController.prototype._saveConfigurations = function (configurations, t) {
    return Q.Promise(function (resolve, reject) {
        models.SystemConfiguration.destroy({
            where: {
                id: {
                    $ne: null
                }
            }
        },  {transaction: t}).then(function () {
            async.eachSeries(configurations,
                function (config, callback) {
                    models.SystemConfiguration.create({
                        key: config.key,
                        value: config.value
                    }, {transaction: t}).then(function(config){
                        callback();
                    }).catch(function(err){
                        callback(err);
                    })
                },
                function (err) {
                    if (err) {
                        reject(err);
                    }
                    resolve();
                });
        }).catch(function (err) {
            reject(err);
        })
    });
};

module.exports = Object.create(AuthoringController.prototype);