module.exports = function(sequelize, DataTypes) {
    return sequelize.define('UserBadgeRequirementsFulfillment', {
        fulfilled: {
            type:       DataTypes.BOOLEAN,
            allowNull:  false
        }
    }, {
        indexes: [

        ],
        classMethods: {
            associate: function(models) {
                models[this.name].belongsTo(models.UserBadge, { as: 'userBadge', onDelete:'CASCADE', onUpdate:'CASCADE' });
                models[this.name].belongsTo(models.BadgeRequirement, { as: 'badgeRequirement', onDelete:'CASCADE', onUpdate:'CASCADE' });
            }
        }
    });
};