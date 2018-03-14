module.exports = function(sequelize, DataTypes) {
    return sequelize.define('BadgeRequirement', {
        requirementRef: {
            type: DataTypes.STRING(30),
            allowNull: false
        },
        requirementRefId: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    }, {
        indexes: [
        ],
        classMethods: {
            associate: function(models) {
                models[this.name].belongsTo(models.Badge, { as: 'badge', onDelete:'CASCADE', onUpdate:'CASCADE' });
            }
        }
    });
};