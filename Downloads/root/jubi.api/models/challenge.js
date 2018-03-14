module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Challenge', {
        type: {
            type: DataTypes.ENUM('general', 'finish'),
            allowNull: false
        },
        title: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        instructions: DataTypes.STRING(5000),
        finishText: DataTypes.STRING(1000),
        finishUploadText: DataTypes.STRING(1000),
        finishDownloadText: DataTypes.STRING(1000),
        finishLinkText: DataTypes.STRING(1000),
        notes: DataTypes.STRING(5000),

        canUploadContent: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },

        sequence: DataTypes.INTEGER,
        points: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        slug: DataTypes.STRING(255),
        publishedAt: DataTypes.DATE
    }, {
        indexes: [
            { fields: ['title'] },
            { fields: ['type'] },
            { fields: ['sequence'] },
            { fields: ['questId'] },
            { fields: ['points'] },
            { fields: ['todoId'] }
        ],
        classMethods: {
            associate: function(models) {
                models[this.name].belongsTo(models.Quest, { as: 'quest', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
                models[this.name].belongsTo(models.Todo, { as: 'todo', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
                models[this.name].hasMany(models.ChallengeMedia, { as: 'media', foreignKey:'challengeId' });
                models[this.name].hasMany(models.UserChallengeMedia, { as: 'userMedia', foreignKey:'challengeId' });
                models[this.name].hasMany(models.ChallengeQuestion, { as: 'questions', foreignKey:'challengeId' });
                models[this.name].hasMany(models.ChallengeResult, { as: 'results', foreignKey: 'challengeId' });
               
            }
        }
    });
};