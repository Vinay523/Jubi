module.exports = function(sequelize, DataTypes) {
    return sequelize.define('ForumItem', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        type: {
            type: DataTypes.ENUM('topic', 'comment'),
            allowNull: false
        },
        subType: {
            type: DataTypes.ENUM('encouragement', 'appreciation', 'story')
        },
        title: DataTypes.STRING(5000),
        content: DataTypes.TEXT,
        contentLink: DataTypes.STRING(150),
        contentLinkType: DataTypes.ENUM('image', 'video', 'audio')
    }, {
        paranoid:true,
        indexes: [
            { fields: ['type'] },
            { fields: ['contentLinkType'] },
            { fields: ['parentId'] },
            { fields: ['forumId'] },
            { fields: ['questId'] },
            { fields: ['challengeId'] },
            { fields: ['categoryId'] },
            { fields: ['createdById'] },
            { fields: ['createdAgainstId'] },
            { fields: ['createdAt'] },
            { fields: ['updatedAt'] }
        ],
        classMethods: {
            associate: function(models) {
                models[this.name].belongsTo(models[this.name], { as:'parent', onDelete:'CASCADE' });
                models[this.name].hasMany(models[this.name], { as:'children', foreignKey:'parentId' });
                models[this.name].hasMany(models.ForumItemUser, { as:'users', foreignKey:'forumItemId' });

                models[this.name].belongsTo(models.Forum, { as:'forum', onDelete:'CASCADE' });
                models[this.name].belongsTo(models.ForumItemCategory, { as:'category', onDelete:'CASCADE' });
                models[this.name].belongsTo(models.Quest, { as:'quest', onDelete:'CASCADE' });
                models[this.name].belongsTo(models.Challenge, { as:'challenge', onDelete:'CASCADE' });
                models[this.name].belongsTo(models.User, { as:'createdBy', onDelete:'CASCADE' });
                models[this.name].belongsTo(models.User, { as:'createdAgainst' });

                models[this.name].hasMany(models.ForumItemLike, { as:'likes', foreignKey:'forumItemId' });
                models[this.name].hasMany(models.ForumItemDislike, { as:'dislikes', foreignKey:'forumItemId' });
                models[this.name].hasMany(models.ForumItemMedia, { as:'media', foreignKey:'forumItemId' });
                models[this.name].hasMany(models.BonusPoints, {foreignKey:'forumItemId', as:'bonusPoints'});
            }
        }
    });
};