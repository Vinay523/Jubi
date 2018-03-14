var models = require('../../models');
//var controllerBase = require('./controllerBase');
//var services = require('../../services/index');
//var util = require('util');
//var _ = require('underscore');
//var async = require('async');
//var Q = require('q');
var users = require('./users');
//var programs = require('./programs');

var programs = {};

// form data validation
var isFormDataValid = function(req){
    var programUser = req.body.programUser;
    var program = req.body.program;
    var returnValue = {
        isValid: true,
        message: ''
    };

    if(programUser === undefined ||
                (programUser !== undefined && programUser.emailAddress === undefined)){
        returnValue.isValid = false;
        returnValue.message = 'Jubi API, PurchaseProgram - program user data is missing or is invalid.';
    } else if(program === undefined ||
                (program !== undefined && program.id === undefined) ||
                (program !== undefined && program.id !== undefined && isNaN(program.id))){
        returnValue.isValid = false;
        returnValue.message = 'Jubi API, PurchaseProgram - program data is missing or is invalid.';
    }

    return returnValue;
};

// map incoming leader cast data to structure expected by existing create method
var mapLeaderCastData = function(req){
    req.body.id = 0;
    req.body.firstName = req.body.programUser.firstName;
    req.body.lastName = req.body.programUser.lastName;
    req.body.email = req.body.programUser.emailAddress;
    req.body.password = 'p@ssw0rd'; // TODO: how to handle this??? answer...create an auto generated password string
    req.body.title = ''; // TODO: how to handle this???
    req.body.why = ''; // TODO: how to handle this???
    req.body.destination = ''; // TODO: how to handle this???
};

// finds most recent version of a specified program
var mostRecentProgram = function(req, callback){
    var title = req.body.program.title;
    var clientId = req.body.clientId;

    models.Program.find({where: {title: title, clientId: clientId, status: 'ready'}})
        .then(function(program){
            if(program){
                callback(null, program);
            } else {
                callback(new Error('Could not find specified program: ' + title));
            }
        });
};

// assigns a user to a program
var assignUserToProgram = function(req, res, user, program){
    if(program){
        // found specified program!
        //
        // map to existing assignProgramUser data structure
        req.body.linkId = program.linkId;
        req.body.userId = user.id;

        // then assign this user to the specified program
        users.assignProgramUser(req, res, true).then(function(){return;});
    } else {
        // couldn't find specified program in Jubi
        throw new Error('Could not find specified program in Jubi - ' + req.body.program.title);
    }
};

// Purchases a program for a user, sent by Leader Cast.
// If user doesn't exist, the user is created and then
// assigned to the specified program. Otherwise, the
// user is assigned to the specified program.
module.exports.PurchaseProgram = function(req, res){
    // object returned to caller
    var state = {
        status: 'ok',
        message: ''
    };

    // validate expected form fields
    var validation = isFormDataValid(req);
    if(!validation.isValid){
        state.status = 'error';
        state.message = validation.message;
        res.sendError(state);
    }

    // does program user exist in the Jubi world?
    models.User.find({
            where: {email: req.body.programUser.emailAddress}
        })
        .then(function (user) {
            if (!user) {
                // this user does not exist...create before adding user to specified program!
                //
                // user create method requires request body to have certain data
                mapLeaderCastData(req);

                // create user
                users.create(req, res)
                    .then(function (user){
                        // find the most recent version of the specified program
                        mostRecentProgram(req, function(err, program){
                            if(err){
                                state.staus = 'error';
                                state.message = err.message;
                                res.sendError(state);
                            } else {
                                assignUserToProgram(req, res, user, program);
                            }
                        });
                    });
            } else {
                // existing user...just assign user to specified program
                //
                // find the most recent version of the specified program
                mostRecentProgram(req, function(err, program){
                    if(err){
                        state.staus = 'error';
                        state.message = err.message;
                        res.sendError(state);
                    } else {
                        assignUserToProgram(req, res, user, program);
                    }
                });
            }
        })
        .catch(function(err){
            state.status = 'error';
            state.message = err.message;
            res.sendError(state);
        });
};