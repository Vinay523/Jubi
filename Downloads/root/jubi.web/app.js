var _ = require('underscore');
async = require("async");

// Initialize the configuration.
var initConfig = function () {
    console.log("Init Config in app.js ");
    var log4js = require('log4js');

    // Make sure environment is set
    process.env.NODE_ENV = process.env.NODE_ENV || 'local';

    // Load whole config file
    var configAll = require('./config/app');

    // Get the environment config.
    global.config = configAll[process.env.NODE_ENV];

    // Merge common config section.
    _.defaults(config, configAll['common']);

    // Configure and get logger
    log4js.configure(config.log4js);
    // Get the logger and set level
    global.logger = log4js.getLogger(config.appName);
    logger.setLevel(config.log4js.level);
};
initConfig();

var services = require('./services');

var initServer = function () {
    console.log("initServer in app.js ");
    var cluster = require('cluster');

    // Run the server!
    try {

        // Primary worker logic.
        var worker = function() {

            var express = require('express');
            var bodyParser = require('body-parser');
            var cookieParser = require('cookie-parser');
            var session = require('express-session');
            var favicon = require('serve-favicon');
            var passport = require('passport');
            var lessMiddleware = require('less-middleware');
            var path = require('path');
            var compression = require('compression');

            var app = express();

            // View engine setup
            app.set('view engine', 'ejs');

            app.use(function(req, res, next) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
                next();
            });

            app.use(lessMiddleware(path.join(__dirname, 'static'), { force:(process.env.NODE_ENV == 'local' || process.env.NODE_ENV == 'development') }));
            app.use(express.static(path.join(__dirname, 'static')));

            app.use(favicon(path.join(__dirname, 'static/img/favicon.ico')));

            // If dev, log the route
            if (logger.isTraceEnabled()) {
                app.use(function(req, res, next) {
                    logger.trace('[%s|%s] %s: %s', req.get('host'), cluster.worker ? cluster.worker.id : 'worker', req.method,
                        req.protocol + '://' + req.headers.host + req.url);
                    next();
                });
            }

             //Is ssl enabled?
            if (config.ssl) {
                console.log("SSL enabled in app.js ");
                // Always redirect to HTTPS
                app.use(function(req, res, next) {
                    if (req.protocol === 'https') return next();
                    res.redirect('https://' + req.headers.host + req.url);
                });
            }




            app.use(bodyParser.json());
            app.use(bodyParser.urlencoded({ extended: false }));

            app.use(cookieParser());

            //app.use(function (req, res) {
            //    res.clearCookie(config.session.name, { path: '/' });
            //});

            var SQLiteStore = require('connect-sqlite3')(session);
            app.use(session({
                store: new SQLiteStore(),
                name: config.session.name,
                secret: config.session.secret,
                rolling: true,
                resave: true,
                saveUninitialized: false,
                cookie: {
                    path: '/',
                    domain: '.' + config.web.host,
                    maxAge: 1000 * 60 * 60 // 1 hour
                }
            }));


            // Initialize the helper service.
            app.use(services.helpers.initialize());

            // Initialize the session service.
            app.use(services.session.initialize());

            // Initialize the view service.
            app.use(services.view.initialize(path.join(__dirname, 'views')));

            // Initialize passport
            app.use(passport.initialize());
            app.use(passport.session());
            app.use(passport.authenticate('remember-me'));

            // Initialize routes
            app.use(services.subdomains.middleware);

            // Manage routing
            app.use('/manage', require('./routes/manage'));

            // User routing
            app.use('/user', require('./routes/user'));

            // Administration application routing
            app.use('/admin', require('./routes/admin'));

            // Main application routing
            app.use('/', require('./routes/app'));

            // Catch 404 and render not found page
            app.use(services.helpers.initialize404Handler());

            // Handle all other errors
            app.use(services.helpers.initializeErrorHandler());

            // compress all responses
            app.use(compression({ filter: shouldCompress }))
            function shouldCompress(req, res) {
                if (req.headers['x-no-compression']) {
                    // don't compress responses with this request header
                    return false
                }

                return true;
                
                // fallback to standard filter function
                //return compression.filter(req, res)
            }

            var http = require('http');

             //Is ssl enabled?
            if (config.ssl) {
                var fs = require('fs');
                var https = require('https');

                //if (config.ssl.ca) https.globalAgent.options.ca = [fs.readFileSync(config.ssl.ca)];

                var credentials = {
                    key: fs.readFileSync(config.ssl.privateKey, 'utf8'),
                    cert: fs.readFileSync(config.ssl.certificate, 'utf8'),
                };
                logger.info(JSON.stringify(credentials));
                if (config.ssl.ca) credentials.ca = fs.readFileSync(config.ssl.ca);

                // Create server and bind to a port
                var httpsServer = https.createServer(credentials, app);

                // Bind to https port
                httpsServer.listen(config.web.sslPort);
            }

            // Always create HTTP server and bind to port
            var httpServer = http.createServer(app);
            httpServer.listen(config.web.port);

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
                if (onlineCount == cpuCount) logger.info('Cluster Listening on %d%s!', config.web.port, config.ssl ? (' & ' + config.web.sslPort) : '');
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





