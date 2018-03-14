/* This script will seed an initial configuration with a global administrator */

/* Create "Jubi Client */

INSERT INTO `jubi`.`Clients`
(`id`,
`name`,
`slug`,
`createdAt`,
`updatedAt`,
`seats`,
`allowCreateClient`,
`trialClientSeats`,
`maxLicenseSeats`,
`logoImageUrl`,
`logoAlignment`,
`trialLicenseSeats`)
VALUES
(1,
'Jubi',
'jubi',
'2015-04-24 20:58:29',
'2017-12-21 16:29:37',
500,
1,
0,
500,
'ui/5c4414aa-3d41-4c97-b838-e8c0880b1bdf.jpg',
'left',
500);

/* Create Global Administrator */

INSERT INTO `jubi`.`Users`
(`id`,
`firstName`,
`lastName`,
`title`,
`email`,
`password`,
`avatarUrl`,
`tzOffset`,
`createdAt`,
`updatedAt`,
`deletedAt`,
`tempToken`,
`why`,
`destination`,
`pendingEmail`,
`securityCode`,
`securityCodeCreatedAt`,
`accessToken`,
`accessTokenCreatedAt`)
VALUES
(1, 'Jubi', 'Admin', 'Administrator', 'admin@getjubi.com', '$2a$10$wrFqLpbI8N33KlQPevZF9e4LTnwgzl/mCk4pjSiv33hVMeNNJreom', 'ui/af5c5b2d-74fa-451e-b751-417d48efdeeb.jpg', 300, '2015-04-24 20:58:29', '2017-10-12 12:41:31', NULL, NULL, NULL, NULL, NULL, NULL, '2016-07-12 02:15:38', 'U9Xe15k6UZhMZhPy9iZiJpq3izAhiw64qYI0KpFPdBnbBbwUd1', '2016-07-12 02:16:24');

/* Create Primary Initial Roles */

INSERT INTO `jubi`.`Roles`
(`id`,
`name`)
VALUES
(1,
'System Admin');

INSERT INTO `jubi`.`Roles`
(`id`,
`name`)
VALUES
(2,
'Client Admin');

INSERT INTO `jubi`.`Roles`
(`id`,
`name`)
VALUES
(3,
'Client Author');

INSERT INTO `jubi`.`Roles`
(`id`,
`name`)
VALUES
(4,
'Client User');

/* Link Global Admin user to 'System Admin' role */

INSERT INTO `jubi`.`UserRoles`
(`userId`,
`roleId`)
VALUES
(1,
1);

/* Add Jubi Client to global Admin User */

INSERT INTO `jubi`.`ClientUsers`
(`userId`,
`clientId`)
VALUES
(1,
1);

commit;

/* select * FROM jubi.Clients; */
/* select * FROM jubi.Users; */
/* select * FROM jubi.Roles; */
/* select * FROM jubi.UserRoles; */
/* select * FROM jubi.ClientUsers; */
