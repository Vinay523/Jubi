DROP FUNCTION IF EXISTS `get_program_major_version`;

CREATE FUNCTION `get_program_major_version`(linkId INT)
RETURNS INT
BEGIN

    SELECT
        COUNT(*) INTO @result
    FROM
        Programs P
    WHERE
        P.linkId = linkId
        AND P.status IN ('ready','preview')
        AND P.published IS NOT NULL
        AND P.deletedAt IS NULL;

    RETURN IFNULL(@result, 0);

END