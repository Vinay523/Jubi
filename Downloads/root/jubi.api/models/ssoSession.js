module.exports = function(sequelize, DataTypes) {
    return sequelize.define('ssoSession', {
        sessionId: {
            type:       DataTypes.STRING(100),
            allowNull:  false
        }
    }, {
        timestamps: false,
        indexes: [
            { fields: ['sessionId'] }
        ],
        classMethods: {
            associate: function(models) {
                models[this.name].belongsTo(models.User, { as: 'user', onDelete:'CASCADE', onUpdate:'CASCADE' });
                models[this.name].belongsTo(models.ssoProvider, { as: 'provider', onDelete:'CASCADE', onUpdate:'CASCADE' });
            }
        }
    });
};