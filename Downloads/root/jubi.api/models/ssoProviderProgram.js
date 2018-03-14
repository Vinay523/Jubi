module.exports = function(sequelize, DataTypes) {
    return sequelize.define('ssoProviderProgram', {
        providerProgramId: DataTypes.STRING(24),
        linkId: DataTypes.STRING(24)
    }, {
        timestamps: false,
        indexes: [

        ],
        classMethods: {
            associate: function(models) {
                models[this.name].belongsTo(models.ssoProvider, { as: 'provider', onDelete:'CASCADE', onUpdate:'CASCADE' });
            }
        }
    });
};