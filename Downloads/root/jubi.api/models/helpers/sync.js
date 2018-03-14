var models = require('../../models');
var services = require('../../services');

var async = require('async');
var path = require('path');
var Q = require('q');
var fs = require('fs');
var fixtures = require('sequelize-fixtures');

var mysql = require('mysql');

exports.syncScripts = syncScripts = function() {

    var _syncScripts = function (dir) {

        return Q.Promise(function (resolve, reject) {

            var connection = mysql.createConnection({
                host: config.database.host,
                port: config.database.port,
                user: config.database.username,
                password: config.database.password,
                database: config.database.database,
                multipleStatements: true
            });

            logger.debug('Sync scripts [%s]...', dir);

            var files = fs.readdirSync(dir);
            async.eachSeries(files,
                function (file, callback) {
                    // Is it an sql file?
                    if (path.extname(file) != '.sql') return callback(null);

                    logger.debug('Sync script: %s', file);
                    var sql = fs.readFileSync(path.join(dir, file), {encoding: 'utf8'});
                    //logger.debug(sql);

                    connection.query(sql, function (err) {
                        callback(err);
                    });
                },
                function (err) {
                    if (err) return reject(err);
                    resolve();
                })
        });
    };

    return Q.Promise(function(resolve, reject) {
        // Sync the functions
        _syncScripts(path.join(__dirname, '../scripts/functions'))
            .then(function () {

                // Sync the procedures
                _syncScripts(path.join(__dirname, '../scripts/procedures'))
                    .then(function () {

                        // Sync the triggers
                        _syncScripts(path.join(__dirname, '../scripts/triggers'))
                            .then(function () {

                                // Sync the views
                                _syncScripts(path.join(__dirname, '../scripts/views'))
                                    .then(function () {
                                        logger.info('Scripts synced!');
                                        resolve();
                                    })
                                    .catch(function (err) {
                                        services.helpers.handleReject(err, reject);
                                    });

                            })
                            .catch(function (err) {
                                services.helpers.handleReject(err, reject);
                            });
                    })
                    .catch(function (err) {
                        services.helpers.handleReject(err, reject);
                    });
            })
            .catch(function (err) {
                services.helpers.handleReject(err, reject);
            });
    });

};

exports.sync = function () {

    return Q.Promise(function (resolve, reject) {
        // Sync the database
        models.sequelize.query('SET FOREIGN_KEY_CHECKS = 0', {raw: true})
            .then(function () {

                // These are view with entities, remove so tables are not created.
                delete models.PollResults;
                delete models.ProgramUserStats;

                models.sequelize.sync({force: true})
                    .then(function () {
                        logger.info('Database tables synchronized!');

                        // Sync the scripts
                        syncScripts()
                            .then(function() {

                                // Seed database
                                fixtures.loadFiles([
                                    path.join(__dirname, '../data/challengeQuestionTypes.json'),
                                    path.join(__dirname, '../data/roles.json'),
                                    path.join(__dirname, '../data/users.json'),
                                    path.join(__dirname, '../data/programs.json'),
                                    path.join(__dirname, '../data/levels.json'),
                                    path.join(__dirname, '../data/clientRoles.json')
                                ], models, function () {
                                    logger.info('Database seeded!');
                                    resolve();
                                });
                            })
                            .catch(function (err) {
                                services.helpers.handleReject(err, reject);
                            });

                    })
                    .catch(function (err) {
                        services.helpers.handleReject(err, reject);
                    });
            });
    });
};