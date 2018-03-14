module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Quest', {
        title: {
            type:           DataTypes.STRING(100),
            allowNull:      false
        },
        objective:          DataTypes.STRING(1024),
        backgroundImageRef: DataTypes.STRING(200),
        featuredImageRef:   DataTypes.STRING(200),
        sequence:           DataTypes.INTEGER,
        publishedAt:        DataTypes.DATE,
        slug: DataTypes.STRING(255),
        type: DataTypes.STRING(1),
        baseOrBonus: DataTypes.STRING(1),
        inspireAvailableToUser: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        storyAvailableToUser : {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        encourageAvailableToUser : {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        userAllowedMediaUpload : {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        inspirePoints: DataTypes.INTEGER,
    }, {
        indexes: [
            { fields: ['title'] },
            { fields: ['sequence'] },
            { fields: ['programId'] },
            { fields: ['createdAt'] }
        ],
        classMethods: {
            associate: function(models) {
                models[this.name].belongsTo(models.Program, { as: 'program', onDelete:'CASCADE', onUpdate:'CASCADE' });
                models[this.name].belongsTo(models.Level, { as: 'level', onDelete:'CASCADE', onUpdate:'CASCADE' });
                models[this.name].hasMany(models.Challenge, { as: 'challenges', foreignKey: 'questId' });
                models[this.name].hasMany(models.ForumItem, { as: 'forumItems', foreignKey: 'questId' });
                models[this.name].hasMany(models.Todo, { as: 'todos', foreignKey: 'questId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
            }
        }
    });
};