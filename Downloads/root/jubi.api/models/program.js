module.exports = function (sequelize, DataTypes) {
    return sequelize.define('Program', {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            slug: {
                type: DataTypes.STRING(100),
                allowNull: false
            },
            status: {
                type: DataTypes.ENUM('ready', 'preview', 'autoSaved'),
                defaultValue: 'ready'
            },
            linkId: DataTypes.INTEGER,
            title: {
                type: DataTypes.STRING(250),
                allowNull: false
            },
            description: DataTypes.TEXT,
            imageRef: DataTypes.STRING(200),
            published: DataTypes.DATE,
            sequence: DataTypes.INTEGER,
            contentAuthor: DataTypes.STRING(200),
            contentDescription: DataTypes.TEXT,
            sequencingTypeId: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            sequencingParameters: DataTypes.STRING(200),
            userBonusPointsBucket: DataTypes.INTEGER,
            cancelMigrateResultsOnPublish: DataTypes.BOOLEAN
        }, {
            paranoid: true,
            indexes: [
                {fields: ['linkId']},
                {fields: ['slug']},
                {fields: ['status']},
                {fields: ['title']},
                {fields: ['published']},
                {fields: ['sequence']},
                {fields: ['createdById']},
                {fields: ['clientId']},
                {fields: ['contentProviderId']},
                {fields: ['createdAt']},
                {fields: ['deletedAt']}
            ],
            classMethods: {
                associate: function (models) {
                    models[this.name].belongsTo(models.User, {
                        as: 'createdBy',
                        onDelete: 'CASCADE',
                        onUpdate: 'CASCADE'
                    });
                    models[this.name].belongsTo(models.Client, {
                        as: 'client',
                        onDelete: 'CASCADE',
                        onUpdate: 'CASCADE'
                    });
                    models[this.name].belongsTo(models.Client, {
                        as: 'contentProvider',
                        onDelete: 'CASCADE',
                        onUpdate: 'CASCADE'
                    });
                    models[this.name].belongsTo(models.SequencingType, {
                        as: 'sequencingType',
                        onDelete: 'CASCADE',
                        onUpdate: 'CASCADE'
                    });

                    models[this.name].hasMany(models.Quest, {as: 'programQuests', foreignKey: 'programId'});
                    models[this.name].hasMany(models.Level, {as: 'levels', foreignKey: 'programId'});
                    models[this.name].hasMany(models.Badge, {as: 'badges', foreignKey: 'programId'});
                    models[this.name].hasMany(models.Todo, {as: 'todos', foreignKey: 'programId'});
                    models[this.name].hasMany(models.ProgramLicense, {as: 'licenses', foreignKey: 'licensedProgramId'});
                    models[this.name].hasOne(models.History, {as: 'history', foreignKey: 'programId'});

                }
            }
        }
    );
};