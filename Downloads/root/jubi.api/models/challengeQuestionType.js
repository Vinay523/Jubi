module.exports = function(sequelize, DataTypes) {
    return sequelize.define('ChallengeQuestionType', {
        status: {
            type: DataTypes.ENUM('active', 'na'),
            defaultValue: 'active'
        },
        name: DataTypes.STRING(50),
        sequence:DataTypes.INTEGER
    }, {
        timestamps: false,
        indexes: [
            { fields: ['status'] },
            { fields: ['name'] },
            { fields: ['sequence'] }
        ],
        classMethods: {
            associate: function(models) {
                models[this.name].hasMany(models.ChallengeQuestion, { as: 'questions', foreignKey:'typeId' });
            }
        }
    });
};