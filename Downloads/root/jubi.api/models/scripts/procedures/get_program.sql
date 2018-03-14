DROP procedure IF EXISTS `get_program`;


CREATE PROCEDURE `get_program`(IN ref VARCHAR(100), IN restore INT)
BEGIN

  SELECT get_program_link_id(ref) INTO @linkId;
  SELECT IF(restore > 0, restore, get_current_program_id(@linkId, 1)) INTO @id;

  SELECT
    P.id, P.linkId, P.slug, P.title, P.description, P.imageRef, P.published, P.createdAt,
    (SELECT COUNT(*) FROM Programs P2 WHERE P2.linkId=P.linkId) AS version,
    H.userId AS updatedById, U.firstName AS updatedByFirstName, U.lastName AS updatedByLastName,
    C.id AS clientId, C.slug AS clientSlug, C.name AS clientName, C.createdAt AS clientCreatedAt,

    P.contentAuthor, P.contentDescription,

    CP.id AS contentProviderId, CP.name AS contentProviderName,

    Q.id AS questId, Q.title AS questTitle, Q.objective AS questObjective,
    Q.backgroundImageRef AS questBackgroundImageRef, Q.featuredImageRef AS questFeaturedImageRef,

    CH.id AS challengeId, CH.type AS challengeType, CH.title AS challengeTitle,
    CH.instructions AS challengeInstructions, CH.finishText AS challengeFinishText, CH.notes AS challengeNotes,
    CH.canUploadContent AS challengeCanUploadContent, CH.points AS challengePoints,

    CQ.id AS questionId, CQ.question AS question,
    CQT.id AS questionTypeId, CQT.name AS questionTypeName,

    CA.id AS answerId, CA.answer, CA.correct AS answerCorrect,

    CM.id AS mediaId, CM.type AS mediaType, CM.data AS mediaData, CM.source AS mediaSource, CM.coverUrl AS mediaCoverUrl,
    CM.name AS mediaName, CM.description AS mediaDescription, CM.sourceDate AS mediaSourceDate, CM.ref AS mediaRef,

    (SELECT GROUP_CONCAT(E.type SEPARATOR ',') AS types FROM Encodings E WHERE E.ref=CM.ref AND E.status='ready' GROUP BY E.ref) AS mediaEncodings

  FROM Programs P
    JOIN Histories H ON H.programId=P.id
    JOIN Users U ON U.id=H.userId
    JOIN Clients C ON C.id=P.clientId
    LEFT OUTER JOIN ContentProviders CP ON CP.id=P.contentProviderId
    LEFT OUTER JOIN Quests Q ON Q.programId=P.id

    LEFT OUTER JOIN Challenges CH ON CH.questId=Q.id

    LEFT OUTER JOIN ChallengeQuestions CQ ON CQ.challengeId=CH.id
    LEFT OUTER JOIN ChallengeQuestionTypes CQT ON CQT.id=CQ.typeId

    LEFT OUTER JOIN ChallengeAnswers CA ON CA.questionId=CQ.id

    LEFT OUTER JOIN ChallengeMedia CM ON CM.challengeId=CH.id
  WHERE
    P.deletedAt IS NULL AND
    P.id=@id
  ORDER BY
    Q.sequence, Q.id, Q.createdAt DESC,
    CH.sequence, CH.id, CH.createdAt DESC,
    CQ.sequence, CQ.id, CQ.createdAt DESC,
    CA.sequence, CA.id, CA.createdAt DESC,
    CM.sequence, CM.id, CM.createdAt DESC;

END
