DROP VIEW IF EXISTS `PollResults`;

CREATE VIEW `PollResults`
AS

SELECT
    CRI.questionId,
    CRI.answerId,
    CR.userId
FROM
	ChallengeResultItems CRI
    INNER JOIN ChallengeResults CR ON CR.id = CRI.resultId
    INNER JOIN ChallengeAnswers CA ON CA.id = CRI.answerId
    INNER JOIN Challenges C ON C.id = CR.challengeId
    INNER JOIN ChallengeQuestions CQ ON CQ.challengeId = C.id
    INNER JOIN ChallengeQuestionTypes CTQ ON CTQ.id = CQ.typeId
WHERE
	CTQ.name IN ('Poll', 'Poll Multi Select')