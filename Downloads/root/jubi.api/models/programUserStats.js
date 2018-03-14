module.exports = function(sequelize, DataTypes) {
    return sequelize.define('ProgramUserStats', {
        date: DataTypes.DATE,
        week: DataTypes.INTEGER,
        month: DataTypes.INTEGER,
        monthName: DataTypes.STRING,
        dimDateId: DataTypes.INTEGER,
        programLinkId: DataTypes.INTEGER,
        userId: DataTypes.INTEGER,
        userFirstName: DataTypes.STRING,
        userLastName: DataTypes.STRING,
        userFullName: DataTypes.STRING,
        levelsCompletedCount: DataTypes.INTEGER,
        levelsCompletedPoints: DataTypes.INTEGER,
        questsCompletedCount: DataTypes.INTEGER,
        questsCompletedPoints: DataTypes.INTEGER,
        challengesCompletedCount: DataTypes.INTEGER,
        challengesCompletedPoints: DataTypes.INTEGER,
        challenges1stAttemptCorrectCount: DataTypes.INTEGER,
        todosCompletedCount: DataTypes.INTEGER,
        todosCompletedPoints: DataTypes.INTEGER,
        totalBasePoints: DataTypes.INTEGER,
        badgesEarnedCount: DataTypes.INTEGER
    });
};
