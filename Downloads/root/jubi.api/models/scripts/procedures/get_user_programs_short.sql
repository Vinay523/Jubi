DROP procedure IF EXISTS `get_user_programs_short`;


CREATE PROCEDURE `get_user_programs_short`(IN theUserID INT, IN preview INT)
BEGIN
    SELECT P.id, P.linkId
    FROM Programs P
    WHERE P.id IN (
        SELECT MAX(P.id) FROM Programs P
            JOIN Clients C ON C.id=P.clientId JOIN ClientUsers CU ON CU.clientId=C.id
        WHERE
            P.deletedAt IS NULL AND
            CU.userId=theUserID AND
            (preview=1 OR P.status != 'preview') AND
            P.published IS NOT NULL AND (
                (SELECT COUNT(*) FROM ProgramUsers PU1 WHERE PU1.linkId = P.linkId)<=0 OR
                (SELECT COUNT(*) FROM ProgramUsers PU2 WHERE PU2.userId=theUserID AND PU2.linkId = P.linkId) > 0)
        GROUP BY P.linkId
    );
END
