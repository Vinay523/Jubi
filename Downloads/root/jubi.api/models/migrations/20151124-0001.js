var services = require('../../services');

var async = require('async');
var Q = require('q');

module.exports = {
    up: function (migration, DataTypes) {
        return Q.Promise(function (resolve, reject) {
            async.series([
                    function (callback) {
                        migration.addColumn(
                            'Clients',
                            'headerColor',
                            {
                                type: DataTypes.STRING(20)
                            }
                        ).then(function () {
                                callback();
                            })
                            .catch(callback)
                    },
                    function (callback) {
                        migration.addColumn(
                            'Clients',
                            'headerFontColor',
                            {
                                type: DataTypes.STRING(20)
                            }
                        ).then(function () {
                                callback();
                            })
                            .catch(callback)
                    },
                    function (callback) {
                        migration.addColumn(
                            'Clients',
                            'backgroundColor',
                            {
                                type: DataTypes.STRING(20)
                            }
                        ).then(function () {
                                callback();
                            })
                            .catch(callback)
                    },
                    function (callback) {
                        migration.addColumn(
                            'Clients',
                            'logoImageUrl',
                            {
                                type: DataTypes.STRING(200)
                            }
                        ).then(function () {
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