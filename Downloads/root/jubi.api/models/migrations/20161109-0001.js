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
                        migration.createTable('ssoProviders', {
                            id: {
                                type: DataTypes.INTEGER,
                                primaryKey: true,
                                autoIncrement: true
                            },
                            name: {
                                type:       DataTypes.STRING(100),
                                allowNull:  false
                            },
                            key:    DataTypes.STRING(24),
                            scheme: DataTypes.ENUM('YM'),
                            apiUrl: DataTypes.STRING(1024),
                            apiKey: DataTypes.STRING(100),
                            apiSecret:DataTypes.STRING(100),
                            saPasscode: DataTypes.STRING(100),
                            clientId: {
                                type: DataTypes.INTEGER(),
                                references: {
                                    model: 'Clients',
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
