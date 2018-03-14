module.exports = function(sequelize, DataTypes) {
    return sequelize.define('UserTodoRequirementsFulfillment', {
        fulfilled: {
            type:       DataTypes.BOOLEAN,
            allowNull:  false
        }
    }, {
        indexes: [

        ],
        classMethods: {
            associate: function(models) {
                models[this.name].belongsTo(models.UserTodo, { as: 'userTodo', onDelete:'CASCADE', onUpdate:'CASCADE' });
                models[this.name].belongsTo(models.TodoRequirement, { as: 'todoRequirement', onDelete:'CASCADE', onUpdate:'CASCADE' });
            }
        }
    });
};