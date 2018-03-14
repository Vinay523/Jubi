module.exports = function(sequelize, DataTypes) {
    return sequelize.define('ProgramUserStatsSummary', {
        date: DataTypes.DATE,
        dateDisplay: DataTypes.STRING,
        week: DataTypes.INTEGER,
        weekDisplay: DataTypes.STRING,
        month: DataTypes.INTEGER,
        monthName: DataTypes.STRING,
        monthYear: DataTypes.STRING,
        monthDisplay: DataTypes.STRING,
        mmyyyy: DataTypes.STRING,
        quarter: DataTypes.INTEGER,
        quarterName: DataTypes.STRING,
        quarterDisplay: DataTypes.STRING,
        year: DataTypes.INTEGER,
        yearName: DataTypes.STRING,
        yearDisplay: DataTypes.STRING,
        userId: DataTypes.INTEGER,
        userFullName: DataTypes.STRING,
        sumLevelsCompletedCount: DataTypes.INTEGER,
        sumQuestsCompletedCount: DataTypes.INTEGER,
        sumChallengesCompletedCount: DataTypes.INTEGER,
        sumChallengesCompletedPoints: DataTypes.INTEGER,
        sumTodosCompletedCount: DataTypes.INTEGER,
        sumTodosCompletedPoints: DataTypes.INTEGER,
        sumTotalBasePoints: DataTypes.INTEGER,
        sumBadgesEarnedCount: DataTypes.INTEGER
    });
};


