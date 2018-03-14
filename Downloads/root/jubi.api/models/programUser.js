module.exports = function (sequelize, DataTypes) {
    return sequelize.define('ProgramUser', {
        linkId: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    }, {
        indexes: [
            {fields: ['linkId']},
            {fields: ['userId']}
        ],
        classMethods: {
            associate: function (models) {
                models[this.name].belongsTo(models.User, {as: 'user', onDelete: 'CASCADE', onUpdate: 'CASCADE'});
            }
        }
    });
};