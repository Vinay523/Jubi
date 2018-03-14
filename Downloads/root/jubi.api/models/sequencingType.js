module.exports = function(sequelize, DataTypes) {
    return sequelize.define('SequencingType', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: false
        },
        title: {
            type: DataTypes.STRING(100),
            allowNull: false
        }
    }, {
        indexes: [
            { fields: ['title'] }
        ],
        classMethods: {
        }
    });
};

