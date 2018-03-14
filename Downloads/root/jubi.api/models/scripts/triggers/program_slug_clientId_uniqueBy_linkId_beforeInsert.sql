DROP TRIGGER IF EXISTS program_slug_clientId_uniqueBy_linkId_beforeInsert;

CREATE TRIGGER program_slug_clientId_uniqueBy_linkId_beforeInsert BEFORE INSERT ON Programs
FOR EACH ROW
  BEGIN
    DECLARE msg VARCHAR(255);

    IF NEW.linkId = 0
    THEN
      IF (SELECT COUNT(*)
          FROM Programs p
          WHERE p.slug = NEW.slug && p.clientId = NEW.clientId && p.deletedAt = NULL) > 0
      THEN

        SET msg = concat('Program name unqiuer error: Cannot create program with duplicate name: ',
                         cast(new.id AS CHAR));
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = msg;
      END IF;
    END IF;

    IF NEW.linkId != 0
    THEN
      #If the linkId != 0 then this is an existing program, verify that there aren't any existing programs at this client sharing the same name but
      #with a different linkId (this means this is a new version of the same program)

      IF (SELECT COUNT(*)
          FROM Programs p
          WHERE p.slug = NEW.slug && p.clientId = NEW.clientId && p.linkId != NEW.linkId && p.deletedAt = NULL) > 0
      THEN

        SET msg = concat('Program name unqiuer error: Cannot create program with duplicate name: ',
                         cast(new.id AS CHAR));
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = msg;
      END IF;

      IF (SELECT COUNT(*)
          FROM Programs p
          WHERE p.slug != NEW.slug && p.linkId = NEW.linkId && p.deletedAt = NULL) > 0
      THEN

        SET msg = concat('Program name unqiuer error: Cannot change slug on existing program: ',
                         cast(new.id AS CHAR));
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = msg;
      END IF;

    END IF;
  END;



