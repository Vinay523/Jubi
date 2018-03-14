module.exports = function(sequelize, DataTypes) {
    return sequelize.define('SystemConfiguration', {
        key: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        value: {
            type: DataTypes.STRING(5000),
            allowNull: false
        }
    }, {
        indexes: [
            { fields: ['key'] }
        ],
        classMethods: {
        }
    });
};

