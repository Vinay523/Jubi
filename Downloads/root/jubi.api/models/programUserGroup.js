module.exports = function(sequelize, DataTypes) {
    return sequelize.define('ProgramUserGroup', {
        name: DataTypes.STRING(36)
    }, {
        indexes: [
            { fields: ['ownerId'] }
        ],
        classMethods: {
            associate: function(models) {
                models[this.name].belongsTo(models.ProgramUser, { as:'owner', onDelete: 'CASCADE', onUpdate: 'CASCADE'});
                models[this.name].hasMany(models.ProgramUserGroupUser, {as: 'programUsers', foreignKey: 'programUserGroupId',  onDelete: 'CASCADE', onUpdate: 'CASCADE'});
            }
        }
    });
};