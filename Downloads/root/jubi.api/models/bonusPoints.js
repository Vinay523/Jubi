module.exports = function(sequelize, DataTypes) {
    return sequelize.define('BonusPoints', {
        points: DataTypes.INTEGER
    }, {
        indexes: [
            { fields: ['userTodoId'] },
            { fields: ['forumItemId'] },
            { fields: ['userId'] }
        ],
        classMethods: {
            associate: function(models) {
                models[this.name].belongsTo(models.UserTodo, { as: 'userTodo', onDelete:'CASCADE', onUpdate:'CASCADE' });
                models[this.name].belongsTo(models.ForumItem, { as: 'forumItem', onDelete:'CASCADE', onUpdate:'CASCADE' });
                models[this.name].belongsTo(models.User, { as: 'user', onDelete:'CASCADE', onUpdate:'CASCADE' });
            }
        }
    });
};