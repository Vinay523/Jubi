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
                        models.ssoProviderProgram.create({
                           providerId: 1,
                           providerProgramId: 7436697,
                           linkId: 94959

                        }).then(function () { callback(); }).catch(callback);
                    },
                    function (callback) {
                        models.ssoProviderProgram.create({
                            providerId: 1,
                            providerProgramId: 7436655,
                            linkId: 94966

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
