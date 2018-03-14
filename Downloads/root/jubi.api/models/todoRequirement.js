module.exports = function(sequelize, DataTypes) {
    return sequelize.define('TodoRequirement', {
        requirementRef: {
            type: DataTypes.STRING(30),
            allowNull: false
        },
        requirementRefId: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    }, {
        indexes: [

        ],
        classMethods: {
            associate: function(models) {
                models[this.name].belongsTo(models.Todo, { as: 'todo', onDelete:'CASCADE', onUpdate:'CASCADE' });
                models[this.name].hasMany(models.UserTodoRequirementsFulfillment, { as: 'userFulfillments', foreignKey: 'todoRequirementId' });
            }
        }
    });
};