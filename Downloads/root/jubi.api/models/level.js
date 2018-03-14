module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Level', {
        title: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        sequence:{
            type: DataTypes.INTEGER,
            allowNull: false
        },
        sequencingTypeId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        sequencingParameters: DataTypes.STRING(200),
        slug: DataTypes.STRING(255)
    }, {
        indexes: [
            { fields: ['title'] },
            { fields: ['sequence'] },
            { fields: ['programId'] },
            { fields: ['createdAt'] }
        ],
        classMethods: {
            associate: function(models) {
                models[this.name].belongsTo(models.Program, { as: 'program', onDelete:'CASCADE', onUpdate:'CASCADE' });
                models[this.name].belongsTo(models.SequencingType, { as: 'sequencingType', onDelete:'CASCADE', onUpdate:'CASCADE' });

                models[this.name].hasMany(models.Quest, { as:'levelQuests', foreignKey:'levelId'});
            }
        }
    });
};