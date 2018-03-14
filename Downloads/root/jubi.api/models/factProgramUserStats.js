module.exports = function(sequelize, DataTypes) {
    return sequelize.define('FactProgramUserStats', {
        levelsCompletedCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        levelsCompletedPoints: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        questsCompletedCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        questsCompletedPoints: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        challengesCompletedCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        challengesCompletedPoints: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        challenges1stAttemptCorrectCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        todosCompletedCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        todosCompletedPoints: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        totalBasePoints: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        badgesEarnedCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
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
