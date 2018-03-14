module.exports = function(sequelize, DataTypes) {
    return sequelize.define('ForumItemCategory', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: DataTypes.STRING(150),
        description: DataTypes.STRING(1000)
    }, {
        indexes: [
            { fields: ['name'] },
            { fields: ['createdAt'] },
            { fields: ['updatedAt'] },
            { fields: ['forumId'] }
        ],
        classMethods: {
            associate: function(models) {
                models[this.name].belongsTo(models.Forum, { as:'forum', onDelete: 'CASCADE' });
                models[this.name].hasMany(models.ForumItem, { as:'items', foreignKey: 'categoryId' });
            }
        }
    });
};