module.exports = function(sequelize, DataTypes) {
    return sequelize.define('ProgramUserAssociation', {
    }, {
        paranoid:true,
        indexes: [
            { fields: ['programUserId'] },
            { fields: ['associatedProgramUserId'] },
            { fields: ['typeId'] }
        ],
        classMethods: {
            associate: function(models) {
                models[this.name].belongsTo(models.ProgramUserAssociationType, { as:'type', onDelete: 'CASCADE', onUpdate: 'CASCADE'});
                models[this.name].belongsTo(models.ProgramUser, { as:'programUser', onDelete: 'CASCADE', onUpdate: 'CASCADE'});
                models[this.name].belongsTo(models.ProgramUser, { as:'associatedProgramUser', onDelete: 'CASCADE', onUpdate: 'CASCADE'});
            }
        }
    });
};