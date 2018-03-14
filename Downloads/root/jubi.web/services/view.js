var services = require('../services');

var ejs = require('ejs');
var _ = require('underscore');
var fs = require('fs');
var glob = require('glob');
var path = require('path');
var compressor = require('node-minify');

var viewDir = null;
var viewTemplateDefs = [];
var scripts = {};

// Get the view directory
var _setViewDir = function(viewPath) {

    viewDir = viewPath;
    if (!viewDir) throw new Error('View directory is not set!');

    if (viewDir.indexOf('/', viewDir.length - 1) <= -1)
        viewDir = path.join(viewDir,'/');
    viewDir = viewDir.replace(/\\/g,'/');//  content inside / / is replaced. g is not case sensitive. gi is case insensitive.
    return viewDir;
};

var _loadTemplates = function() {
    // Load all template files.
    var files = glob.sync(viewDir + '**/*.ejs');

    // Load into template defs collection
    _.each(files, function(path) {
        var template = path.replace(viewDir, '').replace('.ejs', '');
        viewTemplateDefs.push({
            template: template,
            path: path,
            compiled: null
        })
    });

    //logger.debug(viewTemplateDefs);
};

// Called to inject stuff into pipeline.
exports.initialize = function (viewPath) {
    console.log("initialize in /services/view.js ");
    _setViewDir(viewPath);

    // Load view templates
    _loadTemplates();

    return function(req, res, next) {

        // Replace render with our render.
        res.render = function(title, template, model, layout) {
            if(layout == 'admin'){
                if(model) {
                    model.userIdForProfileNav = req.user.id;
                }else{
                    model = {
                        userIdForProfileNav: req.user.id
                    }
                }
            }

            res.send(services.view.page(req, res, title, template, layout, model));
        };

        next();
    };
};

// Render a page using the provided template and data.
exports.page = function(req, res, title, template, layout, model) {
    console.log("page in /services/view.js ");
    // This function adds the necessary subdomains to the template and layout as needed.
    var _makePaths = function(req, template, layout) {
        // Make sure layout is set.
        layout = 'layouts/' + (layout || 'main');
        return {
            template: template,
            layout: layout
        };
    };

    // Called to find a matching template object
    var _findTemplateDef = function (template) {
        //console.log("_findTemplateDef in /services/view.js ");
        return _.find(viewTemplateDefs, function(viewTemplateDef) {
            return (viewTemplateDef.template == template);
        });
    };

    // Render a partial view
    var _partial = function(req, res, template, data)  {
        //console.log("_partial in /services/view.js ");
        // Make sure data is an object
        if (!data) data = {};

        if (process.env.NODE_ENV == 'local' || process.env.NODE_ENV == 'development') {
            // Always reload view templates
            _loadTemplates();
        }

        var templateDef = _findTemplateDef(template);
        if (!templateDef) {
            var m = 'Template ' + template + ' not found.';
            if (data.parent) m += ' Partial within ' + data.parent.template;
            throw new Error(m);
        }

        // If development, always recompile the template.
        if (!templateDef.compiled || process.env.NODE_ENV == 'local' || process.env.NODE_ENV == 'development')
            templateDef.compiled = ejs.compile(fs.readFileSync(templateDef.path, 'utf8'));

        // Render the template
        return templateDef.compiled(data);
    };

    // Partial from view helprs
    var _partialInView = function (template, model) {
        //console.log("_partialInView in /services/view.js ");
        var paths = _makePaths(req, template, null);
        var pData = {
            model: (model ? model : data.model),
            parent: {
                layout: data.layout,
                template: data.template
            },
            template: paths.template,
            req: req,
            user: req.user,
            config: config,
            logger: logger,
            services: services,
            partial: data.partial
        };
        return _partial(req, res, paths.template, pData);
    };

    // Body render helper
    var _renderBody = function () {
        //console.log("_renderBody in /services/view.js ");
        if (data._bodyRendered) throw new Error('renderBody has already been called.');
        data._bodyRendered = true;
        return data._body;
    };

    // Client info helper
    var _clientInfo = function () {
        //console.log("_clientInfo in /services/view.js ");
        return {
            'apiUrl': config.web.apiUrl,
            'user': req.user ? req.user : false
        };
    };

    // Flash message helpers
    var _flash = function () {
        console.log("_flash in /services/view.js ");
        var result = '';
        if (req.session.flashError || (data.model && data.model.flashError)) {
            result +=
                '<div class="alert alert-danger alert-dismissible" role="alert">\n' +
                '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true"><span aria-hidden="true">&times;</span></button>\n' +
                (req.session.flashError || data.model.flashError) + '\n' +
                '</div>\n';
            req.session.flashError = null;
        }
        if (req.session.flashWarning || (data.model && data.model.flashWarning)) {
            result +=
                '<div class="alert alert-warning alert-dismissible" role="alert">\n' +
                '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>\n' +
                (req.session.flashWarning || data.model.flashWarning) + '\n' +
                '</div>\n';
            req.session.flashWarning = null;
        }
        if (req.session.flashInfo || (data.model && data.model.flashInfo)) {
            result +=
                '<div class="alert alert-info alert-dismissible" role="alert">\n' +
                '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>\n' +
                (req.session.flashInfo || data.model.flashInfo) + '\n' +
                '</div>\n';
            req.session.flashInfo = null;
        }
        if (req.session.flashSuccess || (data.model && data.model.flashSuccess)) {
            result +=
                '<div class="alert alert-success alert-dismissible" role="alert">\n' +
                '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>\n' +
                (req.session.flashSuccess || data.model.flashSuccess) + '\n' +
                '</div>\n';
            req.session.flashSuccess = null;
        }
        return result;
    };

    // Helper to process JS scripts
    var _scripts = function(options) {
        //console.log("_scripts in /services/view.js ");
        var _clean = function(name) {
            var dir = path.join(__dirname, '../static/js');
            var files = fs.readdirSync(dir);
            _.each(files, function(file) {
                if (file.indexOf(name + '-') == 0) {
                    fs.unlinkSync(path.join(dir, file));
                }
            });
        };

        if (process.env.NODE_ENV != 'local' && process.env.NODE_ENV != 'development') {
            if (!options.name) throw new Error('Script block name required');
            if (scripts[options.name]) return scripts[options.name];
        }

        _clean(options.name);

        var result = '';

        if (!options.forceMinify && (process.env.NODE_ENV == 'local' || process.env.NODE_ENV == 'development' || process.env.NODE_ENV == 'qa')) {
            _.each(options.files, function(file) {
                result += '<script type="text/javascript" src="' + file + '"></script>';
            });
            scripts[options.name] = result;
            return scripts[options.name];
        }

        var done = false;
        var files = _.map(options.files, function(file) { return path.join(__dirname, '../static/' + file); });
        var fileName = options.name + '.min.js';
        var outFile = path.join(__dirname, '../static/js/' + fileName);

        new compressor.minify({
            type: 'uglifyjs',
            fileIn: files,
            fileOut: outFile,
            options: options.options,
            callback: function(err) {
                if (err) throw new Error(err);

                var vFile = '/js/' + fileName;
                result = '<script type="text/javascript" src="' + vFile + '"></script>';
                done = true;
            }
        });

        while (!done) require('deasync').runLoopOnce();

        scripts[options.name] = result;
        return scripts[options.name];
    };

    var paths = _makePaths(req, template, layout);
    console.log("Layout Path is: " + paths.layout + ", Template Path is: " + paths.template);
    // Make sure data is an object
    var data = {
        model: model,

        env: process.env.NODE_ENV,
        layout: paths.layout,
        title: title,
        template: paths.template,
        bodyClass: template.replace(/\//g, ' ') + (req.user ? ' auth' : ''),

        req: req,
        user: req.user,
        config: config,
        logger: logger,
        services: services,

        clientInitData: _clientInfo,
        renderBody: _renderBody,
        partial: _partialInView,
        flash: _flash,
        scripts: _scripts
    };

    // Get the body
    data._body = _partial(req, res, paths.template, data);
    data._bodyRendered = false;

    // Get the layout
    return _partial(req, res, paths.layout, data);
};

