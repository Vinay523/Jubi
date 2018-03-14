DROP procedure IF EXISTS `get_session_user`;

CREATE PROCEDURE `get_session_user` (IN theUserId INT)
BEGIN

SELECT
    C.id AS clientId, C.slug AS clientSlug, C.name AS clientName, C.allowCreateClient, C.trialClientSeats, C.trialLicenseSeats,
    CR.id AS clientRoleId, CR.name AS clientRoleName, C.headerColor, C.headerFontColor, C.logoImageUrl,
    C.backgroundColor, C.buddyLabel, C.badgeLabel, C.backgroundFontColor, C.logoAlignment,
    U.id, U.email, U.password, U.firstName, U.lastName, U.title, U.avatarUrl, U.pendingEmail, U.securityCode, U.securityCodeCreatedAt,
    U.accessToken, U.accessTokenCreatedAt,
    U.tzOffset,U.createdAt, U.updatedAt, U.why, U.destination,
    R.id AS roleId, R.name AS roleName
FROM Users U
    LEFT OUTER JOIN UserRoles UR ON UR.userId=U.id
    LEFT OUTER JOIN Roles R ON R.id=UR.roleId
    LEFT OUTER JOIN ClientUsers CU ON CU.userId=U.id
    LEFT OUTER JOIN Clients C ON C.id=CU.clientId AND C.deletedAt is null
    LEFT OUTER JOIN ClientClientRoles CCR ON CCR.clientId=C.id
    LEFT OUTER JOIN ClientRoles CR ON CR.id=CCR.roleId
WHERE
    U.id=theUserId AND
    U.deletedAt IS NULL
ORDER BY
    C.id, CR.id, R.id;

END





