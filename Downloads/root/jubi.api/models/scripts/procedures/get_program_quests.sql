DROP procedure IF EXISTS `get_program_quests`;

CREATE PROCEDURE `get_program_quests`(IN ref VARCHAR(100), IN preview INT)
BEGIN

  SELECT get_program_link_id(ref) INTO @linkId;
  SELECT get_current_program_id(@linkId, preview) INTO @id;


  SELECT
    Q.*,
    CH.id AS challengeId, CH.points AS challengePoints,
    CR.id AS resultId, CR.points AS resultPoints

  FROM Quests Q
    LEFT OUTER JOIN Challenges CH ON CH.questId=Q.id
    LEFT OUTER JOIN ChallengeResults CR ON CR.challengeId=CH.id
  WHERE
    Q.programId=@id
  ORDER BY
    Q.sequence, Q.id,
    CH.sequence, CH.id;

END

