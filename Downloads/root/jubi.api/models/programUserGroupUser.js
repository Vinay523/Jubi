module.exports = function(sequelize, DataTypes) {
    return sequelize.define('ProgramUserGroupUser', {
    }, {
        indexes: [
            { fields: ['programUserId'] }
        ],
        classMethods: {
            associate: function(models) {
                models[this.name].belongsTo(models.ProgramUserGroup, { as:'programUserGroup', onDelete: 'CASCADE', onUpdate: 'CASCADE'});
                models[this.name].belongsTo(models.ProgramUser, { as:'programUser', onDelete: 'CASCADE', onUpdate: 'CASCADE'});
            }
        }
    });
};