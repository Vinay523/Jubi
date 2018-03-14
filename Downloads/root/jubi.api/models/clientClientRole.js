module.exports = function(sequelize, DataTypes) {
    return sequelize.define('ClientClientRole', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        }
    }, {
        timestamps: false,
        indexes: [
            { fields: ['clientId', 'roleId'], unique: true }
        ],
        classMethods: {
            associate: function(models) {
                models[this.name].belongsTo(models.Client, {as:'client', onDelete:'CASCADE'});
                models[this.name].belongsTo(models.ClientRole, {as:'role', onDelete:'CASCADE'});
            }
        }
    });
};