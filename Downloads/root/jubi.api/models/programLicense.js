module.exports = function(sequelize, DataTypes) {
    return sequelize.define('ProgramLicense', {
        type: {
            type: DataTypes.ENUM('readOnly', 'edit'),
            allowNull: false
        },
        seats: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        linkId: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    }, {
        paranoid: true,
        indexes: [
            { fields: ['type'] },
            { fields: ['licensedProgramId'] },
            { fields: ['linkId'] },
            { fields: ['createdAt'] }
        ],
        classMethods: {
            associate: function(models) {
                models[this.name].belongsTo(models.Program, { as: 'licensedProgram', onDelete:'CASCADE', onUpdate:'CASCADE' });
            }
        }
    });
};