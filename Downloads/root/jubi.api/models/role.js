module.exports = function (sequelize, DataTypes) {
    return sequelize.define('Role', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING(50),
            allowNull: false
        }
    }, {
        timestamps: false,
        indexes: [
            {fields:['name']}
        ],
        classMethods: {
            associate: function(models) {
                models[this.name].belongsToMany(models.User, { through:models.UserRole, foreignKey:'roleId', as:'users' });
            }
        }
    });
};