DROP procedure IF EXISTS `get_programs_scoring`;

CREATE PROCEDURE `get_programs_scoring`(IN userId INT)
BEGIN

  SELECT
    P.id, P.linkId, P.title, P.description, P.imageRef, P.published, P.createdAt,
    (SELECT COUNT(*) FROM Programs P2 WHERE P2.linkId=P.linkId) AS version,
    H.userId AS updatedById, U.firstName AS updatedByFirstName, U.lastName AS updatedByLastName,
    C.id AS clientId, C.name AS clientName,
    P.contentAuthor, P.contentDescription,
    CP.id AS contentProviderId, CP.name AS contentProviderName,

    Q.id AS questId, Q.title AS questTitle, Q.objective AS questObjective,
    Q.backgroundImageRef AS questBackgroundImageRef, Q.featuredImageRef AS questFeaturedImageRef,

    CH.id AS challengeId, CH.type AS challengeType, CH.title AS challengeTitle, CH.points AS challengePoints,

    CQ.id AS questionId, CQ.question AS question,
    CQT.id AS questionTypeId, CQT.name AS questionTypeName

  FROM Programs P
    JOIN Histories H ON H.programId=P.id
    JOIN Users U ON U.id=H.userId
    JOIN Clients C ON C.id=P.clientId
    LEFT OUTER JOIN ContentProviders CP ON CP.id=P.contentProviderId
    LEFT OUTER JOIN Quests Q ON Q.programId=P.id
    LEFT OUTER JOIN Challenges CH ON CH.questId=Q.id AND CH.type<>'finish'
    LEFT OUTER JOIN ChallengeQuestions CQ ON CQ.challengeId=CH.id
    LEFT OUTER JOIN ChallengeQuestionTypes CQT ON CQT.id=CQ.typeId
  WHERE P.id IN (
    SELECT MAX(P.id) FROM Programs P
      JOIN Clients C ON C.id=P.clientId
      JOIN ClientUsers CU ON CU.clientId=C.id
    WHERE
      P.deletedAt IS NULL AND
      CU.userId=userId
    GROUP BY P.linkId
  )
  ORDER BY
    P.createdAt DESC, P.title,
    Q.sequence, Q.id, Q.createdAt DESC,
    CH.sequence, CH.id, CH.createdAt DESC,
    CQ.sequence, CQ.id, CQ.createdAt DESC;

END
