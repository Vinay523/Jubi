var fs = require('fs');
var path = require('path');
var Sequelize = require('sequelize');

var _sequelize = null;

if (!_sequelize) {
    _sequelize = new Sequelize(
        config.database.database,
        config.database.username,
        config.database.password, {
            host: config.database.host,
            port: config.database.port,
            pool: {
                max: 20,
                min: 5,
                idle: 1000000
            },
            logging: function (str) {
                console.log(str);
                //if (logger.isTraceEnabled()) logger.trace(str);
            }
        }
    );
}

var models = {
    sequelize: _sequelize
};

fs.readdirSync(__dirname)
    .filter(function(file) {
        return (file.indexOf('.') !== 0) &&
            (file !== 'index.js') &&
            (file !== 'scripts') &&
            (file !== 'data') &&
            (file !== 'helpers') &&
            (file !== 'migrations');
    })
    .forEach(function(file) {
        //logger.debug('Sequelize import %s', file);
        var model = _sequelize.import(path.join(__dirname, file));
        models[model.name] = model;
    });

Object.keys(models).forEach(function(modelName) {
    if ('associate' in models[modelName]) {
        //logger.debug('Sequelize associate %s', modelName);
        models[modelName].associate(models);
    }
});

module.exports = models;

/** @namespace models.Badge */
/** @namespace models.Challenge */
/** @namespace models.ChallengeMedia */
/** @namespace models.UserChallengeMedia */
/** @namespace models.ChallengeQuestion */
/** @namespace models.ChallengeQuestionType */
/** @namespace models.ChallengeAnswer */
/** @namespace models.ChallengeHint */
/** @namespace models.ChallengeResult */
/** @namespace models.ChallengeResultItem */
/** @namespace models.Client */
/** @namespace models.ClientUser */
/** @namespace models.ClientClientRole */
/** @namespace models.ClientRole */
/** @namespace models.ClientProgram */
/** @namespace models.Communication */
/** @namespace models.Email */
/** @namespace models.Encoding */
/** @namespace models.SystemConfiguration */

/** @namespace models.Forum */
/** @namespace models.ForumItem */
/** @namespace models.ForumItemCategory */
/** @namespace models.ForumItemLike */
/** @namespace models.ForumItemDislike */
/** @namespace models.ForumItemUser */
/** @namespace models.ForumItemMedia */
/** @namespace models.BonusPoints */
/** @namespace models.ProgramUserGroup */
/** @namespace models.ProgramUserGroupUser */




/** @namespace models.History */
/** @namespace models.Level */
/** @namespace models.SequencingType */
/** @namespace models.Lookup */
/** @namespace models.Program */
/** @namespace models.Quest */
/** @namespace models.ProgramUser */
/** @namespace models.ProgramLicense */
/** @namespace models.Require */
/** @namespace models.ResetUser */
/** @namespace models.Role */
/** @namespace models.User */
/** @namespace models.UserRole */
/** @namespace models.Todo */
/** @namespace models.BadgeRequirement */
/** @namespace models.UserBadgeRequirementsFulfillment */
/** @namespace models.TodoRequirement */
/** @namespace models.UserTodoRequirementsFulfillment */
/** @namespace models.UserTodo */
/** @namespace models.UserBadge */
/** @namespace models.ProgramUserAssociation */
/** @namespace models.ProgramUserAssociationType */

/** @namespace models.FactProgramUserCompletedItems */
/** @namespace models.FactProgramUserCompletedItemsIntraday */
/** @namespace models.FactProgramUserStats */
/** @namespace models.FactProgramUserStatsIntraday */

/** @namespace models.ssoProvider */
/** @namespace models.ssoProviderProgram */
/** @namespace models.ssoSession */