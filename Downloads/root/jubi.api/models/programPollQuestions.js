module.exports = function(sequelize, DataTypes) {
    return sequelize.define('ProgramPollQuestions', {
        levelSequence: DataTypes.INTEGER,
        challengeId: DataTypes.INTEGER,
        challengeSequence: DataTypes.INTEGER,
        challengeTitle: DataTypes.STRING,
        questOrTodo: DataTypes.STRING,
        questId: DataTypes.INTEGER,
        questSequence: DataTypes.INTEGER,
        questTitle: DataTypes.STRING,
        todoId: DataTypes.INTEGER,
        todoTitle: DataTypes.STRING,
        questionId: DataTypes.INTEGER,
        questionSequence: DataTypes.INTEGER,
        questionTitle: DataTypes.STRING
    });
};