var app = require('../../../app');
var models = require('../../index')(app);
var services = require('../../../services/index');

var async = require('async');
var Q = require('q');

module.exports = {
    up: function (migration, DataTypes) {
        return Q.Promise(function (resolve, reject) {
            async.series([

                    /* Table DimDates */
                    function (callback) {
                        migration.createTable('DimDates', {
                            id: {
                                type: DataTypes.INTEGER,
                                primaryKey: true,
                                autoIncrement: true
                            },
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
                            },
                            createdAt: DataTypes.DATE,
                            updatedAt: DataTypes.DATE
                        }).then(function () { callback(); }).catch(callback);
                    },

                    /* Table FactProgramUserCompletedItems */
                    function (callback) {
                        migration.createTable('FactProgramUserCompletedItems', {
                            id: {
                                type: DataTypes.INTEGER,
                                primaryKey: true,
                                autoIncrement: true
                            },
                            levelLastCompleted: {
                                type: DataTypes.STRING(100),
                                allowNull: false,
                            },
                            questLastCompleted: {
                                type: DataTypes.STRING(100),
                                allowNull: false,
                            },
                            challengeLastCompleted: {
                                type: DataTypes.STRING(100),
                                allowNull: false,
                            },
                            todoLastCompleted: {
                                type: DataTypes.STRING(100),
                                allowNull: false,
                            },
                            programLinkId: DataTypes.INTEGER,
                            userId: {
                                type: DataTypes.INTEGER,
                                references: {
                                    model: 'Users',
                                    key: 'id'
                                },
                                onUpdate: 'CASCADE',
                                onDelete: 'CASCADE'
                            },
                            dimDateId: {
                                type: DataTypes.INTEGER,
                                references: {
                                    model: 'DimDates',
                                    key: 'id'
                                },
                                onUpdate: 'CASCADE',
                                onDelete: 'CASCADE'
                            },
                            createdAt: DataTypes.DATE,
                            updatedAt: DataTypes.DATE
                        }).then(function () { callback(); }).catch(callback);
                    },

                    /* Table FactProgramUserStats */
                    function (callback) {
                        migration.createTable('FactProgramUserStats', {
                            id: {
                                type: DataTypes.INTEGER,
                                primaryKey: true,
                                autoIncrement: true
                            },
                            levelsCompletedCount: {
                                type: DataTypes.INTEGER,
                                allowNull: false,
                            },
                            levelsCompletedPoints: {
                                type: DataTypes.INTEGER,
                                allowNull: false,
                            },
                            questsCompletedCount: {
                                type: DataTypes.INTEGER,
                                allowNull: false,
                            },
                            questsCompletedPoints: {
                                type: DataTypes.INTEGER,
                                allowNull: false,
                            },
                            challengesCompletedCount: {
                                type: DataTypes.INTEGER,
                                allowNull: false,
                            },
                            challengesCompletedPoints: {
                                type: DataTypes.INTEGER,
                                allowNull: false,
                            },
                            challenges1stAttemptCorrectCount: {
                                type: DataTypes.INTEGER,
                                allowNull: false,
                            },
                            todosCompletedCount: {
                                type: DataTypes.INTEGER,
                                allowNull: false,
                            },
                            todosCompletedPoints: {
                                type: DataTypes.INTEGER,
                                allowNull: false,
                            },
                            totalBasePoints: {
                                type: DataTypes.INTEGER,
                                allowNull: false,
                            },
                            programLinkId: DataTypes.INTEGER,
                            userId: {
                                type: DataTypes.INTEGER,
                                references: {
                                    model: 'Users',
                                    key: 'id'
                                },
                                onUpdate: 'CASCADE',
                                onDelete: 'CASCADE'
                            },
                            dimDateId: {
                                type: DataTypes.INTEGER,
                                references: {
                                    model: 'DimDates',
                                    key: 'id'
                                },
                                onUpdate: 'CASCADE',
                                onDelete: 'CASCADE'
                            },
                            createdAt: DataTypes.DATE,
                            updatedAt: DataTypes.DATE
                        }).then(function () { callback(); }).catch(callback);
                    }

                ],
                function (err) {
                    if (err) return services.helpers.handleReject(err, reject);
                    resolve();
                });
        });
    },
    down: function (migration) {
        return Q.Promise(function (resolve, reject) {

        });
    }
};