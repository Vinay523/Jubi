

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
                            'deletedAt',
                            {
                                type: DataTypes.DATE,
                                allowNull: true
                            }
                        ).then(function(){
                                callback();
                            }).catch(callback);
                    },
                    function (callback) {
                        migration.addIndex('Clients', ['deletedAt'])
                            .then(function(){
                                callback();
                            }).catch(callback);
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
            migration.removeColumn('Person', 'signature');
            resolve();
        });
    }
};