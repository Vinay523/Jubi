module.exports = function(sequelize, DataTypes) {
    return sequelize.define('ChallengeResult', {
        points: DataTypes.INTEGER
    }, {
        indexes: [
            { fields: ['points'] },
            { fields: ['challengeId'] },
            { fields: ['userId'] },
            { fields: ['createdAt'] },
            { fields: ['updatedAt'] },
            { fields: ['userTodoId'] }
        ],
        classMethods: {
            associate: function(models) {
                models[this.name].belongsTo(models.Challenge, {foreignKey:'challengeId', as:'challenge', onDelete: 'CASCADE', onUpdate: 'CASCADE'});
                models[this.name].belongsTo(models.User, {foreignKey:'userId', as:'user', onDelete: 'CASCADE', onUpdate: 'CASCADE'});
                models[this.name].belongsTo(models.UserTodo, { as:'userTodo', onDelete: 'CASCADE', onUpdate: 'CASCADE'});
                models[this.name].hasMany(models.ChallengeResultItem, {foreignKey:'resultId', as:'items'});
            }
        }
    });
};