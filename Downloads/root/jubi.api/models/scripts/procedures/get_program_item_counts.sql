DROP procedure IF EXISTS `get_program_item_counts`;

CREATE PROCEDURE `get_program_item_counts`(IN programLinkId INT)
BEGIN

	-- Setup variables
	DECLARE currentProgramId INT;
	DECLARE levelsCount INT;
	DECLARE questsCount INT;
	DECLARE challengesCount INT;
	DECLARE challengesPoints INT;
	DECLARE todosCount INT;
	DECLARE todosPoints INT;
	DECLARE badgesCount INT;
	
    
	-- Get the current active Program Id
    SELECT
		MAX(id) INTO currentProgramId 
	FROM
		Programs
	WHERE
		linkId=programLinkId
	GROUP BY
		linkId;
    
    
    -- Get Levels count
    SELECT
		COUNT(*) INTO levelsCount
	FROM
		Levels
	WHERE
		programId = currentProgramId
	GROUP BY
		programId;
    
    
	-- Get Quests count
    SELECT
		COUNT(*) INTO questsCount
	FROM
		Quests
	WHERE
		programId = currentProgramId
	GROUP BY
		programId;
	
    
    -- Get Challenges count
    SELECT
		COUNT(*) INTO challengesCount
	FROM
		Challenges
        INNER JOIN Quests ON Quests.id = Challenges.questId
	WHERE
		Quests.programId = currentProgramId
	GROUP BY
		Quests.programId;
	
    
    -- Get Challenges points
    SELECT
		SUM(points) INTO challengesPoints
	FROM
		Challenges
        INNER JOIN Quests ON Quests.id = Challenges.questId
	WHERE
		Quests.programId = currentProgramId
	GROUP BY
		Quests.programId;
	
    
    -- Get Todos count
    SELECT
		COUNT(*) INTO todosCount
	FROM
		Todos
	WHERE
		programId = currentProgramId
        AND id IN (SELECT DISTINCT todoId FROM TodoRequirements)	-- Make sure the Todo can actually be completed.
	GROUP BY
		programId;


    -- Get Todos points
    SELECT
		SUM(points) INTO todosPoints
	FROM
		Todos
	WHERE
		programId = currentProgramId
        AND id IN (SELECT DISTINCT todoId FROM TodoRequirements)	-- Make sure the Todo can actually be completed.
	GROUP BY
		programId;
	
    
    -- Get Badges count
    SELECT
		COUNT(*) INTO badgesCount
	FROM
		Badges
	WHERE
		programId = currentProgramId
	GROUP BY
		programId;
    
    
    -- Final output
    SELECT
		currentProgramId,
        IFNULL(levelsCount, 0) AS levelsCount,
        IFNULL(questsCount, 0) AS questsCount,
        IFNULL(challengesCount, 0) AS challengesCount,
        IFNULL(challengesPoints, 0) AS challengesPoints,
        IFNULL(todosCount, 0) AS todosCount,
        IFNULL(todosPoints, 0) AS todosPoints,
        (IFNULL(challengesPoints, 0) + IFNULL(todosPoints, 0)) AS totalBasePoints,
        IFNULL(badgesCount, 0) AS badgesCount;

END