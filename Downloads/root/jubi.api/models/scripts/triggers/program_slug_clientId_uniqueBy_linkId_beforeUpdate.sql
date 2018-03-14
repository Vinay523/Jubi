DROP TRIGGER IF EXISTS program_slug_clientId_uniqueBy_linkId_beforeUpdate;

CREATE TRIGGER program_slug_clientId_uniqueBy_linkId_beforeUpdate BEFORE UPDATE ON Programs
FOR EACH ROW
  BEGIN
    DECLARE msg VARCHAR(255);
    #If the old record had a linkId other then 0 then it can't be updated, error if it is
    IF (OLD.linkId != 0 AND NEW.linkId != OLD.linkId)
    THEN
      SET msg = concat('LinkId cannot be updated: ',
                       cast(new.id AS CHAR));
      SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = msg;
    END IF;

    #slug cannot change for a program, error if it does
    /*IF (NEW.slug != OLD.slug)
    THEN
      SET msg = concat('Slug cannot be updated: ',
                       cast(new.id AS CHAR));
      SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = msg;
    END IF;*/
  END;



