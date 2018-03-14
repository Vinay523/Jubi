DROP procedure IF EXISTS `get_programs`;

CREATE PROCEDURE `get_programs`(IN userId INT, IN getAll INT)
BEGIN

  SELECT
    P.id,
    P.linkId,
    P.slug,
    P.title,
    P.description,
    P.imageRef,
    P.published,
    P.createdAt,
    P.status,
    get_program_major_version(P.linkId) AS publishedVersion,
    get_program_minor_version(P.linkId) AS version,
    H.userId AS updatedById,
    U.firstName AS updatedByFirstName,
    U.lastName AS updatedByLastName,
    C.id AS clientId,
    C.slug AS clientSlug,
    C.name AS clientName,
    P.contentAuthor,
    P.contentDescription,
    CP.id AS contentProviderId,
    CP.name AS contentProviderName,
    PL.id as programLicenseId
  FROM Programs P
    INNER JOIN Histories H ON H.programId = P.id
    INNER JOIN Users U ON U.id = H.userId
    INNER JOIN Clients C ON C.id = P.clientId
    LEFT OUTER JOIN Clients CP ON CP.id = P.contentProviderId
    LEFT OUTER JOIN ProgramLicenses PL ON PL.linkId = P.linkId
  WHERE
    P.id IN (
      SELECT MAX(P.id) FROM Programs P
        JOIN Clients C ON C.id=P.clientId
        JOIN ClientUsers CU ON CU.clientId=C.id
      WHERE
        P.deletedAt IS NULL AND
        CU.userId=userId AND
        (getAll<>0 OR (getAll=0 AND P.published IS NOT NULL))
      GROUP BY P.linkId
    )
    AND (PL.id IS NULL OR PL.type = 'edit')
  GROUP BY
    P.linkId
  ORDER BY
    P.createdAt DESC;

END
