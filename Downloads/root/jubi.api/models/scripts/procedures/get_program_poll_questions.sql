DROP procedure IF EXISTS `get_program_poll_questions`;

CREATE PROCEDURE `get_program_poll_questions`(IN programId INT)
BEGIN

	-- Poll Challenges linked to Quests
    SELECT
    	IFNULL(L.sequence, 0) AS levelSequence,
        C.id AS challengeId,
        C.sequence AS challengeSequence,
        C.title AS challengeTitle,
        'quest' AS questOrTodo,
        Q.id AS questId,
        Q.sequence AS questSequence,
        Q.title AS questTitle,
        NULL AS todoId,
        NULL AS todoTitle,
        CQ.id AS questionId,
        CQ.sequence AS questionSequence,
        CQ.question AS questionTitle
    FROM
    	Challenges C
    	INNER JOIN ChallengeQuestions CQ ON CQ.challengeId = C.id
        INNER JOIN ChallengeQuestionTypes CTQ ON CTQ.id = CQ.typeId
        INNER JOIN Quests Q ON Q.id = C.questId
        INNER JOIN Programs P ON P.id = Q.programId
        LEFT OUTER JOIN Levels L ON L.id = Q.levelId
    WHERE
    	CTQ.name IN ('Poll', 'Poll Multi Select')
        AND P.id = programId

    UNION ALL

    -- Poll Challenges linked to To-Dos
    SELECT
    	0 AS levelSequence,
        C.id AS challengeId,
        C.sequence AS challengeSequence,
        C.title AS challengeTitle,
        'todo' AS questOrTodo,
        NULL AS questId,
        NULL AS questSequence,
        NULL AS questTitle,
        T.id AS todoId,
        T.title AS todoTitle,
        CQ.id AS questionId,
        CQ.sequence AS questionSequence,
        CQ.question AS questionTitle
    FROM
    	Challenges C
    	INNER JOIN ChallengeQuestions CQ ON CQ.challengeId = C.id
        INNER JOIN ChallengeQuestionTypes CTQ ON CTQ.id = CQ.typeId
        INNER JOIN Todos T ON T.id = C.todoId
        INNER JOIN Programs P ON P.id = T.programId
    WHERE
    	CTQ.name IN ('Poll', 'Poll Multi Select')
        AND P.id = programId
    ORDER BY
    	levelSequence,
    	challengeSequence;

END