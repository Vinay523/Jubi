module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Communication', {
        status: {
            type: DataTypes.ENUM('ok', 'error'),
            defaultValue: 'ok'
        },
        ref: DataTypes.STRING(50),
        refId: DataTypes.INTEGER
    }, {
        indexes: [
            { fields: ['status'] },
            { fields: ['ref'] },
            { fields: ['refId'] },
            { fields: ['createdAt'] },
            { fields: ['updatedAt'] }
        ]
    });
};