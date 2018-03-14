DROP FUNCTION IF EXISTS `get_published_program_id`;

CREATE FUNCTION `get_published_program_id`(linkId INT)
RETURNS INT
BEGIN

    SELECT
        MAX(P.id) INTO @result
    FROM
        Programs P
    WHERE
        P.linkId = linkId
        AND P.status IN ('ready','preview')
        AND P.published IS NOT NULL;

    RETURN @result;

END