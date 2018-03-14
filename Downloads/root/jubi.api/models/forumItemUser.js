module.exports = function(sequelize, DataTypes) {
    return sequelize.define('ForumItemUser', {

    }, {
        indexes: [
            { fields: ['forumItemId'] },
            { fields: ['userId'] },
            { fields: ['createdAt'] },
            { fields: ['updatedAt'] }
        ],
        classMethods: {
            associate: function(models) {
                models[this.name].belongsTo(models.ForumItem, { as:'forumItem', onDelete:'CASCADE' });
                models[this.name].belongsTo(models.User, { as:'user', onDelete:'CASCADE' });
            }
        }
    });
};