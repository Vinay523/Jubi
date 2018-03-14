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
                        migration.createTable('ssoProviderPrograms', {
                            id: {
                                type: DataTypes.INTEGER,
                                primaryKey: true,
                                autoIncrement: true
                            },
                            providerProgramId: DataTypes.STRING(24),
                            linkId:DataTypes.STRING(24),
                            providerId: {
                                type: DataTypes.INTEGER(),
                                references: {
                                    model: 'ssoProviders',
                                    key: 'id'
                                },
                                onUpdate: 'CASCADE',
                                onDelete: 'CASCADE'
                            }
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
};/**
 * Created by josh.matthews on 8/30/16.
 */
