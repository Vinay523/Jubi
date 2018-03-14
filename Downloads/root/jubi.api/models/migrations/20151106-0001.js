var services = require('../../services');

var async = require('async');
var Q = require('q');

module.exports = {
    up: function (migration, DataTypes) {
        return Q.Promise(function (resolve, reject) {



            async.series([
                    function (callback) {
                        migration.sequelize.query('ALTER TABLE `jubi`.`Programs`' +
                        ' DROP FOREIGN KEY `program_ibfk_2`').then(function () {
                            callback();
                        }).catch(callback);
                    },
                    function (callback) {
                        migration.sequelize.query('ALTER TABLE `jubi`.`Programs`' +
                            ' ADD CONSTRAINT `Programs_ibfk_2`' +
                            ' FOREIGN KEY (`contentProviderId`)' +
                            ' REFERENCES `jubi`.`Clients` (`id`)' +
                            ' ON DELETE CASCADE' +
                            ' ON UPDATE CASCADE').then(function () {
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




