

var services = require('../../services');

var async = require('async');
var Q = require('q');

module.exports = {
    up: function (migration, DataTypes) {
        return Q.Promise(function (resolve, reject) {
            async.series([
                    function (callback) {
                        migration.addColumn('ChallengeQuestionTypes', 'sequence', DataTypes.INTEGER)
                            .then(function(){
                                callback();
                            }).catch(callback);
                    },

                    function (callback) {
                        migration.addIndex('ChallengeQuestionTypes', ['sequence'])
                            .then(function(){
                                callback();
                            }).catch(callback);
                    },

                    function (callback) {
                        models.ChallengeQuestionType.create({
                            status: 'active',
                            name: 'Poll Multi Select'
                        })
                            .then(function() {
                                callback();
                            }).catch(callback);
                    },

                    function (callback) {
                        models.ChallengeQuestionType.findAll()
                            .then(function (types) {
                                async.eachSeries(types, function (type, callback) {

                                    if (type.name == 'Labeling / Naming') {
                                        type.destroy().then(function(){
                                            callback();
                                        }).catch(callback);
                                        return;
                                    }
                                    if (type.name == 'Free Contrasting') {
                                        type.destroy().then(function(){
                                            callback();
                                        }).catch(callback);
                                        return;
                                    }

                                    if (type.name == 'Single Select') {
                                        type.sequence = 1;
                                    }
                                    else if (type.name == 'Multi Select') {
                                        type.sequence = 2;
                                    }
                                    else if (type.name == 'Poll') {
                                        type.sequence = 3;
                                    }
                                    else if (type.name == 'Poll Multi Select') {
                                        type.name = 'Poll Multi Select';
                                        type.sequence = 4;
                                    }
                                    else if (type.name == 'Free Narrative Response') {
                                        type.name = 'Free Response';
                                        type.sequence = 5;
                                    }
                                    else if (type.name == 'Free Fill In The Blank') {
                                        type.name ='Fill in the Blank';
                                        type.sequence = 6;
                                    }
                                    else if (type.name == 'Short Answer') {
                                        type.sequence = 7;
                                    }
                                    else if (type.name == 'Item Matching') {
                                        type.sequence = 8;
                                    }
                                    else if (type.name == 'Contrasting') {
                                        type.sequence = 9;
                                    }
                                    else if (type.name == 'Free Contrasting') {
                                        type.sequence = 10;
                                    }
                                    else if (type.name == 'Sentence / Phrase Builder') {
                                        type.sequence = 11;
                                    }
                                    else if (type.name == 'Sequencing') {
                                        type.sequence = 12;
                                    }
                                    else if (type.name == 'Grouping') {
                                        type.sequence = 13;
                                    }
                                    type.save().then(function(){
                                        callback();
                                    }).catch(callback)
                                },
                                function (err){
                                    if(err) return services.helpers.handleReject(err, callback);
                                    callback();
                                });
                            });
                    }
                ],
                function (err) {
                    if (err) return services.helpers.handleReject(err, reject);
                    resolve();
                });
        });
    }
};



