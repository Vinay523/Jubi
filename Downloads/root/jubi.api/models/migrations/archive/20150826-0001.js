var app = require('../../../app');
var models = require('../../index')(app);
var services = require('../../../services/index');

var async = require('async');
var Q = require('q');

module.exports = {
    up: function (migration, DataTypes) {
        return Q.Promise(function (resolve, reject) {
            async.series([
                    function (callback) {
                        migration.createTable('ProgramUserAssociationTypes', {
                            id: {
                                type: DataTypes.INTEGER,
                                primaryKey: true,
                                autoIncrement: true
                            },
                            type: DataTypes.STRING(150),
                            createdAt: DataTypes.DATE,
                            updatedAt: DataTypes.DATE
                        }).then(function () { callback(); }).catch(callback);
                    },
                    function (callback) {
                        migration.createTable('ProgramUserAssociations', {
                            id: {
                                type: DataTypes.INTEGER,
                                primaryKey: true,
                                autoIncrement: true
                            },
                            programUserId: {
                                type: DataTypes.INTEGER,
                                references: {
                                    model: 'ProgramUsers',
                                    key: 'id'
                                },
                                onUpdate: 'CASCADE',
                                onDelete: 'CASCADE'
                            },
                            associatedProgramUserId: {
                                type: DataTypes.INTEGER,
                                references: {
                                    model: 'ProgramUsers',
                                    key: 'id'
                                },
                                onUpdate: 'CASCADE',
                                onDelete: 'CASCADE'
                            },
                            typeId: {
                                type: DataTypes.INTEGER,
                                references: {
                                    model: 'ProgramUserAssociationTypes',
                                    key: 'id'
                                },
                                onUpdate: 'CASCADE',
                                onDelete: 'CASCADE'
                            },
                            createdAt: DataTypes.DATE,
                            updatedAt: DataTypes.DATE,
                            deletedAt: DataTypes.DATE
                        }).then(function () { callback(); }).catch(callback);
                    },
                    function (callback) {
                        migration.addIndex('ProgramUserAssociationTypes', ['type'])
                            .then(function(){ callback(); }).catch(callback);
                    },
                    function (callback) {
                        migration.addIndex('ProgramUserAssociations', ['programUserId'])
                            .then(function(){ callback(); }).catch(callback);
                    },
                    function (callback) {
                        migration.addIndex('ProgramUserAssociations', ['associatedProgramUserId'])
                            .then(function(){ callback(); }).catch(callback);
                    },
                    function (callback) {
                        migration.sequelize.models.ProgramUserAssociationType.create({
                            type: 'Buddy'
                        }).then(function(){ callback(); }).catch(callback);
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