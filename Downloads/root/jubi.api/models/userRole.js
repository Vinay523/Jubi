module.exports = function(sequelize) {
    return sequelize.define('UserRole', {}, {
        timestamps: false,
        indexes: [
            { fields: ['userId'] },
            { fields: ['roleId'] }
        ]
    });
};