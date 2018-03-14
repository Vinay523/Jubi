/**
 * Created by josh.matthews on 8/30/16.
 */

var models = require('../../models');
var services = require('../../services');

var async = require('async');
var Q = require('q');

module.exports = {
    up: function (migration, DataTypes) {
        return Q.Promise(function (resolve, reject) {
            async.series([
                    function (callback) {
                        models.ssoProvider.create({
                            name: 'ALPFA',
                            key: 'ALPFA',
                            scheme: 'YM',
                            apiUrl: 'https://api.yourmembership.com',
                            apiKey: '5D4F68AD-1D62-46D2-B21B-77AFD1CB557F',
                            apiSecret: 'BE2124B0-88B8-4CFD-90D3-C50010ECC9F9',
                            saPasscode: 'b069lEJmf758',
                            clientId: 136
                        }).then(function () { callback(); }).catch(callback);
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
/**
 * Created by josh.matthews on 8/30/16.
 */
