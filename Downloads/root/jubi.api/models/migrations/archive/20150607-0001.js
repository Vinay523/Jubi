

var services = require('../../services');

var async = require('async');
var Q = require('q');

module.exports = {
    up: function (migration, DataTypes) {

        return Q.Promise(function (resolve, reject) {
            async.series([
                    function (callback) {
                        migration.addColumn(
                            'Programs',
                            'sequencingTypeId', {
                                type: DataTypes.INTEGER,
                                allowNull: false
                            }).then(function(){
                                callback();
                            }).catch(callback);
                    },
                    function (callback) {
                        migration.addColumn(
                            'Programs',
                            'sequencingParameters', {
                                type: DataTypes.STRING(200)
                            }).then(function(){
                                callback();
                            }).catch(callback);
                    },
                    function (callback) {
                        migration.addColumn(
                            'Levels',
                            'sequencingParameters', {
                                type: DataTypes.STRING(200)
                            }).then(function(){
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
            async.series([
                function (callback) {
                    migration.removeColumn('Programs', 'sequencingParameters')
                        .then(function(){ callback(); })
                        .catch(function(err){services.helpers.handleReject(err, callback);});
                },
                function (callback) {
                    migration.removeColumn('Programs', 'sequencingTypeId')
                        .then(function(){ callback(); })
                        .catch(function(err){services.helpers.handleReject(err, callback);});
                }
            ], function (err) {
                if (err) return services.helpers.handleReject(err, reject);
                resolve();
            });
        });
    }
};