module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Todo', {
        title: {
            type:       DataTypes.STRING(100),
            allowNull:  false
        },
        instructions: DataTypes.STRING(1024),
        verificationInstructions: DataTypes.STRING(1024),
        points: DataTypes.INTEGER,
        validate: DataTypes.BOOLEAN,
        dueByUser: DataTypes.BOOLEAN,
        dueDate: DataTypes.DATE,
        resourceUrl: DataTypes.STRING(255),
        resourceName: DataTypes.STRING(255),
        resourceDescription: DataTypes.STRING(1000),
        slug: DataTypes.STRING(255),
        publishedAt: DataTypes.DATE,

    }, {
        indexes: [
            { fields: ['title'] },
            { fields: ['programId'] },
            { fields: ['dueDate'] },
            { fields: ['questId'] },
        ],
        classMethods: {
            associate: function(models) {
                models[this.name].hasMany(models.TodoRequirement, { as: 'requirements', foreignKey: 'todoId' });
                models[this.name].hasMany(models.UserTodo, { as: 'userTodos', foreignKey: 'todoId' });
                models[this.name].belongsTo(models.Program, { as: 'program', onDelete:'CASCADE', onUpdate:'CASCADE' });
                models[this.name].hasMany(models.Challenge, { as: 'challenges', foreignKey: 'todoId' });
                models[this.name].belongsTo(models.Quest, { as: 'quest', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
            }
        }
    });
};