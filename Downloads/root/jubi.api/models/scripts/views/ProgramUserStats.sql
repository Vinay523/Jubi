DROP VIEW IF EXISTS `ProgramUserStats`;

CREATE VIEW `ProgramUserStats`
AS

SELECT
	D.date,
    DATE_FORMAT(D.date,'%m/%d/%Y') AS dateDisplay,
    D.weekOfYear AS week,
    CONCAT('Week ', D.weekOfYear) AS weekDisplay,
    D.month,
    D.monthName,
    D.monthYear,
    D.mmyyyy,
    D.monthName AS monthDisplay,
    D.quarter,
    D.quarterName,
    CONCAT('Q', D.quarter) AS quarterDisplay,
    D.year,
    D.yearName,
    CONCAT(D.year) AS yearDisplay,
    F.dimDateId,
    F.programLinkId,
    F.userId,
    IFNULL(U.firstName, '') AS userFirstName,
    IFNULL(U.lastName, '') AS userLastName,
    CONCAT(IFNULL(U.firstName, ''), ' ', IFNULL(U.lastName, '')) AS userFullName,
    F.levelsCompletedCount,
    F.levelsCompletedPoints,
    F.questsCompletedCount,
    F.questsCompletedPoints,
    F.challengesCompletedCount,
    F.challengesCompletedPoints,
    F.challenges1stAttemptCorrectCount,
    F.todosCompletedCount,
    F.todosCompletedPoints,
    F.totalBasePoints,
    F.badgesEarnedCount
FROM
	FactProgramUserStatsIntraday F
    INNER JOIN Users U ON U.id = F.userId
    INNER JOIN DimDates D ON D.id = F.dimDateId

UNION ALL

SELECT
	D.date,
    DATE_FORMAT(D.date,'%m/%d/%Y') AS dateDisplay,
    D.weekOfYear AS week,
    CONCAT('Week ', D.weekOfYear) AS weekDisplay,
    D.month,
    D.monthName,
    D.monthYear,
    D.mmyyyy,
    D.monthName AS monthDisplay,
    D.quarter,
    D.quarterName,
    CONCAT('Q', D.quarter) AS quarterDisplay,
    D.year,
    D.yearName,
    CONCAT(D.year) AS yearDisplay,
    F.dimDateId,
    F.programLinkId,
    F.userId,
    IFNULL(U.firstName, '') AS userFirstName,
    IFNULL(U.lastName, '') AS userLastName,
    CONCAT(IFNULL(U.firstName, ''), ' ', IFNULL(U.lastName, '')) AS userFullName,
    F.levelsCompletedCount,
    F.levelsCompletedPoints,
    F.questsCompletedCount,
    F.questsCompletedPoints,
    F.challengesCompletedCount,
    F.challengesCompletedPoints,
    F.challenges1stAttemptCorrectCount,
    F.todosCompletedCount,
    F.todosCompletedPoints,
    F.totalBasePoints,
    F.badgesEarnedCount
FROM
	FactProgramUserStats F
    INNER JOIN Users U ON U.id = F.userId
    INNER JOIN DimDates D ON D.id = F.dimDateId    