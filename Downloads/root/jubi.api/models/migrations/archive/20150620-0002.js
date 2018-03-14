

var services = require('../../services');

var async = require('async');
var Q = require('q');

module.exports = {
    up: function (migration, DataTypes) {
        return Q.Promise(function (resolve, reject) {
            async.series([
                    function (callback) {
                        var db = models.sequelize;

                        db.query("INSERT INTO SequencingTypes VALUES  (1, 'In Order', NOW(), NULL)")
                            .then(function () {
                                callback();
                            }).catch(callback)
                    },
                    function (callback) {
                        var db = models.sequelize;

                        db.query("INSERT INTO SequencingTypes VALUES  (2, 'Parallel', NOW(), NULL)")
                            .then(function () {
                                callback();
                            }).catch(callback)
                    },
                    function (callback) {
                        var db = models.sequelize;

                        db.query("INSERT INTO SequencingTypes VALUES  (3, 'Interval', NOW(), NULL)")
                            .then(function () {
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