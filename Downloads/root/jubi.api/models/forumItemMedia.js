module.exports = function(sequelize, DataTypes) {
    return sequelize.define('ForumItemMedia', {
        type: {
            type: DataTypes.ENUM('text', 'link', 'image', 'video', 'audio', 'resource'),
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('ready', 'encoding'),
            defaultValue: 'ready'
        },
        source: DataTypes.STRING(50),
        ref: DataTypes.STRING(50),
        data: DataTypes.TEXT,
        name: DataTypes.STRING(500),
        description: DataTypes.STRING(5000),
        coverUrl: DataTypes.STRING(200),
        sourceDate: DataTypes.DATE,
        sequence: DataTypes.INTEGER
    }, {
        indexes: [
            { fields: ['type'] },
            { fields: ['status'] },
            { fields: ['source'] },
            { fields: ['ref'] },
            { fields: ['sequence'] },
            { fields: ['forumItemId'] },
            { fields: ['userId'] },
            { fields: ['createdAt'] }
        ],
        classMethods: {
            associate: function(models) {
                models[this.name].belongsTo(models.ForumItem, { as: 'forumItem', onDelete:'CASCADE', onUpdate:'CASCADE' });
                models[this.name].belongsTo(models.User, {foreignKey:'userId', as:'user', onDelete: 'CASCADE', onUpdate: 'CASCADE'});
            }
        }
    });
};