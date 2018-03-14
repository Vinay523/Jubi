module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Client', {
        name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        slug: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        seats: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        trialClientSeats: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        maxLicenseSeats: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        trialLicenseSeats: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        allowCreateClient: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        headerColor: {
            type: DataTypes.STRING(20)
        },
        headerFontColor: {
            type: DataTypes.STRING(20)
        },
        backgroundColor: {
            type: DataTypes.STRING(20)
        },
        backgroundFontColor: {
            type: DataTypes.STRING(20)
        },
        logoImageUrl: {
            type: DataTypes.STRING(200)
        },
        loginImageUrl: {
            type: DataTypes.STRING(200)
        },
        buddyLabel: {
            type: DataTypes.STRING(100)
        },
        badgeLabel: {
            type: DataTypes.STRING(100)
        },
        logoAlignment: {
            type: DataTypes.ENUM('left', 'center', 'right'),
        }
    }, {
        paranoid: true,
        indexes: [
            { fields: ['name'] },
            { fields: ['slug'] }
        ],
        classMethods: {
            associate: function(models) {
                models[this.name].belongsToMany(models.User, {through: models.ClientUser, foreignKey:'clientId', as:'users'});
                models[this.name].belongsToMany(models.ClientRole, {through: models.ClientClientRole, foreignKey:'clientId', as:'roles'});
                models[this.name].hasMany(models.Program, {foreignKey:'clientId', as:'programs'});

                models[this.name].hasMany(models.Client, {foreignKey:'parentId', as:'children'});
                models[this.name].belongsTo(models.Client, { as: 'parent', onDelete:'CASCADE', onUpdate:'CASCADE' });
            }
        }
    });
};