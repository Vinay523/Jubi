DROP procedure IF EXISTS `get_program_history`;

CREATE PROCEDURE `get_program_history`(IN linkId INT, IN getCount INT)
BEGIN

  SELECT
    H.id, H.programId, H.comment, H.createdAt, H.updatedAt, 1 AS hello,
    U.id AS userId, U.firstName AS userFirstName, U.lastName AS userLastName,
    (
      SELECT COUNT(*) FROM Histories H
        JOIN Programs P ON P.id=H.programId AND P.linkId=linkId
      WHERE
        P.status='ready'
    ) AS totalCount
  FROM Histories H
    JOIN Programs P ON P.id=H.programId AND P.linkId=linkId
    JOIN Users U ON U.id=H.userId
  WHERE
    P.status='ready'
  ORDER BY H.updatedAt DESC
  LIMIT getCount;

END
