DROP procedure IF EXISTS `get_completed_challenges`;

CREATE PROCEDURE `get_completed_challenges`(IN programId INT, IN userId INT)
BEGIN

    -- Completed Challenges linked to Quests
    SELECT DISTINCT
        CR.challengeId
    FROM
        ChallengeResults CR
        INNER JOIN Challenges C ON C.id = CR.challengeId
        INNER JOIN Quests Q ON Q.id = C.questId
    WHERE
        CR.userId = userId
        AND Q.programId = programId

    UNION ALL

    -- Completed Challenges linked to Todos
    SELECT DISTINCT
        CR.challengeId
    FROM
        ChallengeResults CR
        INNER JOIN Challenges C ON C.id = CR.challengeId
        INNER JOIN Todos T ON T.id = C.todoId
    WHERE
        CR.userId = userId
        AND T.programId = programId

    ORDER BY
        challengeId;

END