module.exports = function(sequelize, DataTypes) {
    return sequelize.define('ssoProvider', {
        name: {
            type:       DataTypes.STRING(100),
            allowNull:  false
        },
        key:    DataTypes.STRING(24),
        scheme: DataTypes.ENUM('YM'),
        apiUrl: DataTypes.STRING(1024),
        apiKey: DataTypes.STRING(100),
        apiSecret: DataTypes.STRING(100),
        saPasscode: DataTypes.STRING(100)
    }, {
        timestamps: false,
        indexes: [

        ],
        classMethods: {
            associate: function(models) {
                models[this.name].belongsTo(models.Client, { as: 'client', onDelete:'CASCADE', onUpdate:'CASCADE' });
            }
        }
    });
};