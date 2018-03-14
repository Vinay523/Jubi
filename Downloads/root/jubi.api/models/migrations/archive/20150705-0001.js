

var services = require('../../services');

var async = require('async');
var Q = require('q');

module.exports = {
    up: function (migration, DataTypes) {
        return Q.Promise(function (resolve, reject) {
            async.series([
                    function (callback) {
                        migration.createTable('ClientRoles', {
                            id: {
                                type: DataTypes.INTEGER,
                                primaryKey: true,
                                autoIncrement: true
                            },
                            name: DataTypes.STRING(255),
                            createdAt: DataTypes.DATE,
                            updatedAt: DataTypes.DATE
                        }).then(function(){
                            callback();
                        }).catch(callback);
                    },
                    function(callback) {
                        Q.all([
                            migration.addIndex('ClientRoles', ['name'], { indicesType: 'UNIQUE'})
                                .then(function(){ callback(); }).catch(callback)
                        ]).then(function() {callback()});
                    },
                    function(callback) {
                        models.ClientRole.bulkCreate([{
                            id: 1,
                            name: 'Content Provider'
                        },{
                            id: 2,
                            name: 'Content Consumer'
                        }]).then(function(){ callback(); }).catch(callback);
                    },
                    function (callback) {
                        migration.createTable('ClientClientRoles', {
                            id: {
                                type: DataTypes.INTEGER,
                                primaryKey: true,
                                autoIncrement: true
                            },
                            clientId:{
                                type: DataTypes.INTEGER,
                                references: {
                                    model: 'Clients',
                                    key: 'id'
                                },
                                onUpdate: 'CASCADE',
                                onDelete: 'CASCADE'
                            },
                            roleId:{
                                type: DataTypes.INTEGER,
                                references: {
                                    model: 'ClientRoles',
                                    key: 'id'
                                },
                                onUpdate: 'CASCADE',
                                onDelete: 'CASCADE'
                            },
                            createdAt: DataTypes.DATE,
                            updatedAt: DataTypes.DATE
                        }).then(function(){ callback(); }).catch(callback);
                    },
                    function(callback) {
                        migration.addIndex('ClientClientRoles', ['clientId', 'roleId'], { indicesType: 'UNIQUE'})
                            .then(function(){ callback(); }).catch(callback);
                    },
                    function (callback) {
                        //Changed this migration to only select id because I added seats property to clients in later migration, but since
                        //it is alreay in the seuqelize model at this point it will try to select it here and cause an error
                        models.Client.findAll({attributes: ['id']})
                            .then(function(clients) {
                                async.each(clients, function(client) {
                                    // All clients get both roles.
                                    models.ClientClientRole.bulkCreate([{clientId: client.id, roleId: 1 },{clientId: client.id, roleId: 2}])
                                        .then(function(){ callback(); }).catch(callback);
                                });
                            });
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