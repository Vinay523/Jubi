module.exports = function(sequelize, DataTypes) {
    return sequelize.define('ChallengeResultItem', {
        data: DataTypes.TEXT
    }, {
        indexes: [
            { fields: ['resultId'] },
            { fields: ['questionId'] },
            { fields: ['answerId'] },
            { fields: ['createdAt'] },
            { fields: ['updatedAt'] }
        ],
        classMethods: {
            associate: function(models) {
                models[this.name].belongsTo(models.ChallengeResult, {foreignKey:'resultId', as:'result', onDelete: 'CASCADE', onUpdate: 'CASCADE'});
                models[this.name].belongsTo(models.ChallengeQuestion, {foreignKey:'questionId', as:'question', onDelete: 'CASCADE', onUpdate: 'CASCADE'});
                models[this.name].belongsTo(models.ChallengeAnswer, {foreignKey:'answerId', as:'answer', onDelete: 'CASCADE', onUpdate: 'CASCADE'});
            }
        }
    });
};