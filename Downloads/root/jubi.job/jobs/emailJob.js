var models = require('../../jubi.api/models');
models.sequelize.logging = function(str) {};

var moment = require('moment');
var Q = require('q');
var async = require('async');

var AWS = require('aws-sdk');
AWS.config.update(config.aws);
var ses = new AWS.SES();

// Email job object
function EmailJob() {
    var self = this;

    self.name = 'EmailJob';
    self.nextRun = 0;
}


// Job entry point
EmailJob.prototype.run = function() {
    var self = this;

    return Q.Promise(function(resolve, reject) {
        try {
            // Time to run?
            if (moment().valueOf() < self.nextRun) return resolve();

            logger.debug('%s running...', self.name);

            // Get all the pending encoding objects
            models.Email.findAll({ where: {status: 'new'} })
                .then(function(emails) {

                    // Are there any emails?
                    if (emails.length <= 0) {
                        logger.debug('%s done. No emails!', self.name);

                        // Set the next run time
                        self.nextRun = moment().valueOf() + config.emailJob.interval;
                        return resolve();
                    }

                    models.sequelize.transaction().then(function(t) {

                        // Loop through the emails
                        async.eachSeries(emails, function(email, callback) {

                            var ops = {
                                Source: email.from,
                                Destination: { ToAddresses: [email.to] },
                                Message: {
                                    Subject: { Data: email.subject },
                                    Body: {
                                        Html: { Data: email.html },
                                        Text: { Data: email.text }
                                    }
                                }
                            };
                            if (email.cc) ops.Destination.CcAddresses = email.cc.split(',');

                            // Send the email
                            ses.sendEmail(ops , function(err) {

                                if(err) {
                                    logger.error('Email %d not sent to %s, ERROR: ' + err.toString(), email.id, email.to);
                                    email.status = 'na';
                                    email.save({transaction: t})
                                        .then(function() {
                                            models.Communication.build({
                                                status: 'error',
                                                ref: 'Emails',
                                                refId: email.id,
                                                message: JSON.stringify(err)
                                            }).save({transaction: t})
                                                .then(function() { callback(); })
                                                .catch(callback);
                                        })
                                        .catch(function(err) { callback(err); });
                                    return;
                                }

                                logger.info('Email %d sent to %s', email.id, email.to);
                                email.status = 'sent';
                                email.save({transaction: t})
                                    .then(function() {
                                        models.Communication.build({
                                            status: 'ok',
                                            ref: 'Emails',
                                            refId: email.id
                                        }).save({transaction: t})
                                            .then(function() { return callback(err); })
                                            .catch(callback);

                                    })
                                    .catch(function(err) { callback(err); });
                            });

                        }, function(err) {
                            if (err) {
                                t.rollback();
                                logger.error(err);
                                return reject(err);
                            }
                            t.commit();
                            // Set next run time
                            self.nextRun = moment().valueOf() + (emails.length * 1000);
                            resolve();
                        });
                    });
                })
                .catch(function(err) { reject(err); });
        }
        catch (err) {
            logger.error(err);
            reject(err);
        }
    });
};

// Export the job object
module.exports = EmailJob;