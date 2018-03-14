DROP procedure IF EXISTS `get_program_levels`;


CREATE PROCEDURE `get_program_levels`(IN id INT)
BEGIN

  SELECT
    P.id, P.linkId, P.slug,
    L.id AS levelId, L.title AS levelTitle,
    Q.id AS questId
  FROM Programs P
    JOIN Levels L ON L.programId=P.id
    JOIN LevelQuests LQ ON LQ.levelId=L.id
    JOIN Quests Q ON Q.id=LQ.questId
  WHERE
    P.id=id
  ORDER BY
    L.sequence, L.id, L.createdAt DESC,
    LQ.sequence;

END
