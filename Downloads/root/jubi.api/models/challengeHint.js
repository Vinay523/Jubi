module.exports = function (sequelize, DataTypes) {
    return sequelize.define('ChallengeHint', {
        hint: DataTypes.STRING(1000),
        sequence: DataTypes.INTEGER,
        points: DataTypes.INTEGER
    }, {
        indexes: [
            { fields: ['sequence'] },
            { fields: ['questionId'] }
        ],
        classMethods: {
            associate: function(models) {
                models[this.name].belongsTo(models.ChallengeQuestion, { as: 'question', onDelete:'CASCADE', onUpdate:'CASCADE' });
            }
        }
    });
};