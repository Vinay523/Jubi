module.exports = function(sequelize, DataTypes) {
    return sequelize.define('ProgramUserAssociationType', {
        type: DataTypes.STRING(150)
    }, {
        timestamps: false,
        indexes: [
            { fields: ['type'] }
        ],
        classMethods: {
            associate: function(models) {

            }
        }
    });
};