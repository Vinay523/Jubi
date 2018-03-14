module.exports = function (sequelize, DataTypes) {
    return sequelize.define('ResetUser', {
        resetKey:           DataTypes.STRING(36),
        completed: {
            type:           DataTypes.BOOLEAN,
            allowNull:      false,
            defaultValue:   false}
    }, {
        indexes: [
            {fields:['resetKey']},
            {fields:['completed']},
            {fields:['userId']},
            {fields:['createdAt']},
            {fields:['updatedAt']}
        ],
        classMethods: {associate: function(models) {
            models[this.name].belongsTo(models.User, { foreignKey:'', as: 'user' });
        }}
    });
};