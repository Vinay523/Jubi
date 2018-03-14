module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Badge', {
        title: {
            type:       DataTypes.STRING(100),
            allowNull:  false
        },
        description:    DataTypes.STRING(1024),
        imageUrl: {
            type:       DataTypes.STRING
        },
        slug: DataTypes.STRING(255),
        publishedAt: DataTypes.DATE
    }, {
        indexes: [
            { fields: ['title'] },
            { fields: ['programId'] }
        ],
        classMethods: {
            associate: function(models) {
                models[this.name].hasMany(models.BadgeRequirement, { as: 'requirements', foreignKey: 'badgeId' });
                models[this.name].hasMany(models.UserBadge, { as: 'userBadges', foreignKey: 'badgeId' });
                models[this.name].belongsTo(models.Program, { as: 'program', onDelete:'CASCADE', onUpdate:'CASCADE' });
            }
        }
    });
};