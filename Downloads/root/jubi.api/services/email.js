var app = require('../app');
var models = require('../models');
var services = require('../services');

var ejs = require('ejs');
var _ = require('underscore');
var fs = require('fs');
var glob = require('glob');
var path = require('path');
var Q = require('q');
var juice = require('juice');

var emailDir = null;
var emailTemplateDefs = [];


// Set the email directory
var _getEmailDir = function() {
    if (emailDir) return emailDir;

    emailDir = global.emailPath;
    if (!emailDir) throw new Error('Email directory is not set!');

    if (emailDir.indexOf('/', emailDir.length - 1) <= -1)
        emailDir = path.join(emailDir,'/');
    emailDir = emailDir.replace(/\\/g,'/');
    return emailDir;
};

var _loadTemplates = function() {
    // Load all template files.
    var files = glob.sync(_getEmailDir() + '**/*.ejs');

    // Load into template defs collection
    _.each(files, function(path) {
        var template = path.replace(_getEmailDir(), '').replace('.ejs', '');
        emailTemplateDefs.push({
            template: template,
            path: path,
            compiled: null
        })
    });

    //logger.debug(emailTemplateDefs);
};

// Render a email using the provided template and data.
exports.email = function(subject, to, template, layout, model) {

    // This function adds the necessary subdomains to the template and layout as needed.
    var _makePaths = function(template, layout) {
        // Make sure layout is set.
        layout = 'layouts/' + (layout || 'main');
        return {
            template: template,
            layout: layout
        };
    };

    // Called to find a matching template object
    var _findTemplateDef = function(template) {
        return _.find(emailTemplateDefs, function(emailTemplateDef) {
            return (emailTemplateDef.template == template);
        });
    };

    // Render a partial view
    var _partial = function(template, data)  {

        // Make sure data is an object
        if (!data) data = {};

        if (emailTemplateDefs.length <= 0 || process.env.NODE_ENV == 'local' || process.env.NODE_ENV == 'development') {
            // Load/reload reload email templates
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

    // Partial from email helper
    var _partialInView = function(template, model) {
        var paths = _makePaths(template, null);
        var pData = {
            model: (model ? model : data.model),
            parent: {
                layout: data.layout,
                template: data.template
            },
            template: paths.template,
            config: config,
            logger: logger,
            services: services,
            partial: data.partial
        };
        return _partial(paths.template, pData);
    };

    var _buildHtml = function() {
        return Q.Promise(function(resolve, reject) {

            try {
                var paths = _makePaths(template, layout);

                // Make sure data is an object
                var data = {
                    model: model,

                    env: process.env.NODE_ENV,
                    layout: paths.layout,
                    template: paths.template,
                    subject: subject,

                    config: config,
                    logger: logger,
                    services: services,

                    renderBody: function() {
                        if (data._bodyRendered) throw new Error('renderBody has already been called.');
                        data._bodyRendered = true;
                        return data._body;
                    },
                    partial: _partialInView
                };

                // Get the body
                data._body = _partial(paths.template, data);
                data._bodyRendered = false;

                // Get the layout
                var ready = _partial(paths.layout, data);

                resolve(juice(ready));
            }
            catch (err) {
                services.helpers.handleReject(err, reject);
            }
        });
    };
    var _buildText = function() {
        return Q.Promise(function(resolve, reject) {

            try {
                var paths = _makePaths(template + '.text', layout);
                paths.layout += '.text';

                // Make sure data is an object
                var data = {
                    model: model,

                    env: process.env.NODE_ENV,
                    layout: paths.layout,
                    template: paths.template,
                    subject: subject,

                    config: config,
                    logger: logger,
                    services: services,

                    renderBody: function() {
                        if (data._bodyRendered) throw new Error('renderBody has already been called.');
                        data._bodyRendered = true;
                        return data._body;
                    },
                    partial: _partialInView
                };

                // Get the body
                data._body = _partial(paths.template, data);
                data._bodyRendered = false;

                // Get the layout
                resolve(_partial(paths.layout, data));
            }
            catch (err) {
                services.helpers.handleReject(err, reject);
            }
        });
    };

    return Q.Promise(function(resolve, reject) {
        Q.all([
            _buildHtml(),
            _buildText()
        ])
            .then(function(results) {

                models.sequelize.transaction().then(function(t) {
                    models.Email.create({
                        status: 'new',
                        subject: subject,
                        to: to,
                        from: config.email.from,
                        html: results[0],
                        text: results[1]
                    })
                        .then(function() {
                            t.commit().then(function() { resolve(); });
                        })
                        .catch(function(err) {
                            t.rollback().then(function() { services.helpers.handleReject(err, reject); });
                        });
                });
            })
            .catch(function(err) { services.helpers.handleReject(err, reject); });
    });

};

