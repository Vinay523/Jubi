var models = require('../../models');
var services = require('../../services');

var async = require('async');
var path = require('path');
var Q = require('q');
var _ = require('underscore');

exports.migrate = function () {


    return Q.Promise(function (resolve, reject) {
        var migration = models.sequelize.getQueryInterface();
        var DataTypes = models.sequelize.constructor;

        var Umzug = require('umzug');
        var umzug = new Umzug({
            storage: 'sequelize',
            storageOptions: { sequelize: models.sequelize },
            migrations: {
                params: [migration, DataTypes],
                path: path.join(__dirname, '../migrations'),
                pattern: /\.js$/
            }
        });

        // Run all prending migrations
        umzug.up()
            .then(function (migrations) {
                if (migrations.length <= 0) logger.info('Migration complete! Nothing to do.');
                else {
                    logger.info('Migrations...');
                    _.each(migrations, function(m) { logger.info(m.file); });
                    logger.info('complete!');
                }

                var sync = require('./sync');

                // Sync the scripts
                sync.syncScripts()
                    .then(function() { resolve(); })
                    .catch(function (err) { services.helpers.handleReject(err, reject); });
            })
            .catch(function(err) {
                logger.error(err);
                reject();
            });
    });
};