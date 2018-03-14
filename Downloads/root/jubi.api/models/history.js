module.exports = function(sequelize, DataTypes) {
    var History = sequelize.define('History', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        comment: DataTypes.TEXT,
        details: DataTypes.TEXT
    }, {
        indexes: [
            { fields: ['programId'], unique: true },
            { fields: ['userId'] },
            { fields: ['createdAt'] },
            { fields: ['updatedAt'] }
        ],
        classMethods: {
            associate: function(models) {
                History.belongsTo(models.User, { as: 'user' });
                History.belongsTo(models.Program, { as: 'program' });
            }
        }
    });
    return History;
};