

var services = require('../../services');

var async = require('async');
var Q = require('q');

module.exports = {
    up: function (migration, DataTypes) {
        return Q.Promise(function (resolve, reject) {
            async.series([
                    function (callback) {
                        migration.renameColumn('Todos', 'description', 'instructions')
                            .then(function(){ callback(); }).catch(callback);
                    },
                    function (callback) {
                        migration.addColumn('Todos', 'points',  DataTypes.INTEGER)
                            .then(function(){ callback(); }).catch(callback);
                    },
                    function (callback) {
                        migration.addColumn('Todos', 'dueByUser', DataTypes.BOOLEAN)
                            .then(function(){ callback(); }).catch(callback);
                    },
                    function (callback) {
                        migration.addColumn('Todos', 'dueDate', DataTypes.DATE)
                            .then(function(){ callback(); }).catch(callback);
                    },
                    function (callback) {
                        migration.addColumn('Todos', 'resourceUrl', DataTypes.STRING(255))
                            .then(function(){ callback(); }).catch(callback);
                    },
                    function (callback) {
                        migration.addColumn('Todos', 'resourceName', DataTypes.STRING(255))
                            .then(function(){ callback(); }).catch(callback);
                    },
                    function (callback) {
                        migration.addColumn('Todos', 'resourceDescription', DataTypes.STRING(1000))
                            .then(function(){ callback(); }).catch(callback);
                    },
                    function (callback) {
                        migration.addIndex('Todos', ['dueDate'])
                            .then(function(){ callback(); }).catch(callback);
                    }
                ],
                function (err) {
                    if (err) return services.helpers.handleReject(err, reject);
                    resolve();
                });
        });
    }
};