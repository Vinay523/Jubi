module.exports = function(sequelize, DataTypes) {
    return sequelize.define('FactProgramUserCompletedItems', {
        levelLastCompleted: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        questLastCompleted: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        challengeLastCompleted: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        todoLastCompleted: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        badgeLastEarned: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        programLinkId: DataTypes.INTEGER
    }, {
        classMethods: {
            associate: function (models) {
                models[this.name].belongsTo(models.User, {as: 'user'});
                models[this.name].belongsTo(models.DimDate, {as: 'dimDate'});
            }
        }
    });
};
