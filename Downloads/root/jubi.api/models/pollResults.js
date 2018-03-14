module.exports = function(sequelize, DataTypes) {
    return sequelize.define('PollResults', {
        answerId: DataTypes.INTEGER,
        answer: DataTypes.STRING,
        resultCount: DataTypes.INTEGER
    });
};