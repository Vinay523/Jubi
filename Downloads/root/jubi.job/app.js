var _ = require('underscore');
var async = require('async');


// Initialize the configuration.
var initConfig = function() {

    var log4js = require('log4js');

    // Make sure environment is set
    process.env.NODE_ENV = process.env.NODE_ENV || 'local';

    // Load whole config file
    var configAll = require('./config/app');
    var configDb = require('../jubi.api/config/db.json');

    // Get the environment config.
    global.config = configAll[process.env.NODE_ENV];

    // Merge common config section.
    _.defaults(config, configAll['common']);
    _.defaults(config.database, configDb[process.env.NODE_ENV]);

    // Configure and get logger
    log4js.configure(config.log4js);
    // Get the logger and set level
    global.logger = log4js.getLogger(config.appName);
    logger.setLevel(config.log4js.level);
};
initConfig();


var VideoEncodeJob = require('./jobs/videoEncodeJob');
var EmailJob = require('./jobs/emailJob');
var StatsJob = require('./jobs/statsJob');


var jobIndex = 0;
// Setup the jobs collection
var jobs = [{
    job: new VideoEncodeJob(),
    running: true
}, {
    job: new EmailJob(),
    running: true
}, {
    job: new StatsJob(),
    running: true
}];

logger.info('jubi.job service running!');

// Main job executive loop
async.forever(
    function(next) {
        var job = jobs[jobIndex];

        // Is job still running?
        if (!job.running) {
            jobIndex++;
            if (jobIndex >= jobs.length) jobIndex = 0;
            setTimeout(next, 5000);
            return;
        }


        // Run the job
        job.job.run()
            .then(function() {
                jobIndex++;
                if (jobIndex >= jobs.length) jobIndex = 0;
                setTimeout(next, 5000);
            })
            .catch(function(err) {
                logger.error('%s Error: %j', job.name, err);
                job.running = false;

                jobIndex++;
                if (jobIndex >= jobs.length) jobIndex = 0;
                setTimeout(next, 5000);
            });
    },
    function(err) {
        logger.error(err);
    });
