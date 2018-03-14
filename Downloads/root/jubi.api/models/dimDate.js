module.exports = function(sequelize, DataTypes) {
    return sequelize.define('DimDate', {
        date: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        fullDateUK: {
          type: 'CHAR(10)',
          allowNull: false,
        },
        fullDateUSA: {
          type: 'CHAR(10)',
          allowNull: false,
        },
        dayOfMonth: {
          type: DataTypes.STRING(2),
          allowNull: false,
        },
        daySuffix: {
          type: DataTypes.STRING(4),
          allowNull: false,
        },
        dayName: {
          type: DataTypes.STRING(9),
          allowNull: false,
        },
        dayOfWeekUSA: {
          type: 'CHAR(1)',
          allowNull: false,
        },
        dayOfWeekUK: {
          type: 'CHAR(1)',
          allowNull: false,
        },
        dayOfWeekInMonth: {
          type: DataTypes.STRING(2),
          allowNull: false,
        },
        dayOfWeekInYear: {
          type: DataTypes.STRING(2),
          allowNull: false,
        },
        dayOfQuarter: {
          type: DataTypes.STRING(3),
          allowNull: false,
        },
        dayOfYear: {
          type: DataTypes.STRING(3),
          allowNull: false,
        },
        weekOfMonth: {
          type: DataTypes.STRING(1),
          allowNull: false,
        },
        weekOfQuarter: {
          type: DataTypes.STRING(2),
          allowNull: false,
        },
        weekOfYear: {
          type: DataTypes.STRING(2),
          allowNull: false,
        },
        month: {
          type: DataTypes.STRING(2),
          allowNull: false,
        },
        monthName: {
          type: DataTypes.STRING(9),
          allowNull: false,
        },
        monthOfQuarter: {
          type: DataTypes.STRING(2),
          allowNull: false,
        },
        quarter: {
          type: 'CHAR(1)',
          allowNull: false,
        },
        quarterName: {
          type: DataTypes.STRING(9),
          allowNull: false,
        },
        year: {
          type: 'CHAR(4)',
          allowNull: false,
        },
        yearName: {
          type: 'CHAR(7)',
          allowNull: false,
        },
        monthYear: {
          type: 'CHAR(10)',
          allowNull: false,
        },
        mmyyyy: {
          type: 'CHAR(6)',
          allowNull: false,
        },
        firstDayOfMonth: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        lastDayOfMonth: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        firstDayOfQuarter: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        lastDayOfQuarter: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        firstDayOfYear: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        lastDayOfYear: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        isHolidayUSA: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
        },
        isWeekday: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
        },
        holidayUSA: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        isHolidayUK: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
        },
        holidayUK: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        fiscalDayOfYear: {
          type: DataTypes.STRING(3),
          allowNull: false,
        },
        fiscalWeekOfYear: {
          type: DataTypes.STRING(3),
          allowNull: false,
        },
        fiscalMonth: {
          type: DataTypes.STRING(2),
          allowNull: false,
        },
        fiscalQuarter: {
          type: 'CHAR(1)',
          allowNull: false,
        },
        fiscalQuarterName: {
          type: DataTypes.STRING(9),
          allowNull: false,
        },
        fiscalYear: {
          type: 'CHAR(4)',
          allowNull: false,
        },
        fiscalYearName: {
          type: 'CHAR(7)',
          allowNull: false,
        },
        fiscalMonthYear: {
          type: 'CHAR(10)',
          allowNull: false,
        },
        fiscalMMYYYY: {
          type: 'CHAR(6)',
          allowNull: false,
        },
        fiscalFirstDayOfMonth: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        fiscalLastDayOfMonth: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        fiscalFirstDayOfQuarter: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        fiscalLastDayOfQuarter: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        fiscalFirstDayOfYear: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        fiscalLastDayOfYear: {
          type: DataTypes.DATE,
          allowNull: false,
        }
    }, {
        classMethods: {
            associate: function (models) {
                models[this.name].hasMany(models.FactProgramUserCompletedItems, {as: 'factProgramUserCompletedItems', foreignKey: 'dimDateId'});
                models[this.name].hasMany(models.FactProgramUserCompletedItemsIntraday, {as: 'factProgramUserCompletedItemsIntraday', foreignKey: 'dimDateId'});
                models[this.name].hasMany(models.FactProgramUserStats, {as: 'factProgramUserStats', foreignKey: 'dimDateId'});
                models[this.name].hasMany(models.FactProgramUserStatsIntraday, {as: 'factProgramUserStatsIntraday', foreignKey: 'dimDateId'});
            }
        }
    });
};
