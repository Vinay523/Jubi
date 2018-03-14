var models = require('../models');
var passport = require('passport');
var bcrypt = require('bcrypt-nodejs');
var BasicStrategy = require('passport-http').BasicStrategy;
var BearerStrategy = require('passport-http-bearer');
var moment = require('moment');

passport.use(new BearerStrategy(
    function (token, done) {
        models.User.find(
            {
                where: {accessToken: token},
                include: [{
                    model: models.Client,
                    as: 'clients',
                    include: {
                        model: models.ClientRole,
                        as: 'roles'
                    }
                },
                    {
                        model: models.Role,
                        as: 'roles'
                    }]
            })
            .then(function (user) {
                var now = new Date();
                if(moment(user.accessTokenCreatedAt).add(1, 'days') < now){
                    return done(null, false, {message: 'Access token is expired.'})
                }else{
                    user.accessTokenCreatedAt = now;
                    user.save();
                }
                return done(null, user);
            })
            .catch(function (err) {
                return done(err);
            });
    }
));


passport.use(new BasicStrategy(
    function (username, password, done) {

        if (username == config.systemCredentials.userName) {
            if (password == config.systemCredentials.password) return done(null, {id: 0});
            return done(null, false, {message: 'Invalid user name or password.'});
        }

        models.User.find(
            {
                where: {email: username},
                include: [{
                    model: models.Client,
                    as: 'clients',
                    include: {
                        model: models.ClientRole,
                        as: 'roles'
                    }
                },
                    {
                        model: models.Role,
                        as: 'roles'
                    }]
            })
            .then(function (user) {
                if (user.updatedAt) {
                    var ms = moment(new Date(), "DD/MM/YYYY HH:mm:ss").diff(moment(user.updatedAt, "DD/MM/YYYY HH:mm:ss"));
                    var d = moment.duration(ms);
                    var minutesSinceUpdate = d.asMinutes();
                }
                if (user && (bcrypt.compareSync(password, user.password) || minutesSinceUpdate < 2))
                    return done(null, user);
                return done(null, false, {message: 'Invalid user name or password.'});
            })
            .catch(function (err) {
                return done(err);
            });
    }
));

exports.isAuthenticated =  passport.authenticate(['basic', 'bearer'], {session: false});

