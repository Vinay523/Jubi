module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Encoding', {
        status: {
            type: DataTypes.ENUM('pending', 'encoding', 'ready', 'error'),
            defaultValue: 'pending'
        },
        ref: DataTypes.STRING(50),
        type: DataTypes.STRING(20),
        error: DataTypes.STRING(1000)
    }, {
        indexes: [
            { fields: ['status'] },
            { fields: ['ref'] },
            { fields: ['type'] }
        ],
        classMethods: {
            associate: function(models) { }
        }
    });
};