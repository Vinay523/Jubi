module.exports = function(sequelize, DataTypes) {
    return sequelize.define('ForumItemLike', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        }
    }, {
        indexes: [
            { fields: ['forumItemId'] },
            { fields: ['createdById'] },
            { fields: ['createdAgainstId'] },
            { fields: ['createdAt'] },
            { fields: ['updatedAt'] }
        ],
        classMethods: {
            associate: function(models) {
                models[this.name].belongsTo(models.ForumItem, { as:'forumItem', onDelete:'CASCADE' });
                models[this.name].belongsTo(models.User, { as:'createdBy', onDelete:'CASCADE' });
                models[this.name].belongsTo(models.User, { as:'createdAgainst' });
            }
        }
    });
};