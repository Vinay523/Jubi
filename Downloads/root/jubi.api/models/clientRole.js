module.exports = function(sequelize, DataTypes) {
    return sequelize.define('ClientRole', {
        name: {
            type: DataTypes.STRING(100),
            allowNull: false
        }
    }, {
        indexes: [
            { fields: ['name'] }
        ],
        classMethods: {
            associate: function(models) {
                models[this.name].belongsToMany(models.Client, {through: models.ClientClientRole, foreignKey:'roleId', as:'clients'});
            }
        }
    });
};