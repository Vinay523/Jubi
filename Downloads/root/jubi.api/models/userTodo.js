module.exports = function(sequelize, DataTypes) {
    return sequelize.define('UserTodo', {
        status: {
            type: DataTypes.ENUM('locked', 'unlocked', 'submitted', 'verified', 'completed'),
            defaultValue: 'locked'
        },
        hasBeenCompleted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false
        },
        dueDate: {
            type: DataTypes.DATE
        }
    }, {
        indexes: [

        ],
        classMethods: {
            associate: function(models) {
                models[this.name].hasMany(models.UserTodoRequirementsFulfillment, { as: 'requirements', foreignKey: 'userTodoId' });
                models[this.name].belongsTo(models.Todo, { as: 'todo', onDelete:'CASCADE', onUpdate:'CASCADE' });
                models[this.name].belongsTo(models.User, { as: 'user', onDelete:'CASCADE', onUpdate:'CASCADE' });
                models[this.name].hasMany(models.UserChallengeMedia, {foreignKey:'userTodoId', as:'userMedia'});
                models[this.name].hasMany(models.ChallengeResult, {foreignKey:'userTodoId', as:'results'});
                models[this.name].hasMany(models.BonusPoints, {foreignKey:'userTodoId', as:'bonusPoints'});
            }
        }
    });
};