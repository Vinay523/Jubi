var _ = require('underscore');
var log4js = require('log4js');

// Initialize the configuration.
var initConfig = function() {
    
    // Make sure environment is set
    process.env.NODE_ENV = process.env.NODE_ENV || 'localWithPorts';
    console.log(process.env.NODE_ENV);

    // Load whole config file
    var configAll = require('./config/app');
    var configDb = require('./config/db');

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


var models = require('./models');
var services = require('./services');

// Sync database?
if (process.argv.indexOf('dbsync') !== -1) {
    log4js.loadAppender('console');
    var sync = require('./models/helpers/sync');
    sync.sync()
        .then(function() { process.exit(0); })
        .catch(function(err) {
            logger.error(err);
            process.exit(1);
        });
    return;
}

// Migrate database?
if (process.argv.indexOf('migrate:up') !== -1) {
    log4js.loadAppender('console');
    var migrate = require('./models/helpers/migrate');
    migrate.migrate()
        .then(function() { process.exit(0); })
        .catch(function(err) {
            logger.error(err);
            process.exit(1);
        });
    return;
}


var initServer = function() {
    var cluster = require('cluster');

    // Run the server!
    try {

        // Primary worker logic.
        var worker = function() {
            var compression = require('compression');
            var express = require('express');
            var bodyParser = require('body-parser');
            var passport = require('passport');
            var lessMiddleware = require('less-middleware');
            var path = require('path');
            var nodeCache = require("node-cache");
            global.appCache = new nodeCache({ stdTTL: 600, checkperiod: 600 });

            var app = express();

            // compress responses
            app.use(compression());

            global.emailPath = path.join(__dirname, 'emails');

            app.use(function(req, res, next) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
                next();
            });

            app.use(lessMiddleware(path.join(__dirname, 'emails'), {
                debug: false,
                force:(process.env.NODE_ENV == 'local' || process.env.NODE_ENV == 'development')
            }));
            app.use(express.static(path.join(__dirname, 'emails')));

            // If trace enabled
            if (logger.isDebugEnabled()) {
                app.use(function(req, res, next) {
                    logger.debug('[%s|%s] %s: %s', req.get('host'), cluster.worker ? cluster.worker.id : 'worker', req.method, req.url);
                    next();
                });
            }

            app.use(bodyParser.json({limit: '100mb'}));
            app.use(bodyParser.urlencoded({ extended: false }));

            // Initialize the helper service.
            app.use(services.helpers.initialize());

            // Initialize the options request handler
            app.use(services.helpers.handleOptionsRequest());

            // Initialize passport
            app.use(passport.initialize());

            // Main application routing
            app.use('/', require('./routes'));

            // Catch 404 and render not found page
            app.use(services.helpers.initialize404Handler());

            // Handle all other errors
            app.use(services.helpers.initializeErrorHandler());

            var server;
            if (config.ssl.certificate && config.ssl.privateKey) {
                var fs = require('fs');
                var https = require('https');

                //if (config.ssl.ca) https.globalAgent.options.ca = [fs.readFileSync(config.ssl.ca)];

                var credentials = {
                    key: fs.readFileSync(config.ssl.privateKey, 'utf8'),
                    cert: fs.readFileSync(config.ssl.certificate, 'utf8'),
                };
                if (config.ssl.ca) credentials.ca = fs.readFileSync(config.ssl.ca);

                // Create server and bind to a port
                server = https.createServer(credentials, app);
            }
            else {
                var http = require('http');
                server = http.createServer(app);
            }


            // Bind to port
            server.listen(config.web.port);

            if (config.runtime.mode == 'worker') logger.info('V%s Worker (NON CLUSTERED) Listening on %d!', config.version, config.web.port);
        };

        // Primary master logic.
        var master = function() {

            // Count the machine's CPUs
            var cpuCount = (!config.runtime.forks || config.runtime.forks == 'all') ?
                require('os').cpus().length : Math.min(require('os').cpus().length, config.runtime.forks);
            var onlineCount = 0;

            // Create a worker for each CPU
            for (var i = 0; i < cpuCount; i += 1) cluster.fork();

            // Listen for workers to come online
            cluster.on('online', function(worker) {
                logger.info('Worker %d is online.', worker.id);

                onlineCount++;
                if (onlineCount == cpuCount) logger.info('Cluster Listening on %d!', config.web.port);
            });
            // Listen for dying workers
            cluster.on('exit', function (worker) {
                logger.warn('Worker %d died!', worker.id);
                // Replace the dead worker?
                if (config.runtime.restartFailed) cluster.fork();
            });
        };

        // If running in worker mode, start single worker and leave.
        if (config.runtime.mode == 'worker') return worker();

        // Is the master process?
        if (cluster.isMaster) master();
        else worker();
    }
    catch (err) {
        logger.error(err);
        process.exit(1);
    }
};
initServer();




