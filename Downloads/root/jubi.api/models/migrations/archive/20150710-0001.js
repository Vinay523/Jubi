

var services = require('../../services');

var async = require('async');
var Q = require('q');

module.exports = {
    up: function (migration, DataTypes) {
        return Q.Promise(function (resolve, reject) {
            async.series([
                    function (callback) {
                        var sql = "ALTER TABLE `jubi`.`Programs` DROP FOREIGN KEY `Programs_ibfk_2`";
                        migration.sequelize.query(sql, {
                            type: migration.sequelize.QueryTypes.RAW
                        }).then(function () {
                            callback();
                        }).catch(callback)
                    },
                    function (callback) {
                        migration.dropTable('ContentProviders')
                            .then(function () {
                                callback();
                            }).catch(callback);
                    },
                    function (callback) {
                        var sql = "ALTER TABLE `Programs`" +
                            " ADD CONSTRAINT program_ibfk_2 FOREIGN KEY (`contentProviderId`) REFERENCES `Clients` (`id`)" +
                            " ON UPDATE CASCADE ON DELETE CASCADE";

                        migration.sequelize.query(sql, {
                            type: migration.sequelize.QueryTypes.RAW
                        }).then(function () {
                            callback();
                        }).catch(callback)
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