var app = require('../../../app');
var models = require('../../index')(app);
var services = require('../../../services/index');

var async = require('async');
var Q = require('q');

module.exports = {
    up: function (migration, DataTypes) {
        return Q.Promise(function (resolve, reject) {
            async.series([
                    function (callback) {
                        migration.addColumn(
                            'UserChallengeMedia',
                            'refTable', {
                                type: DataTypes.STRING(50)
                            }).then(function () {
                                callback();
                            })
                            .catch(callback)
                    },
                    function (callback) {
                        migration.addColumn(
                            'UserChallengeMedia',
                            'refId', {
                                type: DataTypes.INTEGER
                            }).then(function () {
                                callback();
                            })
                            .catch(callback)
                    },
                    function (callback) {
                        migration.addColumn(
                            'ChallengeResults',
                            'refTable', {
                                type: DataTypes.STRING(50)
                            }).then(function () {
                                callback();
                            })
                            .catch(callback)
                    },
                    function (callback) {
                        migration.addColumn(
                            'ChallengeResults',
                            'refId', {
                                type: DataTypes.INTEGER
                            }).then(function () {
                                callback();
                            })
                            .catch(callback)
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