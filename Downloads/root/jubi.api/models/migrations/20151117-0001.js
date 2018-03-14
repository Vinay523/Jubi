var services = require('../../services');

var async = require('async');
var Q = require('q');

module.exports = {
    up: function (migration, DataTypes) {
        return Q.Promise(function (resolve, reject) {



            async.series([
                    function (callback) {
                        migration.sequelize.query(
                            ' ALTER TABLE `jubi`.`Clients`' +
                            ' DROP INDEX `clients_slug` , ' +
                            ' ADD INDEX `clients_slug` (`slug` ASC);').then(function () {
                            callback();
                        }).catch(callback);
                    }

                ],
                function (err) {
                    if (err) return services.helpers.handleReject(err, reject);
                    resolve();
                });
        });
    },
    down: function (migration) {
        return Q.Promise(function (resolve, reject) {

        });
    }
};




