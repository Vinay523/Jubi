DROP procedure IF EXISTS `get_program_link_id`;


CREATE PROCEDURE `get_program_link_id`(IN slug VARCHAR(100))
BEGIN

  SELECT P.linkId FROM Programs P
  WHERE P.slug=slug
  LIMIT 1;

END
