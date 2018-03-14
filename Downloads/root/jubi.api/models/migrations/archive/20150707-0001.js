

var services = require('../../services');

var async = require('async');
var Q = require('q');

module.exports = {
    up: function (migration, DataTypes) {
        return Q.Promise(function (resolve, reject) {
            async.series([
                    function (callback) {
                        var sql =
                            " SET SQL_SAFE_UPDATES = 0"
                        migration.sequelize.query(sql, {
                            type: migration.sequelize.QueryTypes.RAW
                        }).then(function () {
                            callback();
                        }).catch(callback)
                    },
                    function (callback) {
                        var sql =
                        " DELETE Badges FROM Badges LEFT OUTER JOIN Programs P ON programId = P.id WHERE P.id IS NULL";
                        migration.sequelize.query(sql, {
                            type: migration.sequelize.QueryTypes.RAW
                        }).then(function () {
                            callback();
                        }).catch(callback)
                    },
                    function (callback) {
                        var sql =
                            " SET SQL_SAFE_UPDATES = 1";
                        migration.sequelize.query(sql, {
                            type: migration.sequelize.QueryTypes.RAW
                        }).then(function () {
                            callback();
                        }).catch(callback)
                    },
                    function (callback) {
                        var sql = "ALTER TABLE `Badges`" +
                            " ADD CONSTRAINT badge_ibfk_1 FOREIGN KEY (`programId`) REFERENCES `Programs` (`id`)" +
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