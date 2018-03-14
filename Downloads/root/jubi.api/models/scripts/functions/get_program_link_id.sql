DROP FUNCTION IF EXISTS `get_program_link_id`;

CREATE FUNCTION `get_program_link_id`(ref VARCHAR(100))
RETURNS INT
BEGIN

  SELECT P.linkId INTO @result
  FROM Programs P
  WHERE
    P.slug=ref OR
    P.linkId=ref
  LIMIT 1;

  RETURN IF(@result IS NULL, ref, @result);

END