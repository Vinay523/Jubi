module.exports = function(sequelize, DataTypes) {
    return sequelize.define('UserBadge', {
        earned:    DataTypes.BOOLEAN,
        awarded: DataTypes.BOOLEAN
    }, {
        indexes: [

        ],
        classMethods: {
            associate: function(models) {
                models[this.name].hasMany(models.UserBadgeRequirementsFulfillment, { as: 'requirements', foreignKey: 'userBadgeId' });
                models[this.name].belongsTo(models.Badge, { as: 'badge', onDelete:'CASCADE', onUpdate:'CASCADE' });
                models[this.name].belongsTo(models.User, { as: 'user', onDelete:'CASCADE', onUpdate:'CASCADE' });
            }
        }
    });
};