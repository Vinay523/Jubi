module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Forum', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        linkId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        name: DataTypes.STRING(150),
        newTopicPoints: DataTypes.INTEGER,
        newCommentPoints: DataTypes.INTEGER,
        likePoints: DataTypes.INTEGER,
        topicCommentPoints: DataTypes.INTEGER,
        itemLikePoints: DataTypes.INTEGER,

        newTopicPointsMax: DataTypes.INTEGER,
        newCommentPointsMax: DataTypes.INTEGER,
        likePointsMax: DataTypes.INTEGER,
        topicCommentPointsMax: DataTypes.INTEGER,
        itemLikePointsMax: DataTypes.INTEGER,

        newEncouragePoints: DataTypes.INTEGER,
        newAppreciatePoints: DataTypes.INTEGER,
        newStoryPoints: DataTypes.INTEGER,
        newEncouragePointsMax: DataTypes.INTEGER,
        newAppreciatePointsMax: DataTypes.INTEGER,
        newStoryPointsMax: DataTypes.INTEGER

    }, {
        indexes: [
            { fields: ['name'] },
            { fields: ['linkId'] },
            { fields: ['createdAt'] },
            { fields: ['updatedAt'] }
        ],
        classMethods: {
            associate: function(models) {
                models[this.name].hasMany(models.ForumItemCategory, { as:'categories', foreignKey: 'forumId' });
                models[this.name].hasMany(models.ForumItem, { as:'items', foreignKey: 'forumId' });
            }
        }
    });
};