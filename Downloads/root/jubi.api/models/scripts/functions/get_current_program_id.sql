DROP FUNCTION IF EXISTS `get_program_major_version`;

CREATE FUNCTION `get_program_major_version`(linkId INT)
RETURNS INT
BEGIN

  SELECT P.id INTO @result
  FROM Programs P
  WHERE
    P.linkId=linkId AND
    (preview<>0 OR (preview=0 AND P.status='ready'))
  ORDER BY P.createdAt DESC
  LIMIT 1;

  RETURN @result;

END