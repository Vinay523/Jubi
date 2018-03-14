var models = require('../../models');
var controllerBase = require('./controllerBase');
var services = require('../../services/index');
var Q = require('q');
var _ = require('underscore');
var util = require('util');


function BadgeController(model) {
    controllerBase.call(this, model);
}

util.inherits(BadgeController, controllerBase);

var controller = new BadgeController(models.Badge);

BadgeController.prototype.awardBadges = function (req, res) {
    controller._awardBadges(req.user)
        .then(function (program) {
            res.sendSuccess(program);
        })
        .catch(function (err) {
            res.sendError(err);
        });
};

BadgeController.prototype._awardBadges = function (user) {
    return Q.Promise(function (resolve, reject) {
        // Get user earned badges
        models.UserBadge.findAll({
            where: {
                userId: user.id,
                earned: true,
                awarded: {
                    $ne: true
                }
            },
            include: [
                {
                    model: models.Badge,
                    as: 'badge'
                }
            ]
        }).then(function (userBadges) {
            _.each(userBadges, function (userBadge) {
                userBadge.awarded = true;
                userBadge.save();

                userBadge.badge.imageUrl = services.helpers.makeMediaUrl(userBadge.badge.imageUrl);
            });

            resolve(userBadges);
        })
    });
};

BadgeController.prototype.getUserBadges = function (req, res) {
    controller._getUserBadges(req.user)
        .then(function (program) {
            res.sendSuccess(program);
        })
        .catch(function (err) {
            res.sendError(err);
        });
};

BadgeController.prototype._getUserBadges = function (user) {
    return Q.Promise(function (resolve, reject) {
        models.UserBadge.findAll({
            where: {
                userId: user.id,
                earned: true
            },
            include: [
                {
                    model: models.Badge,
                    as: 'badge'
                }
            ]
        }).then(function (userBadges) {
            _.each(userBadges, function (userBadge) {
                userBadge.badge.imageUrl = services.helpers.makeMediaUrl(userBadge.badge.imageUrl);
            });

            resolve(userBadges);
        })
    });
};

BadgeController.prototype.getQuestBadge = function (req, res) {
    controller._getQuestBadge(req.body.questId, req.user.id, req.query.preview ? true : false)
        .then(function (badge) {
            res.sendSuccess(badge);
        })
        .catch(function (err) {
            res.sendError(err);
        });
};

BadgeController.prototype._getQuestBadge = function (questId, userId, preview) {
    return Q.Promise(function (resolve, reject) {

            var finishGetQuestBadge = function (badges) {
                var badge = null;
                //Get the badge that has only a single requirement, which would be this quest
                //There should only be one badge like this since requirements are enfornced unique
                if (badges.length > 0) {
                    badge = _.find(badges, function (badge) {
                        return badge.requirements.length == 1;
                    });

                    badge.imageUrl = services.helpers.makeMediaUrl(badge.imageUrl);
                }

                resolve(badge);
            };

            models.Badge.findAll({
                include: [
                    {
                        model: models.BadgeRequirement,
                        as: 'requirements',
                        where: {
                            requirementRef: 'Quest',
                            requirementRefId: questId
                        },
                        required: true
                    },
                    {
                        model: models.UserBadge,
                        as: 'userBadges',
                        where: {
                            userId: userId,
                            earned: true
                        },
                        required: true
                    }
                ]
            })
                .then(finishGetQuestBadge)
                .error(function (err) {
                    services.helpers.handleReject(err, reject);
                });

        });
};

module.exports = controller;