module.exports = function(sequelize, DataTypes) {
    return sequelize.define('ChallengeAnswer', {
        answer: DataTypes.STRING(5000),
        correct: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        sequence: DataTypes.INTEGER
    }, {
        indexes: [
            { fields: ['sequence'] },
            { fields: ['correct'] },
            { fields: ['questionId'] },
            { fields: ['createdAt'] }
        ],
        classMethods: {
            associate: function(models) {
                models[this.name].belongsTo(models.ChallengeQuestion, { as: 'question', onDelete:'CASCADE', onUpdate:'CASCADE' });
                models[this.name].hasMany(models.ChallengeResultItem, { as: 'resultItems', foreignKey:'answerId' });
            }
        }
    });
};