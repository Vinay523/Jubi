var app = require('../../../app');
var models = require('../../index')(app);
var services = require('../../../services/index');

var async = require('async');
var Q = require('q');

module.exports = {
    up: function (migration, DataTypes) {
        return Q.Promise(function (resolve, reject) {
            migration.sequelize.models.Forum.findAll().then(function (forums) {
                async.eachSeries(forums,
                    /* Table DimDates */
                    function (forum, callback) {
                        Q.all([
                            models.ForumItemCategory.create({
                                name: 'Encouragement',
                                forumId: forum.id
                            }),
                            models.ForumItemCategory.create({
                                name: 'Appreciation',
                                forumId: forum.id
                            }),
                            models.ForumItemCategory.create({
                                name: 'Stories',
                                forumId: forum.id
                            }),
                            models.ForumItemCategory.create({
                                name: 'Narratives',
                                forumId: forum.id
                            })
                        ]).then(function () {
                            callback();
                        })
                    },
                    function (err) {
                        if (err) return services.helpers.handleReject(err, reject);
                        resolve();
                    });
            });
        });
    },
    down: function (migration) {
        return Q.Promise(function (resolve, reject) {

        });
    }
};