DROP FUNCTION IF EXISTS `get_program_minor_version`;

CREATE FUNCTION `get_program_minor_version`(linkId INT)
RETURNS INT
BEGIN

    SET @publishedId = get_published_program_id(linkId);

    IF @publishedId IS NULL THEN
		SELECT
			COUNT(*) INTO @result
		FROM
			Programs P
		WHERE
			P.linkId = linkId
			AND P.status IN ('ready','preview')
			AND P.published IS NULL
			AND P.deletedAt IS NULL;
    ELSE
		SELECT
			COUNT(*) INTO @result
		FROM
			Programs P
		WHERE
			P.linkId = linkId
			AND P.status IN ('ready','preview')
			AND P.published IS NULL
			AND P.id > @publishedId
		  AND P.deletedAt IS NULL;
	END IF;

    RETURN IFNULL(@result, 0);

END