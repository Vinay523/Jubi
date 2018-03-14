var services = require('../services');

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var RememberMeStrategy = require('passport-remember-me').Strategy;
var request = require('request');

// Serialize user information to the session.
passport.serializeUser(function(user, done) {
    done(null, {id:user.id, apiKey:user.apiKey, authHeader:user.authHeader});
});

// Reload the session user using the data serialized in the call above.
passport.deserializeUser(function(user, done) {
    var options = {
        headers: user.authHeader,
        rejectUnauthorized: false
    };
    request.get(config.web.apiUrl + '/me', options,
        function(err, response, sessionUser) {
            if (err) return services.helpers.handleReject(err, done);
            if (response.statusCode != 200)
                //return services.helpers.handleReject('Bad request', done);

                //Need to return null, null here to ensure we go to the login page
                return done(null, null);

            // Setup the session user
            sessionUser = JSON.parse(sessionUser);
            sessionUser.apiKey = user.apiKey;
            sessionUser.authHeader = user.authHeader;


            done(null, sessionUser);
        });
});

// Local authentication policy. Uses the session service to authenticate using
// the user's user name and password.
passport.use(new LocalStrategy(
    function (email, password, done) {
        services.session.auth(email, password).then(
            function(user) { done(null, user); },
            function(err) { done(err); });
    }));


// Remember me authentication policy.
passport.use(new RememberMeStrategy({key: config.cookies.rememberMe},
    function(token, done) {
        services.session.consumeRememberMeToken(token, function(err, id) {
            if (err) { return done(err); }
            if (!id) { return done(null, false); }

            // Get the session user
            services.session.restartSession(id)
                .then(function(result) { done(null, result ? result.data : null); })
                .catch(function(err) { done(err, false); });
        });
    },
    function(user, done) {
        services.session.saveRememberMeToken(user.id, function(err, token) {
            if (err) { return done(err); }
            return done(null, token);
        });
    }
));