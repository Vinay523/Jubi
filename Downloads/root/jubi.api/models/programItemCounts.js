module.exports = function(sequelize, DataTypes) {
    return sequelize.define('ProgramItemCounts', {
        currentProgramId: DataTypes.INTEGER,
        levelsCount: DataTypes.INTEGER,
        questsCount: DataTypes.INTEGER,
        challengesCount: DataTypes.INTEGER,
        challengesPoints: DataTypes.INTEGER,
        todosCount: DataTypes.INTEGER,
        todosPoints: DataTypes.INTEGER,
        totalBasePoints: DataTypes.INTEGER,
        badgesCount: DataTypes.INTEGER
    });
};
