module.exports = function(sequelize, DataTypes) {
    return sequelize.define('UserChallengeMedia', {
        type: {
            type: DataTypes.ENUM('text', 'link', 'image', 'video', 'audio', 'resource'),
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('ready', 'encoding'),
            defaultValue: 'ready'
        },
        source: DataTypes.STRING(50),
        ref: DataTypes.STRING(50),
        data: DataTypes.TEXT,
        name: DataTypes.STRING(500),
        description: DataTypes.STRING(5000),
        coverUrl: DataTypes.STRING(200),
        sourceDate: DataTypes.DATE,
        sequence: DataTypes.INTEGER
    }, {
        indexes: [
            { fields: ['type'] },
            { fields: ['status'] },
            { fields: ['source'] },
            { fields: ['ref'] },
            { fields: ['sequence'] },
            { fields: ['challengeId'] },
            { fields: ['createdAt'] },
            { fields: ['userTodoId'] }
        ],
        classMethods: {
            associate: function(models) {
                models[this.name].belongsTo(models.Challenge, { as: 'challenge', onDelete:'CASCADE', onUpdate:'CASCADE' });
                models[this.name].belongsTo(models.User, {foreignKey:'userId', as:'user', onDelete: 'CASCADE', onUpdate: 'CASCADE'});
                models[this.name].belongsTo(models.UserTodo, { as:'userTodo', onDelete: 'CASCADE', onUpdate: 'CASCADE'});

            }
        }
    });
};