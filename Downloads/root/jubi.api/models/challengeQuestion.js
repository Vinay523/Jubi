module.exports = function(sequelize, DataTypes) {
    return sequelize.define('ChallengeQuestion', {
        question: DataTypes.STRING(5000),
        sequence: DataTypes.INTEGER
		 
    }, {
        indexes: [
            { fields: ['sequence'] },
            { fields: ['challengeId'] },
            { fields: ['typeId'] },
            { fields: ['createdAt'] }
        ],
        classMethods: {
            associate: function(models) {
                models[this.name].belongsTo(models.Challenge, { as: 'challenge', onDelete:'CASCADE', onUpdate:'CASCADE' });
                models[this.name].belongsTo(models.ChallengeQuestionType, { as: 'type', onDelete:'CASCADE', onUpdate:'CASCADE' });
                models[this.name].hasMany(models.ChallengeAnswer, { as: 'answers', foreignKey:'questionId' });
                models[this.name].hasMany(models.ChallengeResultItem, { as: 'resultItems', foreignKey: 'questionId' });
                models[this.name].hasMany(models.ChallengeHint, { as: 'hints', foreignKey: 'questionId' });
            }
        }
    });
};