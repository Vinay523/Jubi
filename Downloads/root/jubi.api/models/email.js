module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Email', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        status: {
            type: DataTypes.ENUM('new', 'sent', 'na'),
            defaultValue: 'new'
        },
        subject: DataTypes.STRING(1000),
        to: DataTypes.STRING(250),
        cc: DataTypes.STRING(1000),
        from: DataTypes.STRING(250),
        html: DataTypes.TEXT,
        text: DataTypes.TEXT
    }, {
        indexes: [
            { fields: ['status'] },
            { fields: ['to'] },
            { fields: ['from'] },
            { fields: ['createdAt'] },
            { fields: ['updatedAt'] }
        ]
    });
};