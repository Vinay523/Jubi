module.exports = function(sequelize) {
    return sequelize.define('ClientUser', {}, {
        timestamps: false,
        indexes: [
            { fields: ['clientId'] },
            { fields: ['userId'] }
        ]
    });
};