/**
 * Created by josh.matthews on 9/16/16.
 */
var services = require('../../services');

var async = require('async');
var Q = require('q');

module.exports = {
    up: function (migration, DataTypes) {
        return Q.Promise(function (resolve, reject) {
            async.series([
                    function (callback) {
                        migration.addColumn(
                            'Challenges',
                            'finishUploadText',
                            {
                                type: DataTypes.STRING(1000)
                            }
                        ).then(function () {
                            callback();
                        }).catch(callback)
                    },
                    function (callback) {
                        migration.addColumn(
                            'Challenges',
                            'finishDownloadText',
                            {
                                type: DataTypes.STRING(1000)
                            }
                        ).then(function () {
                            callback();
                        }).catch(callback)
                    },
                    function (callback) {
                        migration.addColumn(
                            'Challenges',
                            'finishLinkText',
                            {
                                type: DataTypes.STRING(1000)
                            }
                        ).then(function () {
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
};/**
 * Created by josh.matthews on 8/30/16.
 */
