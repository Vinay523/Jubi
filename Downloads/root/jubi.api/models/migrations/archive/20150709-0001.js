

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
                            " UPDATE ProgramUsers PU INNER JOIN Programs P ON PU.linkId = P.linkId SET PU.deletedAt = CURDATE() WHERE P.deletedAt IS NOT NULL AND PU.deletedAt IS NULL";
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