module.exports = function (sequelize, DataTypes) {
    return sequelize.define('User', {
        firstName: DataTypes.STRING(50),
        lastName: DataTypes.STRING(50),
        title: DataTypes.STRING(50),
        email: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: {isEmail: true}
        },
        pendingEmail: {
            type: DataTypes.STRING(100),
            validate: {isEmail: true}
        },
        password: DataTypes.STRING(100),
        avatarUrl: {
            type: DataTypes.STRING,
            allowNull: true
        },
        tzOffset: DataTypes.INTEGER,
        tempToken: DataTypes.STRING(50),
        securityCode: DataTypes.STRING(50),
        securityCodeCreatedAt: DataTypes.DATE,
        accessToken: DataTypes.STRING(50),
        accessTokenCreatedAt:  DataTypes.DATE,
        why: DataTypes.STRING(150),
        destination: DataTypes.STRING(150)
    }, {
        paranoid: true,
        indexes: [
            {fields: ['firstName']},
            {fields: ['lastName']},
            {fields: ['firstName', 'lastName']},
            {fields: ['title']},
            {fields: ['email']},
            {fields: ['createdAt']},
            {fields: ['updatedAt']},
            {fields: ['deletedAt']}
        ],
        classMethods: {
            associate: function (models) {
                models[this.name].belongsToMany(models.Client, {
                    through: models.ClientUser,
                    foreignKey: 'userId',
                    as: 'clients'
                });
                models[this.name].belongsToMany(models.Role, {
                    through: models.UserRole,
                    foreignKey: 'userId',
                    as: 'roles'
                });
                models[this.name].hasMany(models.Program, {as: 'programs', foreignKey: 'createdById'});
                models[this.name].hasMany(models.ChallengeResult, {as: 'challengeResults', foreignKey: 'userId'});
                models[this.name].hasMany(models.UserBadge, {as: 'badges', foreignKey: 'userId'});
                models[this.name].hasMany(models.UserTodo, {as: 'todos', foreignKey: 'userId'});
                models[this.name].hasMany(models.ProgramUser, {as: 'programUsers', foreignKey: 'userId'});

                models[this.name].hasMany(models.ForumItem, {as: 'forumItems', foreignKey: 'createdById'});
                models[this.name].hasMany(models.ForumItem, {as: 'forumItemsAgainst', foreignKey: 'createdAgainstId'});
                models[this.name].hasMany(models.ForumItemLike, {as: 'forumLikes', foreignKey: 'createdById'});
                models[this.name].hasMany(models.ForumItemDislike, {as: 'forumDislikes', foreignKey: 'createdById'});
                models[this.name].hasMany(models.ForumItemLike, {as: 'forumLikesAgainst', foreignKey: 'createdAgainstId'});
                models[this.name].hasMany(models.ForumItemDislike, {as: 'forumDislikesAgainst', foreignKey: 'createdAgainstId'});

                models[this.name].hasMany(models.FactProgramUserCompletedItems, {as: 'factProgramUserCompletedItems', foreignKey: 'userId'});
                models[this.name].hasMany(models.FactProgramUserCompletedItemsIntraday, {as: 'factProgramUserCompletedItemsIntraday', foreignKey: 'userId'});
                models[this.name].hasMany(models.FactProgramUserStats, {as: 'factProgramUserStats', foreignKey: 'userId'});
                models[this.name].hasMany(models.FactProgramUserStatsIntraday, {as: 'factProgramUserStatsIntraday', foreignKey: 'userId'});
            }
        }
    });
};