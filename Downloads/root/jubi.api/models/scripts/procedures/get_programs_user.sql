DROP procedure IF EXISTS `get_programs_user`;

CREATE PROCEDURE `get_programs_user`(IN userId INT, IN preview INT)
BEGIN

  SELECT
    P.id, P.linkId, P.slug, P.title, P.description, P.imageRef, P.published, P.createdAt,
    (SELECT COUNT(*) FROM Programs P2 WHERE P2.linkId=P.linkId) AS version,
    H.userId AS updatedById, U.firstName AS updatedByFirstName, U.lastName AS updatedByLastName,
    C.id AS clientId, C.slug AS clientSlug, C.name AS clientName,
    P.contentAuthor, P.contentDescription,
    CP.id AS contentProviderId, CP.name AS contentProviderName,

    Q.id AS questId, Q.title AS questTitle,
    Q.objective AS questObjective,
    Q.backgroundImageRef AS questBackgroundImageRef,
    Q.featuredImageRef AS questFeaturedImageRef,

    CH.id AS challengeId, CH.type AS challengeType,
    CH.title AS challengeTitle, CH.points AS challengePoints,

    CR.id AS resultId, CR.points AS resultPoints

  FROM Programs P
    JOIN Histories H ON H.programId=P.id
    JOIN Users U ON U.id=H.userId
    JOIN Clients C ON C.id=P.clientId
    LEFT OUTER JOIN ContentProviders CP ON CP.id=P.contentProviderId

    LEFT OUTER JOIN Quests Q ON Q.programId=P.id

    LEFT OUTER JOIN Challenges CH ON CH.questId=Q.id

    LEFT OUTER JOIN ChallengeResults CR ON CR.challengeId=CH.id

  WHERE
    P.id IN (
      SELECT MAX(P.id) FROM Programs P
        JOIN Clients C ON C.id=P.clientId
        JOIN ClientUsers CU ON CU.clientId=C.id
      WHERE
        P.deletedAt IS NULL AND
        CU.userId=userId
      GROUP BY P.linkId
    ) AND
    ((preview=0 AND P.published IS NOT NULL) OR preview<>0)
  ORDER BY
    P.linkId,
    P.createdAt DESC,
    Q.sequence, Q.id,
    CH.sequence, CH.id;

END

