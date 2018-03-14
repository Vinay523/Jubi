CREATE DATABASE  IF NOT EXISTS `jubi` /*!40100 DEFAULT CHARACTER SET latin1 */;
USE `jubi`;
-- MySQL dump 10.13  Distrib 5.7.17, for Win64 (x86_64)
--
-- Host: jubi-prop2-do-not-delete-sso-steve.cjenmqfikiqv.us-east-1.rds.amazonaws.com    Database: jubi
-- ------------------------------------------------------
-- Server version	5.6.29-log

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `BadgeRequirements`
--

DROP TABLE IF EXISTS `BadgeRequirements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `BadgeRequirements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `requirementRef` varchar(30) NOT NULL,
  `requirementRefId` int(11) NOT NULL,
  `badgeId` int(11) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `badgeId` (`badgeId`),
  CONSTRAINT `BadgeRequirements_ibfk_1` FOREIGN KEY (`badgeId`) REFERENCES `Badges` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=124382 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Badges`
--

DROP TABLE IF EXISTS `Badges`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Badges` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(100) NOT NULL,
  `description` varchar(1024) DEFAULT NULL,
  `imageUrl` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `programId` int(11) DEFAULT NULL,
  `publishedAt` datetime DEFAULT NULL,
  `slug` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `badges_title` (`title`),
  KEY `badges_program_id` (`programId`),
  CONSTRAINT `badge_ibfk_1` FOREIGN KEY (`programId`) REFERENCES `Programs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=151909 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `BonusPoints`
--

DROP TABLE IF EXISTS `BonusPoints`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `BonusPoints` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `points` int(11) DEFAULT NULL,
  `forumItemId` int(11) DEFAULT NULL,
  `userTodoId` int(11) DEFAULT NULL,
  `userId` int(11) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `forumItemId` (`forumItemId`),
  KEY `userTodoId` (`userTodoId`),
  KEY `userId` (`userId`),
  CONSTRAINT `BonusPoints_ibfk_1` FOREIGN KEY (`forumItemId`) REFERENCES `ForumItems` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `BonusPoints_ibfk_2` FOREIGN KEY (`userTodoId`) REFERENCES `UserTodos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `BonusPoints_ibfk_3` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1894 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ChallengeAnswers`
--

DROP TABLE IF EXISTS `ChallengeAnswers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ChallengeAnswers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `answer` varchar(5000) DEFAULT NULL,
  `correct` tinyint(1) DEFAULT '0',
  `sequence` int(11) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `questionId` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `challenge_answers_sequence` (`sequence`),
  KEY `challenge_answers_correct` (`correct`),
  KEY `challenge_answers_question_id` (`questionId`),
  KEY `challenge_answers_created_at` (`createdAt`),
  CONSTRAINT `ChallengeAnswers_ibfk_1` FOREIGN KEY (`questionId`) REFERENCES `ChallengeQuestions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=31700260 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ChallengeHints`
--

DROP TABLE IF EXISTS `ChallengeHints`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ChallengeHints` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `hint` varchar(1000) NOT NULL,
  `points` int(11) NOT NULL,
  `sequence` int(11) DEFAULT NULL,
  `questionId` int(11) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `challenge_hints_question_id` (`questionId`),
  KEY `challenge_hints_sequence` (`sequence`),
  KEY `challenge_hints_created_at` (`createdAt`),
  CONSTRAINT `ChallengeHints_ibfk_1` FOREIGN KEY (`questionId`) REFERENCES `ChallengeQuestions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20142280 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ChallengeMedia`
--

DROP TABLE IF EXISTS `ChallengeMedia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ChallengeMedia` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` enum('text','link','image','video','audio','resource') NOT NULL,
  `status` enum('ready','encoding') DEFAULT 'ready',
  `source` varchar(50) DEFAULT NULL,
  `ref` varchar(50) DEFAULT NULL,
  `data` text,
  `name` varchar(500) DEFAULT NULL,
  `description` varchar(5000) DEFAULT NULL,
  `coverUrl` varchar(200) DEFAULT NULL,
  `sourceDate` datetime DEFAULT NULL,
  `sequence` int(11) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `challengeId` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `challenge_media_type` (`type`),
  KEY `challenge_media_status` (`status`),
  KEY `challenge_media_source` (`source`),
  KEY `challenge_media_ref` (`ref`),
  KEY `challenge_media_sequence` (`sequence`),
  KEY `challenge_media_challenge_id` (`challengeId`),
  KEY `challenge_media_created_at` (`createdAt`),
  CONSTRAINT `ChallengeMedia_ibfk_1` FOREIGN KEY (`challengeId`) REFERENCES `Challenges` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16426526 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ChallengeQuestionTypes`
--

DROP TABLE IF EXISTS `ChallengeQuestionTypes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ChallengeQuestionTypes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `status` enum('active','na') DEFAULT 'active',
  `name` varchar(50) DEFAULT NULL,
  `sequence` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `challenge_question_types_status` (`status`),
  KEY `challenge_question_types_name` (`name`),
  KEY `challenge_question_types_sequence` (`sequence`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ChallengeQuestions`
--

DROP TABLE IF EXISTS `ChallengeQuestions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ChallengeQuestions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `question` varchar(5000) DEFAULT NULL,
  `sequence` int(11) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `challengeId` int(11) DEFAULT NULL,
  `typeId` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `challenge_questions_sequence` (`sequence`),
  KEY `challenge_questions_challenge_id` (`challengeId`),
  KEY `challenge_questions_type_id` (`typeId`),
  KEY `challenge_questions_created_at` (`createdAt`),
  CONSTRAINT `ChallengeQuestions_ibfk_1` FOREIGN KEY (`challengeId`) REFERENCES `Challenges` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ChallengeQuestions_ibfk_2` FOREIGN KEY (`typeId`) REFERENCES `ChallengeQuestionTypes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9493340 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ChallengeResultItems`
--

DROP TABLE IF EXISTS `ChallengeResultItems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ChallengeResultItems` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `data` text,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `answerId` int(11) DEFAULT NULL,
  `questionId` int(11) DEFAULT NULL,
  `resultId` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `challenge_result_items_result_id` (`resultId`),
  KEY `challenge_result_items_question_id` (`questionId`),
  KEY `challenge_result_items_answer_id` (`answerId`),
  KEY `challenge_result_items_created_at` (`createdAt`),
  KEY `challenge_result_items_updated_at` (`updatedAt`),
  CONSTRAINT `ChallengeResultItems_ibfk_1` FOREIGN KEY (`answerId`) REFERENCES `ChallengeAnswers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ChallengeResultItems_ibfk_2` FOREIGN KEY (`questionId`) REFERENCES `ChallengeQuestions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ChallengeResultItems_ibfk_3` FOREIGN KEY (`resultId`) REFERENCES `ChallengeResults` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1743102 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ChallengeResults`
--

DROP TABLE IF EXISTS `ChallengeResults`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ChallengeResults` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `points` int(11) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `challengeId` int(11) DEFAULT NULL,
  `userId` int(11) DEFAULT NULL,
  `userTodoId` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `challenge_results_points` (`points`),
  KEY `challenge_results_challenge_id` (`challengeId`),
  KEY `challenge_results_user_id` (`userId`),
  KEY `challenge_results_created_at` (`createdAt`),
  KEY `challenge_results_updated_at` (`updatedAt`),
  KEY `challenge_results_user_todo_id` (`userTodoId`),
  CONSTRAINT `ChallengeResults_ibfk_1` FOREIGN KEY (`challengeId`) REFERENCES `Challenges` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ChallengeResults_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1293983 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Challenges`
--

DROP TABLE IF EXISTS `Challenges`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Challenges` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` enum('general','finish') NOT NULL,
  `title` varchar(100) NOT NULL,
  `instructions` varchar(5000) DEFAULT NULL,
  `finishText` varchar(1000) DEFAULT NULL,
  `notes` varchar(5000) DEFAULT NULL,
  `canUploadContent` tinyint(1) DEFAULT '0',
  `sequence` int(11) DEFAULT NULL,
  `points` int(11) DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `questId` int(11) DEFAULT NULL,
  `todoId` int(11) DEFAULT NULL,
  `slug` varchar(255) DEFAULT NULL,
  `publishedAt` datetime DEFAULT NULL,
  `finishUploadText` varchar(1000) DEFAULT NULL,
  `finishDownloadText` varchar(1000) DEFAULT NULL,
  `finishLinkText` varchar(1000) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `challenges_title` (`title`),
  KEY `challenges_type` (`type`),
  KEY `challenges_sequence` (`sequence`),
  KEY `challenges_quest_id` (`questId`),
  KEY `challenges_points` (`points`),
  KEY `challenges_todo_id` (`todoId`),
  CONSTRAINT `Challenges_ibfk_1` FOREIGN KEY (`questId`) REFERENCES `Quests` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14970359 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ClientClientRoles`
--

DROP TABLE IF EXISTS `ClientClientRoles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ClientClientRoles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `clientId` int(11) DEFAULT NULL,
  `roleId` int(11) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `client_client_roles_client_id_role_id` (`clientId`,`roleId`),
  KEY `roleId` (`roleId`),
  CONSTRAINT `ClientClientRoles_ibfk_1` FOREIGN KEY (`clientId`) REFERENCES `Clients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ClientClientRoles_ibfk_2` FOREIGN KEY (`roleId`) REFERENCES `ClientRoles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2761 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ClientRoles`
--

DROP TABLE IF EXISTS `ClientRoles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ClientRoles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `client_roles_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ClientUsers`
--

DROP TABLE IF EXISTS `ClientUsers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ClientUsers` (
  `userId` int(11) NOT NULL DEFAULT '0',
  `clientId` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`userId`,`clientId`),
  KEY `client_users_client_id` (`clientId`),
  KEY `client_users_user_id` (`userId`),
  CONSTRAINT `ClientUsers_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ClientUsers_ibfk_2` FOREIGN KEY (`clientId`) REFERENCES `Clients` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Clients`
--

DROP TABLE IF EXISTS `Clients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Clients` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `seats` int(11) NOT NULL DEFAULT '0',
  `parentId` int(11) DEFAULT NULL,
  `allowCreateClient` tinyint(1) NOT NULL DEFAULT '0',
  `trialClientSeats` int(11) NOT NULL DEFAULT '0',
  `maxLicenseSeats` int(11) NOT NULL DEFAULT '0',
  `headerColor` varchar(20) DEFAULT NULL,
  `headerFontColor` varchar(20) DEFAULT NULL,
  `backgroundColor` varchar(20) DEFAULT NULL,
  `logoImageUrl` varchar(200) DEFAULT NULL,
  `buddyLabel` varchar(100) DEFAULT NULL,
  `badgeLabel` varchar(100) DEFAULT NULL,
  `backgroundFontColor` varchar(20) DEFAULT NULL,
  `loginImageUrl` varchar(200) DEFAULT NULL,
  `logoAlignment` enum('left','center','right') DEFAULT NULL,
  `trialLicenseSeats` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `clients_name` (`name`),
  KEY `clients_deleted_at` (`deletedAt`),
  KEY `clients_slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=351 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Communications`
--

DROP TABLE IF EXISTS `Communications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Communications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `status` enum('ok','error') DEFAULT 'ok',
  `ref` varchar(50) DEFAULT NULL,
  `refId` int(11) DEFAULT NULL,
  `message` varchar(1000) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `communications_status` (`status`),
  KEY `communications_ref_ref_id` (`ref`,`refId`)
) ENGINE=InnoDB AUTO_INCREMENT=1308 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `DimDates`
--

DROP TABLE IF EXISTS `DimDates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `DimDates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `date` datetime NOT NULL,
  `fullDateUK` char(10) NOT NULL,
  `fullDateUSA` char(10) NOT NULL,
  `dayOfMonth` varchar(2) NOT NULL,
  `daySuffix` varchar(4) NOT NULL,
  `dayName` varchar(9) NOT NULL,
  `dayOfWeekUSA` char(1) NOT NULL,
  `dayOfWeekUK` char(1) NOT NULL,
  `dayOfWeekInMonth` varchar(2) NOT NULL,
  `dayOfWeekInYear` varchar(2) NOT NULL,
  `dayOfQuarter` varchar(3) NOT NULL,
  `dayOfYear` varchar(3) NOT NULL,
  `weekOfMonth` varchar(1) NOT NULL,
  `weekOfQuarter` varchar(2) NOT NULL,
  `weekOfYear` varchar(2) NOT NULL,
  `month` varchar(2) NOT NULL,
  `monthName` varchar(9) NOT NULL,
  `monthOfQuarter` varchar(2) NOT NULL,
  `quarter` char(1) NOT NULL,
  `quarterName` varchar(9) NOT NULL,
  `year` char(4) NOT NULL,
  `yearName` char(7) NOT NULL,
  `monthYear` char(10) NOT NULL,
  `mmyyyy` char(6) NOT NULL,
  `firstDayOfMonth` datetime NOT NULL,
  `lastDayOfMonth` datetime NOT NULL,
  `firstDayOfQuarter` datetime NOT NULL,
  `lastDayOfQuarter` datetime NOT NULL,
  `firstDayOfYear` datetime NOT NULL,
  `lastDayOfYear` datetime NOT NULL,
  `isHolidayUSA` tinyint(1) NOT NULL,
  `isWeekday` tinyint(1) NOT NULL,
  `holidayUSA` varchar(50) NOT NULL,
  `isHolidayUK` tinyint(1) NOT NULL,
  `holidayUK` varchar(50) NOT NULL,
  `fiscalDayOfYear` varchar(3) NOT NULL,
  `fiscalWeekOfYear` varchar(3) NOT NULL,
  `fiscalMonth` varchar(2) NOT NULL,
  `fiscalQuarter` char(1) NOT NULL,
  `fiscalQuarterName` varchar(9) NOT NULL,
  `fiscalYear` char(4) NOT NULL,
  `fiscalYearName` char(7) NOT NULL,
  `fiscalMonthYear` char(10) NOT NULL,
  `fiscalMMYYYY` char(6) NOT NULL,
  `fiscalFirstDayOfMonth` datetime NOT NULL,
  `fiscalLastDayOfMonth` datetime NOT NULL,
  `fiscalFirstDayOfQuarter` datetime NOT NULL,
  `fiscalLastDayOfQuarter` datetime NOT NULL,
  `fiscalFirstDayOfYear` datetime NOT NULL,
  `fiscalLastDayOfYear` datetime NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20251232 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Emails`
--

DROP TABLE IF EXISTS `Emails`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Emails` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `status` enum('new','sent','na') DEFAULT 'new',
  `subject` varchar(1000) DEFAULT NULL,
  `to` varchar(250) DEFAULT NULL,
  `cc` varchar(1000) DEFAULT NULL,
  `from` varchar(250) DEFAULT NULL,
  `html` text,
  `text` text,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `emails_status` (`status`),
  KEY `emails_to` (`to`),
  KEY `emails_from` (`from`),
  KEY `emails_updated_at` (`updatedAt`)
) ENGINE=InnoDB AUTO_INCREMENT=1287 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Encodings`
--

DROP TABLE IF EXISTS `Encodings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Encodings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `status` enum('pending','encoding','ready','error') DEFAULT 'pending',
  `ref` varchar(50) DEFAULT NULL,
  `type` varchar(20) DEFAULT NULL,
  `error` varchar(1000) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `encodings_status` (`status`),
  KEY `encodings_ref` (`ref`),
  KEY `encodings_type` (`type`)
) ENGINE=InnoDB AUTO_INCREMENT=5596 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `EngagementMetrics`
--

DROP TABLE IF EXISTS `EngagementMetrics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `EngagementMetrics` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `jems` int(10) unsigned DEFAULT NULL,
  `points` int(10) unsigned DEFAULT NULL,
  `bonus` int(10) unsigned DEFAULT NULL,
  `multiplier` int(10) unsigned DEFAULT NULL,
  `earnedPoints` int(10) unsigned DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `userId` int(11) DEFAULT NULL,
  `metricId` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `metricId` (`metricId`),
  CONSTRAINT `EngagementMetrics_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `QuestUsers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `EngagementMetrics_ibfk_2` FOREIGN KEY (`metricId`) REFERENCES `QuestUsers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `FactProgramUserCompletedItems`
--

DROP TABLE IF EXISTS `FactProgramUserCompletedItems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `FactProgramUserCompletedItems` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `levelLastCompleted` int(11) DEFAULT NULL,
  `questLastCompleted` int(11) DEFAULT NULL,
  `challengeLastCompleted` int(11) DEFAULT NULL,
  `todoLastCompleted` int(11) DEFAULT NULL,
  `programLinkId` int(11) DEFAULT NULL,
  `userId` int(11) DEFAULT NULL,
  `dimDateId` int(11) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `badgeLastEarned` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `dimDateId` (`dimDateId`),
  KEY `FactProgramUserCompletedItems_program_user_date` (`programLinkId`,`userId`,`dimDateId`),
  CONSTRAINT `FactProgramUserCompletedItems_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FactProgramUserCompletedItems_ibfk_2` FOREIGN KEY (`dimDateId`) REFERENCES `DimDates` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=49820 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `FactProgramUserCompletedItemsIntraday`
--

DROP TABLE IF EXISTS `FactProgramUserCompletedItemsIntraday`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `FactProgramUserCompletedItemsIntraday` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `levelLastCompleted` int(11) DEFAULT NULL,
  `questLastCompleted` int(11) DEFAULT NULL,
  `challengeLastCompleted` int(11) DEFAULT NULL,
  `todoLastCompleted` int(11) DEFAULT NULL,
  `programLinkId` int(11) DEFAULT NULL,
  `userId` int(11) DEFAULT NULL,
  `dimDateId` int(11) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `badgeLastEarned` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `dimDateId` (`dimDateId`),
  KEY `FactProgramUserCompletedItemsIntraday_program_user_date` (`programLinkId`,`userId`,`dimDateId`),
  CONSTRAINT `FactProgramUserCompletedItemsIntraday_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FactProgramUserCompletedItemsIntraday_ibfk_2` FOREIGN KEY (`dimDateId`) REFERENCES `DimDates` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=861 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `FactProgramUserStats`
--

DROP TABLE IF EXISTS `FactProgramUserStats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `FactProgramUserStats` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `levelsCompletedCount` int(11) NOT NULL DEFAULT '0',
  `levelsCompletedPoints` int(11) NOT NULL DEFAULT '0',
  `questsCompletedCount` int(11) NOT NULL DEFAULT '0',
  `questsCompletedPoints` int(11) NOT NULL DEFAULT '0',
  `challengesCompletedCount` int(11) NOT NULL DEFAULT '0',
  `challengesCompletedPoints` int(11) NOT NULL DEFAULT '0',
  `challenges1stAttemptCorrectCount` int(11) NOT NULL DEFAULT '0',
  `todosCompletedCount` int(11) NOT NULL DEFAULT '0',
  `todosCompletedPoints` int(11) NOT NULL DEFAULT '0',
  `totalBasePoints` int(11) NOT NULL DEFAULT '0',
  `programLinkId` int(11) DEFAULT NULL,
  `userId` int(11) DEFAULT NULL,
  `dimDateId` int(11) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `badgesEarnedCount` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `dimDateId` (`dimDateId`),
  KEY `FactProgramUserStats_program_user_date` (`programLinkId`,`userId`,`dimDateId`),
  CONSTRAINT `FactProgramUserStats_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FactProgramUserStats_ibfk_2` FOREIGN KEY (`dimDateId`) REFERENCES `DimDates` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=49839 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `FactProgramUserStatsIntraday`
--

DROP TABLE IF EXISTS `FactProgramUserStatsIntraday`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `FactProgramUserStatsIntraday` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `levelsCompletedCount` int(11) NOT NULL DEFAULT '0',
  `levelsCompletedPoints` int(11) NOT NULL DEFAULT '0',
  `questsCompletedCount` int(11) NOT NULL DEFAULT '0',
  `questsCompletedPoints` int(11) NOT NULL DEFAULT '0',
  `challengesCompletedCount` int(11) NOT NULL DEFAULT '0',
  `challengesCompletedPoints` int(11) NOT NULL DEFAULT '0',
  `challenges1stAttemptCorrectCount` int(11) NOT NULL DEFAULT '0',
  `todosCompletedCount` int(11) NOT NULL DEFAULT '0',
  `todosCompletedPoints` int(11) NOT NULL DEFAULT '0',
  `totalBasePoints` int(11) NOT NULL DEFAULT '0',
  `programLinkId` int(11) DEFAULT NULL,
  `userId` int(11) DEFAULT NULL,
  `dimDateId` int(11) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `badgesEarnedCount` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `dimDateId` (`dimDateId`),
  KEY `FactProgramUserStatsIntraday_program_user_date` (`programLinkId`,`userId`,`dimDateId`),
  CONSTRAINT `FactProgramUserStatsIntraday_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FactProgramUserStatsIntraday_ibfk_2` FOREIGN KEY (`dimDateId`) REFERENCES `DimDates` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=861 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ForumItemCategories`
--

DROP TABLE IF EXISTS `ForumItemCategories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ForumItemCategories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(150) DEFAULT NULL,
  `description` varchar(1000) DEFAULT NULL,
  `forumId` int(11) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `forum_item_categories_name` (`name`),
  KEY `forum_item_categories_created_at` (`createdAt`),
  KEY `forum_item_categories_updated_at` (`updatedAt`),
  KEY `forum_item_categories_forum_id` (`forumId`),
  CONSTRAINT `ForumItemCategories_ibfk_1` FOREIGN KEY (`forumId`) REFERENCES `Forums` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8499 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ForumItemDislikes`
--

DROP TABLE IF EXISTS `ForumItemDislikes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ForumItemDislikes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `forumItemId` int(11) DEFAULT NULL,
  `createdById` int(11) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `createdAgainstId` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `forum_item_dislikes_forum_item_id` (`forumItemId`),
  KEY `forum_item_dislikes_created_by_id` (`createdById`),
  KEY `forum_item_dislikes_created_at` (`createdAt`),
  KEY `forum_item_dislikes_updated_at` (`updatedAt`),
  CONSTRAINT `ForumItemDislikes_ibfk_1` FOREIGN KEY (`forumItemId`) REFERENCES `ForumItems` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ForumItemDislikes_ibfk_2` FOREIGN KEY (`createdById`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=94 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ForumItemLikes`
--

DROP TABLE IF EXISTS `ForumItemLikes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ForumItemLikes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `forumItemId` int(11) DEFAULT NULL,
  `createdById` int(11) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `createdAgainstId` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `forum_item_likes_forum_item_id` (`forumItemId`),
  KEY `forum_item_likes_created_by_id` (`createdById`),
  KEY `forum_item_likes_created_at` (`createdAt`),
  KEY `forum_item_likes_updated_at` (`updatedAt`),
  CONSTRAINT `ForumItemLikes_ibfk_1` FOREIGN KEY (`forumItemId`) REFERENCES `ForumItems` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ForumItemLikes_ibfk_2` FOREIGN KEY (`createdById`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13625 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ForumItemMedia`
--

DROP TABLE IF EXISTS `ForumItemMedia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ForumItemMedia` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` enum('text','link','image','video','audio','resource') NOT NULL,
  `status` enum('ready','encoding') DEFAULT 'ready',
  `source` varchar(50) DEFAULT NULL,
  `ref` varchar(50) DEFAULT NULL,
  `data` text,
  `name` varchar(500) DEFAULT NULL,
  `description` varchar(5000) DEFAULT NULL,
  `coverUrl` varchar(200) DEFAULT NULL,
  `sourceDate` datetime DEFAULT NULL,
  `sequence` int(11) DEFAULT NULL,
  `forumItemId` int(11) DEFAULT NULL,
  `userId` int(11) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `forumItemId` (`forumItemId`),
  KEY `userId` (`userId`),
  CONSTRAINT `ForumItemMedia_ibfk_1` FOREIGN KEY (`forumItemId`) REFERENCES `ForumItems` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ForumItemMedia_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=557 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ForumItemUsers`
--

DROP TABLE IF EXISTS `ForumItemUsers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ForumItemUsers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `forumItemId` int(11) DEFAULT NULL,
  `userId` int(11) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `forumItemId` (`forumItemId`),
  KEY `userId` (`userId`),
  CONSTRAINT `ForumItemUsers_ibfk_1` FOREIGN KEY (`forumItemId`) REFERENCES `ForumItems` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ForumItemUsers_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7990 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ForumItems`
--

DROP TABLE IF EXISTS `ForumItems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ForumItems` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` enum('topic','comment') NOT NULL,
  `title` varchar(5000) DEFAULT NULL,
  `content` text,
  `contentLink` varchar(150) DEFAULT NULL,
  `contentLinkType` enum('image','video','audio') DEFAULT NULL,
  `parentId` int(11) DEFAULT NULL,
  `forumId` int(11) DEFAULT NULL,
  `questId` int(11) DEFAULT NULL,
  `categoryId` int(11) DEFAULT NULL,
  `createdById` int(11) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `createdAgainstId` int(11) DEFAULT NULL,
  `challengeId` int(11) DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `subType` enum('encouragement','appreciation','story') DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `forum_items_type` (`type`),
  KEY `forum_items_content_link_type` (`contentLinkType`),
  KEY `forum_items_parent_id` (`parentId`),
  KEY `forum_items_forum_id` (`forumId`),
  KEY `forum_items_quest_id` (`questId`),
  KEY `forum_items_category_id` (`categoryId`),
  KEY `forum_items_created_by_id` (`createdById`),
  KEY `forum_items_created_at` (`createdAt`),
  KEY `forum_items_updated_at` (`updatedAt`),
  CONSTRAINT `ForumItems_ibfk_1` FOREIGN KEY (`parentId`) REFERENCES `ForumItems` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ForumItems_ibfk_2` FOREIGN KEY (`forumId`) REFERENCES `Forums` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ForumItems_ibfk_3` FOREIGN KEY (`questId`) REFERENCES `Quests` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ForumItems_ibfk_4` FOREIGN KEY (`categoryId`) REFERENCES `ForumItemCategories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ForumItems_ibfk_5` FOREIGN KEY (`createdById`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=211675 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Forums`
--

DROP TABLE IF EXISTS `Forums`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Forums` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(150) DEFAULT NULL,
  `newTopicPoints` int(11) DEFAULT NULL,
  `newCommentPoints` int(11) DEFAULT NULL,
  `likePoints` int(11) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `topicCommentPoints` int(11) DEFAULT NULL,
  `itemLikePoints` int(11) DEFAULT NULL,
  `linkId` int(11) NOT NULL,
  `newTopicPointsMax` int(11) DEFAULT NULL,
  `newCommentPointsMax` int(11) DEFAULT NULL,
  `likePointsMax` int(11) DEFAULT NULL,
  `topicCommentPointsMax` int(11) DEFAULT NULL,
  `itemLikePointsMax` int(11) DEFAULT NULL,
  `newEncouragePoints` int(11) DEFAULT NULL,
  `newAppreciatePoints` int(11) DEFAULT NULL,
  `newStoryPoints` int(11) DEFAULT NULL,
  `newEncouragePointsMax` int(11) DEFAULT NULL,
  `newAppreciatePointsMax` int(11) DEFAULT NULL,
  `newStoryPointsMax` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `forums_name` (`name`),
  KEY `forums_created_at` (`createdAt`),
  KEY `forums_updated_at` (`updatedAt`)
) ENGINE=InnoDB AUTO_INCREMENT=2666 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Histories`
--

DROP TABLE IF EXISTS `Histories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Histories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `programId` int(11) DEFAULT NULL,
  `comment` text,
  `details` text,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `userId` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `histories_user_id` (`userId`),
  KEY `histories_created_at` (`createdAt`),
  KEY `histories_updated_at` (`updatedAt`),
  KEY `histories_program_id` (`programId`),
  CONSTRAINT `Histories_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Histories_ibfk_2` FOREIGN KEY (`programId`) REFERENCES `Programs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=167641 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Levels`
--

DROP TABLE IF EXISTS `Levels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Levels` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(100) NOT NULL,
  `sequence` int(11) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `programId` int(11) DEFAULT NULL,
  `sequencingTypeId` int(11) NOT NULL,
  `sequencingParameters` varchar(200) DEFAULT NULL,
  `slug` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `levels_title` (`title`),
  KEY `levels_sequence` (`sequence`),
  KEY `levels_program_id` (`programId`),
  KEY `levels_created_at` (`createdAt`),
  CONSTRAINT `Levels_ibfk_1` FOREIGN KEY (`programId`) REFERENCES `Programs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=400011 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Lookups`
--

DROP TABLE IF EXISTS `Lookups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Lookups` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `lookup_type` varchar(100) NOT NULL,
  `lookup_value` varchar(100) NOT NULL,
  `sequence` int(10) unsigned NOT NULL DEFAULT '1',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Temporary view structure for view `PollResults`
--

DROP TABLE IF EXISTS `PollResults`;
/*!50001 DROP VIEW IF EXISTS `PollResults`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE VIEW `PollResults` AS SELECT 
 1 AS `questionId`,
 1 AS `answerId`,
 1 AS `userId`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `ProgramLicenses`
--

DROP TABLE IF EXISTS `ProgramLicenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ProgramLicenses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` enum('readOnly','edit') NOT NULL,
  `linkId` int(11) DEFAULT NULL,
  `licensedProgramId` int(11) DEFAULT NULL,
  `seats` int(11) NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `linkId` (`linkId`),
  KEY `licensedProgramId` (`licensedProgramId`),
  CONSTRAINT `ProgramLicenses_ibfk_2` FOREIGN KEY (`licensedProgramId`) REFERENCES `Programs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=575 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ProgramUserAssociationTypes`
--

DROP TABLE IF EXISTS `ProgramUserAssociationTypes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ProgramUserAssociationTypes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` varchar(150) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `program_user_association_types_type` (`type`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ProgramUserAssociations`
--

DROP TABLE IF EXISTS `ProgramUserAssociations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ProgramUserAssociations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `programUserId` int(11) DEFAULT NULL,
  `associatedProgramUserId` int(11) DEFAULT NULL,
  `typeId` int(11) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `typeId` (`typeId`),
  KEY `program_user_associations_program_user_id` (`programUserId`),
  KEY `program_user_associations_associated_program_user_id` (`associatedProgramUserId`),
  CONSTRAINT `ProgramUserAssociations_ibfk_1` FOREIGN KEY (`programUserId`) REFERENCES `ProgramUsers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ProgramUserAssociations_ibfk_2` FOREIGN KEY (`associatedProgramUserId`) REFERENCES `ProgramUsers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ProgramUserAssociations_ibfk_3` FOREIGN KEY (`typeId`) REFERENCES `ProgramUserAssociationTypes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5435 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ProgramUserGroupUsers`
--

DROP TABLE IF EXISTS `ProgramUserGroupUsers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ProgramUserGroupUsers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `programUserId` int(11) DEFAULT NULL,
  `programUserGroupId` int(11) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `programUserId` (`programUserId`),
  KEY `programUserGroupId` (`programUserGroupId`),
  CONSTRAINT `ProgramUserGroupUsers_ibfk_1` FOREIGN KEY (`programUserId`) REFERENCES `ProgramUsers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ProgramUserGroupUsers_ibfk_2` FOREIGN KEY (`programUserGroupId`) REFERENCES `ProgramUserGroups` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3584 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ProgramUserGroups`
--

DROP TABLE IF EXISTS `ProgramUserGroups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ProgramUserGroups` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(36) DEFAULT NULL,
  `ownerId` int(11) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ownerId` (`ownerId`),
  CONSTRAINT `ProgramUserGroups_ibfk_1` FOREIGN KEY (`ownerId`) REFERENCES `ProgramUsers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=386 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Temporary view structure for view `ProgramUserStats`
--

DROP TABLE IF EXISTS `ProgramUserStats`;
/*!50001 DROP VIEW IF EXISTS `ProgramUserStats`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE VIEW `ProgramUserStats` AS SELECT 
 1 AS `date`,
 1 AS `dateDisplay`,
 1 AS `week`,
 1 AS `weekDisplay`,
 1 AS `month`,
 1 AS `monthName`,
 1 AS `monthYear`,
 1 AS `mmyyyy`,
 1 AS `monthDisplay`,
 1 AS `quarter`,
 1 AS `quarterName`,
 1 AS `quarterDisplay`,
 1 AS `year`,
 1 AS `yearName`,
 1 AS `yearDisplay`,
 1 AS `dimDateId`,
 1 AS `programLinkId`,
 1 AS `userId`,
 1 AS `userFirstName`,
 1 AS `userLastName`,
 1 AS `userFullName`,
 1 AS `levelsCompletedCount`,
 1 AS `levelsCompletedPoints`,
 1 AS `questsCompletedCount`,
 1 AS `questsCompletedPoints`,
 1 AS `challengesCompletedCount`,
 1 AS `challengesCompletedPoints`,
 1 AS `challenges1stAttemptCorrectCount`,
 1 AS `todosCompletedCount`,
 1 AS `todosCompletedPoints`,
 1 AS `totalBasePoints`,
 1 AS `badgesEarnedCount`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `ProgramUsers`
--

DROP TABLE IF EXISTS `ProgramUsers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ProgramUsers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `linkId` int(11) DEFAULT NULL,
  `userId` int(11) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `transactionId` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `linkId` (`linkId`),
  KEY `userId` (`userId`),
  CONSTRAINT `ProgramUsers_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=83055 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Programs`
--

DROP TABLE IF EXISTS `Programs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Programs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `slug` varchar(100) NOT NULL,
  `status` enum('ready','preview','autoSaved') DEFAULT 'ready',
  `linkId` int(11) DEFAULT NULL,
  `title` varchar(250) NOT NULL,
  `description` text,
  `imageRef` varchar(200) DEFAULT NULL,
  `published` datetime DEFAULT NULL,
  `sequence` int(11) DEFAULT NULL,
  `contentAuthor` varchar(200) DEFAULT NULL,
  `contentDescription` text,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `clientId` int(11) DEFAULT NULL,
  `contentProviderId` int(11) DEFAULT NULL,
  `createdById` int(11) DEFAULT NULL,
  `sequencingTypeId` int(11) NOT NULL,
  `sequencingParameters` varchar(200) DEFAULT NULL,
  `userBonusPointsBucket` int(11) DEFAULT NULL,
  `cancelMigrateResultsOnPublish` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `programs_link_id` (`linkId`),
  KEY `programs_slug` (`slug`),
  KEY `programs_status` (`status`),
  KEY `programs_title` (`title`),
  KEY `programs_published` (`published`),
  KEY `programs_sequence` (`sequence`),
  KEY `programs_created_by_id` (`createdById`),
  KEY `programs_client_id` (`clientId`),
  KEY `programs_content_provider_id` (`contentProviderId`),
  KEY `programs_created_at` (`createdAt`),
  KEY `programs_deleted_at` (`deletedAt`),
  CONSTRAINT `Programs_ibfk_1` FOREIGN KEY (`clientId`) REFERENCES `Clients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Programs_ibfk_2` FOREIGN KEY (`contentProviderId`) REFERENCES `Clients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Programs_ibfk_3` FOREIGN KEY (`createdById`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=174701 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`jubi`@`%`*/ /*!50003 TRIGGER program_slug_clientId_uniqueBy_linkId_beforeInsert BEFORE INSERT ON Programs
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
  END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`jubi`@`%`*/ /*!50003 TRIGGER program_slug_clientId_uniqueBy_linkId_beforeUpdate BEFORE UPDATE ON Programs
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
  END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `QuestUsers`
--

DROP TABLE IF EXISTS `QuestUsers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `QuestUsers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `startedDate` datetime DEFAULT NULL,
  `completedDate` datetime DEFAULT NULL,
  `unlocked` tinyint(1) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `questId` int(11) DEFAULT NULL,
  `userId` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `quest_users_started_date` (`startedDate`),
  KEY `quest_users_completed_date` (`completedDate`),
  KEY `quest_users_unlocked` (`unlocked`),
  KEY `quest_users_quest_id` (`questId`),
  KEY `quest_users_user_id` (`userId`),
  CONSTRAINT `QuestUsers_ibfk_1` FOREIGN KEY (`questId`) REFERENCES `Quests` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `QuestUsers_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Quests`
--

DROP TABLE IF EXISTS `Quests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Quests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(100) NOT NULL,
  `objective` varchar(1024) DEFAULT NULL,
  `backgroundImageRef` varchar(200) DEFAULT NULL,
  `featuredImageRef` varchar(200) DEFAULT NULL,
  `sequence` int(11) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `programId` int(11) DEFAULT NULL,
  `levelId` varchar(150) DEFAULT NULL,
  `publishedAt` datetime DEFAULT NULL,
  `slug` varchar(255) DEFAULT NULL,
  `type` char(1) NOT NULL DEFAULT 'L',
  `baseOrBonus` char(1) NOT NULL DEFAULT 'B',
  `inspireAvailableToUser` tinyint(1) NOT NULL DEFAULT '0',
  `storyAvailableToUser` tinyint(1) NOT NULL DEFAULT '0',
  `encourageAvailableToUser` tinyint(1) NOT NULL DEFAULT '0',
  `userAllowedMediaUpload` tinyint(1) NOT NULL DEFAULT '0',
  `inspirePoints` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `quests_title` (`title`),
  KEY `quests_sequence` (`sequence`),
  KEY `quests_program_id` (`programId`),
  KEY `quests_created_at` (`createdAt`),
  CONSTRAINT `Quests_ibfk_1` FOREIGN KEY (`programId`) REFERENCES `Programs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2540856 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Requires`
--

DROP TABLE IF EXISTS `Requires`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Requires` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `BadgeId` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `BadgeId` (`BadgeId`),
  KEY `requires_name` (`name`),
  CONSTRAINT `Requires_ibfk_1` FOREIGN KEY (`BadgeId`) REFERENCES `Badges` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ResetUsers`
--

DROP TABLE IF EXISTS `ResetUsers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ResetUsers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `resetKey` varchar(36) DEFAULT NULL,
  `completed` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `userId` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `reset_users_reset_key` (`resetKey`),
  KEY `reset_users_completed` (`completed`),
  KEY `reset_users_user_id` (`userId`),
  KEY `reset_users_created_at` (`createdAt`),
  KEY `reset_users_updated_at` (`updatedAt`),
  CONSTRAINT `ResetUsers_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Roles`
--

DROP TABLE IF EXISTS `Roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Roles` (
  `id` int(11) NOT NULL DEFAULT '0',
  `name` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `roles_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `SequelizeMeta`
--

DROP TABLE IF EXISTS `SequelizeMeta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `SequelizeMeta` (
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`name`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `SequencingTypes`
--

DROP TABLE IF EXISTS `SequencingTypes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `SequencingTypes` (
  `id` int(11) NOT NULL DEFAULT '0',
  `title` varchar(100) NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `sequencing_types_title` (`title`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `SystemConfigurations`
--

DROP TABLE IF EXISTS `SystemConfigurations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `SystemConfigurations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `key` varchar(100) NOT NULL,
  `value` varchar(5000) NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=89 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `TodoRequirements`
--

DROP TABLE IF EXISTS `TodoRequirements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `TodoRequirements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `requirementRef` varchar(30) NOT NULL,
  `requirementRefId` int(11) NOT NULL,
  `todoId` int(11) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `todoId` (`todoId`),
  CONSTRAINT `TodoRequirements_ibfk_1` FOREIGN KEY (`todoId`) REFERENCES `Todos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=383169 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Todos`
--

DROP TABLE IF EXISTS `Todos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Todos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(100) NOT NULL,
  `instructions` varchar(1024) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `programId` int(11) DEFAULT NULL,
  `points` int(11) DEFAULT NULL,
  `dueByUser` tinyint(1) DEFAULT NULL,
  `dueDate` datetime DEFAULT NULL,
  `resourceUrl` varchar(255) DEFAULT NULL,
  `resourceName` varchar(255) DEFAULT NULL,
  `resourceDescription` varchar(1000) DEFAULT NULL,
  `validate` tinyint(1) DEFAULT NULL,
  `verificationInstructions` varchar(1024) DEFAULT NULL,
  `publishedAt` datetime DEFAULT NULL,
  `slug` varchar(255) DEFAULT NULL,
  `questId` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `programId` (`programId`),
  KEY `todos_due_date` (`dueDate`),
  KEY `Todos_quest_idx` (`questId`),
  CONSTRAINT `Todos_ibfk_1` FOREIGN KEY (`programId`) REFERENCES `Programs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Todos_quest` FOREIGN KEY (`questId`) REFERENCES `Quests` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=624175 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `UserBadgeRequirementsFulfillments`
--

DROP TABLE IF EXISTS `UserBadgeRequirementsFulfillments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `UserBadgeRequirementsFulfillments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `fulfilled` tinyint(1) NOT NULL,
  `userBadgeId` int(11) DEFAULT NULL,
  `badgeRequirementId` int(11) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `userBadgeId` (`userBadgeId`),
  KEY `badgeRequirementId` (`badgeRequirementId`),
  CONSTRAINT `UserBadgeRequirementsFulfillments_ibfk_1` FOREIGN KEY (`userBadgeId`) REFERENCES `UserBadges` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `UserBadgeRequirementsFulfillments_ibfk_2` FOREIGN KEY (`badgeRequirementId`) REFERENCES `BadgeRequirements` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=115798 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `UserBadges`
--

DROP TABLE IF EXISTS `UserBadges`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `UserBadges` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `badgeId` int(11) DEFAULT NULL,
  `userId` int(11) DEFAULT NULL,
  `earned` tinyint(1) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `awarded` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `badgeId` (`badgeId`),
  KEY `userId` (`userId`),
  CONSTRAINT `UserBadges_ibfk_1` FOREIGN KEY (`badgeId`) REFERENCES `Badges` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `UserBadges_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=132259 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `UserChallengeMedia`
--

DROP TABLE IF EXISTS `UserChallengeMedia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `UserChallengeMedia` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` enum('text','link','image','video','audio','resource') NOT NULL,
  `status` enum('ready','encoding') DEFAULT 'ready',
  `source` varchar(50) DEFAULT NULL,
  `ref` varchar(50) DEFAULT NULL,
  `data` text,
  `name` varchar(500) DEFAULT NULL,
  `description` varchar(5000) DEFAULT NULL,
  `coverUrl` varchar(200) DEFAULT NULL,
  `sourceDate` datetime DEFAULT NULL,
  `sequence` int(11) DEFAULT NULL,
  `challengeId` int(11) DEFAULT NULL,
  `userId` int(11) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `userTodoId` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `challengeId` (`challengeId`),
  KEY `userId` (`userId`),
  KEY `user_challenge_media_user_todo_id` (`userTodoId`),
  CONSTRAINT `UserChallengeMedia_ibfk_1` FOREIGN KEY (`challengeId`) REFERENCES `Challenges` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `UserChallengeMedia_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8368 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `UserPollAnswers`
--

DROP TABLE IF EXISTS `UserPollAnswers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `UserPollAnswers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pollCount` int(11) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `challengeAnswerId` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_poll_answers_challenge_answer_id` (`challengeAnswerId`),
  CONSTRAINT `UserPollAnswers_ibfk_1` FOREIGN KEY (`challengeAnswerId`) REFERENCES `ChallengeAnswers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `UserRoles`
--

DROP TABLE IF EXISTS `UserRoles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `UserRoles` (
  `userId` int(11) NOT NULL DEFAULT '0',
  `roleId` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`userId`,`roleId`),
  KEY `user_roles_user_id` (`userId`),
  KEY `user_roles_role_id` (`roleId`),
  CONSTRAINT `UserRoles_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `UserRoles_ibfk_2` FOREIGN KEY (`roleId`) REFERENCES `Roles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `UserTodoRequirementsFulfillments`
--

DROP TABLE IF EXISTS `UserTodoRequirementsFulfillments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `UserTodoRequirementsFulfillments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `fulfilled` tinyint(1) NOT NULL,
  `userTodoId` int(11) DEFAULT NULL,
  `todoRequirementId` int(11) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `userTodoId` (`userTodoId`),
  KEY `todoRequirementId` (`todoRequirementId`),
  CONSTRAINT `UserTodoRequirementsFulfillments_ibfk_1` FOREIGN KEY (`userTodoId`) REFERENCES `UserTodos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `UserTodoRequirementsFulfillments_ibfk_2` FOREIGN KEY (`todoRequirementId`) REFERENCES `TodoRequirements` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=181782 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `UserTodos`
--

DROP TABLE IF EXISTS `UserTodos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `UserTodos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `todoId` int(11) DEFAULT NULL,
  `userId` int(11) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `status` enum('locked','unlocked','submitted','verified','completed') DEFAULT NULL,
  `dueDate` datetime DEFAULT NULL,
  `hasBeenCompleted` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `todoId` (`todoId`),
  KEY `userId` (`userId`),
  CONSTRAINT `UserTodos_ibfk_1` FOREIGN KEY (`todoId`) REFERENCES `Todos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `UserTodos_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=331922 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Users`
--

DROP TABLE IF EXISTS `Users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `firstName` varchar(50) DEFAULT NULL,
  `lastName` varchar(50) DEFAULT NULL,
  `title` varchar(50) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(100) DEFAULT NULL,
  `avatarUrl` varchar(255) DEFAULT NULL,
  `tzOffset` int(11) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `tempToken` varchar(150) DEFAULT NULL,
  `why` varchar(150) DEFAULT NULL,
  `destination` varchar(150) DEFAULT NULL,
  `pendingEmail` varchar(255) DEFAULT NULL,
  `securityCode` varchar(50) DEFAULT NULL,
  `securityCodeCreatedAt` varchar(50) DEFAULT NULL,
  `accessToken` varchar(50) DEFAULT NULL,
  `accessTokenCreatedAt` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `users_first_name` (`firstName`),
  KEY `users_last_name` (`lastName`),
  KEY `users_first_name_last_name` (`firstName`,`lastName`),
  KEY `users_title` (`title`),
  KEY `users_email` (`email`),
  KEY `users_created_at` (`createdAt`),
  KEY `users_updated_at` (`updatedAt`),
  KEY `users_deleted_at` (`deletedAt`),
  KEY `users_temp_token` (`tempToken`)
) ENGINE=InnoDB AUTO_INCREMENT=22793 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `userChallengeAnswers`
--

DROP TABLE IF EXISTS `userChallengeAnswers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `userChallengeAnswers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `answer` varchar(5000) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `challengeQuestionId` int(11) DEFAULT NULL,
  `userId` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_challenge_answers_challenge_question_id` (`challengeQuestionId`),
  KEY `user_challenge_answers_user_id` (`userId`),
  CONSTRAINT `userChallengeAnswers_ibfk_1` FOREIGN KEY (`challengeQuestionId`) REFERENCES `ChallengeQuestions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `userChallengeAnswers_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `zzzNewToDoQuests`
--

DROP TABLE IF EXISTS `zzzNewToDoQuests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `zzzNewToDoQuests` (
  `toDoId` int(11) DEFAULT NULL,
  `levelId` varchar(150) CHARACTER SET utf8 DEFAULT NULL,
  `sequence` int(11) DEFAULT NULL,
  `programId` int(11) DEFAULT NULL,
  `questId` int(11) NOT NULL DEFAULT '0',
  KEY `toDoId` (`toDoId`),
  KEY `sequence` (`sequence`),
  KEY `levelId` (`levelId`),
  KEY `questId` (`questId`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping events for database 'jubi'
--

--
-- Dumping routines for database 'jubi'
--
/*!50003 DROP FUNCTION IF EXISTS `get_current_program_id` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE' */ ;
DELIMITER ;;
CREATE DEFINER=`jubi`@`%` FUNCTION `get_current_program_id`(linkId INT, preview INT) RETURNS int(11)
BEGIN

  SELECT P.id INTO @result
  FROM Programs P
  WHERE
    P.linkId=linkId AND
    (preview<>0 OR (preview=0 AND P.status='ready'))
  ORDER BY P.createdAt DESC
  LIMIT 1;

  RETURN @result;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `get_program_link_id` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`jubi`@`%` FUNCTION `get_program_link_id`(ref VARCHAR(100)) RETURNS int(11)
BEGIN

  SELECT P.linkId INTO @result
  FROM Programs P
  WHERE
    P.slug=ref OR
    P.linkId=ref
  LIMIT 1;

  RETURN IF(@result IS NULL, ref, @result);

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `get_program_major_version` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`jubi`@`%` FUNCTION `get_program_major_version`(linkId INT) RETURNS int(11)
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

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `get_program_minor_version` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`jubi`@`%` FUNCTION `get_program_minor_version`(linkId INT) RETURNS int(11)
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

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `get_published_program_id` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`jubi`@`%` FUNCTION `get_published_program_id`(linkId INT) RETURNS int(11)
BEGIN

    SELECT
        MAX(P.id) INTO @result
    FROM
        Programs P
    WHERE
        P.linkId = linkId
        AND P.status IN ('ready','preview')
        AND P.published IS NOT NULL;

    RETURN @result;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `get_completed_challenges` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`jubi`@`%` PROCEDURE `get_completed_challenges`(IN programId INT, IN userId INT)
BEGIN

    -- Completed Challenges linked to Quests
    SELECT DISTINCT
        CR.challengeId
    FROM
        ChallengeResults CR
        INNER JOIN Challenges C ON C.id = CR.challengeId
        INNER JOIN Quests Q ON Q.id = C.questId
    WHERE
        CR.userId = userId
        AND Q.programId = programId

    UNION ALL

    -- Completed Challenges linked to Todos
    SELECT DISTINCT
        CR.challengeId
    FROM
        ChallengeResults CR
        INNER JOIN Challenges C ON C.id = CR.challengeId
        INNER JOIN Todos T ON T.id = C.todoId
    WHERE
        CR.userId = userId
        AND T.programId = programId

    ORDER BY
        challengeId;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `get_program` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`jubi`@`%` PROCEDURE `get_program`(IN ref VARCHAR(100), IN restore INT)
BEGIN

  SELECT get_program_link_id(ref) INTO @linkId;
  SELECT IF(restore > 0, restore, get_current_program_id(@linkId, 1)) INTO @id;

  SELECT
    P.id, P.linkId, P.slug, P.title, P.description, P.imageRef, P.published, P.createdAt,
    (SELECT COUNT(*) FROM Programs P2 WHERE P2.linkId=P.linkId) AS version,
    H.userId AS updatedById, U.firstName AS updatedByFirstName, U.lastName AS updatedByLastName,
    C.id AS clientId, C.slug AS clientSlug, C.name AS clientName, C.createdAt AS clientCreatedAt,

    P.contentAuthor, P.contentDescription,

    CP.id AS contentProviderId, CP.name AS contentProviderName,

    Q.id AS questId, Q.title AS questTitle, Q.objective AS questObjective,
    Q.backgroundImageRef AS questBackgroundImageRef, Q.featuredImageRef AS questFeaturedImageRef,

    CH.id AS challengeId, CH.type AS challengeType, CH.title AS challengeTitle,
    CH.instructions AS challengeInstructions, CH.finishText AS challengeFinishText, CH.notes AS challengeNotes,
    CH.canUploadContent AS challengeCanUploadContent, CH.points AS challengePoints,

    CQ.id AS questionId, CQ.question AS question,
    CQT.id AS questionTypeId, CQT.name AS questionTypeName,

    CA.id AS answerId, CA.answer, CA.correct AS answerCorrect,

    CM.id AS mediaId, CM.type AS mediaType, CM.data AS mediaData, CM.source AS mediaSource, CM.coverUrl AS mediaCoverUrl,
    CM.name AS mediaName, CM.description AS mediaDescription, CM.sourceDate AS mediaSourceDate, CM.ref AS mediaRef,

    (SELECT GROUP_CONCAT(E.type SEPARATOR ',') AS types FROM Encodings E WHERE E.ref=CM.ref AND E.status='ready' GROUP BY E.ref) AS mediaEncodings

  FROM Programs P
    JOIN Histories H ON H.programId=P.id
    JOIN Users U ON U.id=H.userId
    JOIN Clients C ON C.id=P.clientId
    LEFT OUTER JOIN ContentProviders CP ON CP.id=P.contentProviderId
    LEFT OUTER JOIN Quests Q ON Q.programId=P.id

    LEFT OUTER JOIN Challenges CH ON CH.questId=Q.id

    LEFT OUTER JOIN ChallengeQuestions CQ ON CQ.challengeId=CH.id
    LEFT OUTER JOIN ChallengeQuestionTypes CQT ON CQT.id=CQ.typeId

    LEFT OUTER JOIN ChallengeAnswers CA ON CA.questionId=CQ.id

    LEFT OUTER JOIN ChallengeMedia CM ON CM.challengeId=CH.id
  WHERE
    P.deletedAt IS NULL AND
    P.id=@id
  ORDER BY
    Q.sequence, Q.id, Q.createdAt DESC,
    CH.sequence, CH.id, CH.createdAt DESC,
    CQ.sequence, CQ.id, CQ.createdAt DESC,
    CA.sequence, CA.id, CA.createdAt DESC,
    CM.sequence, CM.id, CM.createdAt DESC;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `get_programs` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`jubi`@`%` PROCEDURE `get_programs`(IN userId INT, IN getAll INT)
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

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `get_programs_by_client` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE' */ ;
DELIMITER ;;
CREATE DEFINER=`jubi`@`%` PROCEDURE `get_programs_by_client`(IN clientId INT, IN getAll INT)
BEGIN

    SELECT
      P.id, P.linkId, P.slug, P.title, P.description, P.imageRef, P.published, P.createdAt, P.status,
      (SELECT COUNT(*) FROM Programs P2 WHERE (P2.status='ready' OR P2.status ='preview') AND P2.linkId=P.linkId AND P2.published IS NOT NULL) AS publishedVersion,
      (SELECT COUNT(*) FROM Programs P4 WHERE (P4.status='ready' OR P4.status ='preview') AND P4.linkId=P.linkId AND P4.published IS NULL && ( (P4.id > (SELECT MAX(P3.id) FROM Programs P3 WHERE (P3.status='ready' OR P3.status ='preview') AND P3.linkId=P.linkId AND P3.published IS NOT NULL) OR (NOT EXISTS (SELECT id FROM Programs P3 WHERE (P3.status='ready' OR P3.status ='preview') AND P3.linkId=P.linkId AND P3.published IS NOT NULL))))) AS version,
      H.userId AS updatedById,
      C.id AS clientId, C.slug AS clientSlug, C.name AS clientName,
      P.contentAuthor, P.contentDescription,
      CP.id AS contentProviderId, CP.name AS contentProviderName
    FROM Programs P
      JOIN Histories H ON H.ref='Programs' AND H.refId=P.id
      JOIN Clients C ON C.id=P.clientId
      LEFT OUTER JOIN Clients CP ON CP.id=P.contentProviderId
      LEFT OUTER JOIN ProgramLicenses PL ON PL.linkId = P.linkId
    WHERE P.id IN (
      SELECT MAX(P.id) FROM Programs P
        JOIN Clients C ON C.id=P.clientId
      WHERE
        P.deletedAt IS NULL AND
        C.id=clientId AND
        (getAll<>0 OR (getAll=0 AND P.published IS NOT NULL))
      GROUP BY P.linkId
    )
          AND (PL.id IS NULL OR PL.type = 'edit')
    GROUP BY P.linkId
    ORDER BY P.createdAt DESC;

  END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `get_programs_scoring` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`jubi`@`%` PROCEDURE `get_programs_scoring`(IN userId INT)
BEGIN

  SELECT
    P.id, P.linkId, P.title, P.description, P.imageRef, P.published, P.createdAt,
    (SELECT COUNT(*) FROM Programs P2 WHERE P2.linkId=P.linkId) AS version,
    H.userId AS updatedById, U.firstName AS updatedByFirstName, U.lastName AS updatedByLastName,
    C.id AS clientId, C.name AS clientName,
    P.contentAuthor, P.contentDescription,
    CP.id AS contentProviderId, CP.name AS contentProviderName,

    Q.id AS questId, Q.title AS questTitle, Q.objective AS questObjective,
    Q.backgroundImageRef AS questBackgroundImageRef, Q.featuredImageRef AS questFeaturedImageRef,

    CH.id AS challengeId, CH.type AS challengeType, CH.title AS challengeTitle, CH.points AS challengePoints,

    CQ.id AS questionId, CQ.question AS question,
    CQT.id AS questionTypeId, CQT.name AS questionTypeName

  FROM Programs P
    JOIN Histories H ON H.programId=P.id
    JOIN Users U ON U.id=H.userId
    JOIN Clients C ON C.id=P.clientId
    LEFT OUTER JOIN ContentProviders CP ON CP.id=P.contentProviderId
    LEFT OUTER JOIN Quests Q ON Q.programId=P.id
    LEFT OUTER JOIN Challenges CH ON CH.questId=Q.id AND CH.type<>'finish'
    LEFT OUTER JOIN ChallengeQuestions CQ ON CQ.challengeId=CH.id
    LEFT OUTER JOIN ChallengeQuestionTypes CQT ON CQT.id=CQ.typeId
  WHERE P.id IN (
    SELECT MAX(P.id) FROM Programs P
      JOIN Clients C ON C.id=P.clientId
      JOIN ClientUsers CU ON CU.clientId=C.id
    WHERE
      P.deletedAt IS NULL AND
      CU.userId=userId
    GROUP BY P.linkId
  )
  ORDER BY
    P.createdAt DESC, P.title,
    Q.sequence, Q.id, Q.createdAt DESC,
    CH.sequence, CH.id, CH.createdAt DESC,
    CQ.sequence, CQ.id, CQ.createdAt DESC;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `get_programs_user` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`jubi`@`%` PROCEDURE `get_programs_user`(IN userId INT, IN preview INT)
BEGIN

  SELECT
    P.id, P.linkId, P.slug, P.title, P.description, P.imageRef, P.published, P.createdAt,
    (SELECT COUNT(*) FROM Programs P2 WHERE P2.linkId=P.linkId) AS version,
    H.userId AS updatedById, U.firstName AS updatedByFirstName, U.lastName AS updatedByLastName,
    C.id AS clientId, C.slug AS clientSlug, C.name AS clientName,
    P.contentAuthor, P.contentDescription,
    CP.id AS contentProviderId, CP.name AS contentProviderName,

    Q.id AS questId, Q.title AS questTitle,
    Q.objective AS questObjective,
    Q.backgroundImageRef AS questBackgroundImageRef,
    Q.featuredImageRef AS questFeaturedImageRef,

    CH.id AS challengeId, CH.type AS challengeType,
    CH.title AS challengeTitle, CH.points AS challengePoints,

    CR.id AS resultId, CR.points AS resultPoints

  FROM Programs P
    JOIN Histories H ON H.programId=P.id
    JOIN Users U ON U.id=H.userId
    JOIN Clients C ON C.id=P.clientId
    LEFT OUTER JOIN ContentProviders CP ON CP.id=P.contentProviderId

    LEFT OUTER JOIN Quests Q ON Q.programId=P.id

    LEFT OUTER JOIN Challenges CH ON CH.questId=Q.id

    LEFT OUTER JOIN ChallengeResults CR ON CR.challengeId=CH.id

  WHERE
    P.id IN (
      SELECT MAX(P.id) FROM Programs P
        JOIN Clients C ON C.id=P.clientId
        JOIN ClientUsers CU ON CU.clientId=C.id
      WHERE
        P.deletedAt IS NULL AND
        CU.userId=userId
      GROUP BY P.linkId
    ) AND
    ((preview=0 AND P.published IS NOT NULL) OR preview<>0)
  ORDER BY
    P.linkId,
    P.createdAt DESC,
    Q.sequence, Q.id,
    CH.sequence, CH.id;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `get_program_history` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`jubi`@`%` PROCEDURE `get_program_history`(IN linkId INT, IN getCount INT)
BEGIN

  SELECT
    H.id, H.programId, H.comment, H.createdAt, H.updatedAt, 1 AS hello,
    U.id AS userId, U.firstName AS userFirstName, U.lastName AS userLastName,
    (
      SELECT COUNT(*) FROM Histories H
        JOIN Programs P ON P.id=H.programId AND P.linkId=linkId
      WHERE
        P.status='ready'
    ) AS totalCount
  FROM Histories H
    JOIN Programs P ON P.id=H.programId AND P.linkId=linkId
    JOIN Users U ON U.id=H.userId
  WHERE
    P.status='ready'
  ORDER BY H.updatedAt DESC
  LIMIT getCount;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `get_program_item_counts` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`jubi`@`%` PROCEDURE `get_program_item_counts`(IN programLinkId INT)
BEGIN

	-- Setup variables
	DECLARE currentProgramId INT;
	DECLARE levelsCount INT;
	DECLARE questsCount INT;
	DECLARE challengesCount INT;
	DECLARE challengesPoints INT;
	DECLARE todosCount INT;
	DECLARE todosPoints INT;
	DECLARE badgesCount INT;
	
    
	-- Get the current active Program Id
    SELECT
		MAX(id) INTO currentProgramId 
	FROM
		Programs
	WHERE
		linkId=programLinkId
	GROUP BY
		linkId;
    
    
    -- Get Levels count
    SELECT
		COUNT(*) INTO levelsCount
	FROM
		Levels
	WHERE
		programId = currentProgramId
	GROUP BY
		programId;
    
    
	-- Get Quests count
    SELECT
		COUNT(*) INTO questsCount
	FROM
		Quests
	WHERE
		programId = currentProgramId
	GROUP BY
		programId;
	
    
    -- Get Challenges count
    SELECT
		COUNT(*) INTO challengesCount
	FROM
		Challenges
        INNER JOIN Quests ON Quests.id = Challenges.questId
	WHERE
		Quests.programId = currentProgramId
	GROUP BY
		Quests.programId;
	
    
    -- Get Challenges points
    SELECT
		SUM(points) INTO challengesPoints
	FROM
		Challenges
        INNER JOIN Quests ON Quests.id = Challenges.questId
	WHERE
		Quests.programId = currentProgramId
	GROUP BY
		Quests.programId;
	
    
    -- Get Todos count
    SELECT
		COUNT(*) INTO todosCount
	FROM
		Todos
	WHERE
		programId = currentProgramId
        AND id IN (SELECT DISTINCT todoId FROM TodoRequirements)	-- Make sure the Todo can actually be completed.
	GROUP BY
		programId;


    -- Get Todos points
    SELECT
		SUM(points) INTO todosPoints
	FROM
		Todos
	WHERE
		programId = currentProgramId
        AND id IN (SELECT DISTINCT todoId FROM TodoRequirements)	-- Make sure the Todo can actually be completed.
	GROUP BY
		programId;
	
    
    -- Get Badges count
    SELECT
		COUNT(*) INTO badgesCount
	FROM
		Badges
	WHERE
		programId = currentProgramId
	GROUP BY
		programId;
    
    
    -- Final output
    SELECT
		currentProgramId,
        IFNULL(levelsCount, 0) AS levelsCount,
        IFNULL(questsCount, 0) AS questsCount,
        IFNULL(challengesCount, 0) AS challengesCount,
        IFNULL(challengesPoints, 0) AS challengesPoints,
        IFNULL(todosCount, 0) AS todosCount,
        IFNULL(todosPoints, 0) AS todosPoints,
        (IFNULL(challengesPoints, 0) + IFNULL(todosPoints, 0)) AS totalBasePoints,
        IFNULL(badgesCount, 0) AS badgesCount;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `get_program_levels` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`jubi`@`%` PROCEDURE `get_program_levels`(IN id INT)
BEGIN

  SELECT
    P.id, P.linkId, P.slug,
    L.id AS levelId, L.title AS levelTitle,
    Q.id AS questId
  FROM Programs P
    JOIN Levels L ON L.programId=P.id
    JOIN LevelQuests LQ ON LQ.levelId=L.id
    JOIN Quests Q ON Q.id=LQ.questId
  WHERE
    P.id=id
  ORDER BY
    L.sequence, L.id, L.createdAt DESC,
    LQ.sequence;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `get_program_link_id` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`jubi`@`%` PROCEDURE `get_program_link_id`(IN slug VARCHAR(100))
BEGIN

  SELECT P.linkId FROM Programs P
  WHERE P.slug=slug
  LIMIT 1;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `get_program_poll_questions` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`jubi`@`%` PROCEDURE `get_program_poll_questions`(IN programId INT)
BEGIN

	-- Poll Challenges linked to Quests
    SELECT
    	IFNULL(L.sequence, 0) AS levelSequence,
        C.id AS challengeId,
        C.sequence AS challengeSequence,
        C.title AS challengeTitle,
        'quest' AS questOrTodo,
        Q.id AS questId,
        Q.sequence AS questSequence,
        Q.title AS questTitle,
        NULL AS todoId,
        NULL AS todoTitle,
        CQ.id AS questionId,
        CQ.sequence AS questionSequence,
        CQ.question AS questionTitle
    FROM
    	Challenges C
    	INNER JOIN ChallengeQuestions CQ ON CQ.challengeId = C.id
        INNER JOIN ChallengeQuestionTypes CTQ ON CTQ.id = CQ.typeId
        INNER JOIN Quests Q ON Q.id = C.questId
        INNER JOIN Programs P ON P.id = Q.programId
        LEFT OUTER JOIN Levels L ON L.id = Q.levelId
    WHERE
    	CTQ.name IN ('Poll', 'Poll Multi Select')
        AND P.id = programId

    UNION ALL

    -- Poll Challenges linked to To-Dos
    SELECT
    	0 AS levelSequence,
        C.id AS challengeId,
        C.sequence AS challengeSequence,
        C.title AS challengeTitle,
        'todo' AS questOrTodo,
        NULL AS questId,
        NULL AS questSequence,
        NULL AS questTitle,
        T.id AS todoId,
        T.title AS todoTitle,
        CQ.id AS questionId,
        CQ.sequence AS questionSequence,
        CQ.question AS questionTitle
    FROM
    	Challenges C
    	INNER JOIN ChallengeQuestions CQ ON CQ.challengeId = C.id
        INNER JOIN ChallengeQuestionTypes CTQ ON CTQ.id = CQ.typeId
        INNER JOIN Todos T ON T.id = C.todoId
        INNER JOIN Programs P ON P.id = T.programId
    WHERE
    	CTQ.name IN ('Poll', 'Poll Multi Select')
        AND P.id = programId
    ORDER BY
    	levelSequence,
    	challengeSequence;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `get_program_quests` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`jubi`@`%` PROCEDURE `get_program_quests`(IN ref VARCHAR(100), IN preview INT)
BEGIN

  SELECT get_program_link_id(ref) INTO @linkId;
  SELECT get_current_program_id(@linkId, preview) INTO @id;


  SELECT
    Q.*,
    CH.id AS challengeId, CH.points AS challengePoints,
    CR.id AS resultId, CR.points AS resultPoints

  FROM Quests Q
    LEFT OUTER JOIN Challenges CH ON CH.questId=Q.id
    LEFT OUTER JOIN ChallengeResults CR ON CR.challengeId=CH.id
  WHERE
    Q.programId=@id
  ORDER BY
    Q.sequence, Q.id,
    CH.sequence, CH.id;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `get_program_user` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`jubi`@`%` PROCEDURE `get_program_user`(IN ref VARCHAR(100), IN preview INT)
BEGIN

  SELECT get_program_link_id(ref) INTO @linkId;
  SELECT get_current_program_id(@linkId, preview) INTO @id;

  SELECT
    P.id,
    P.linkId,
    P.slug,
    P.title,
    P.description,
    P.imageRef,
    P.published,
    P.createdAt,
    (SELECT COUNT(*) FROM Programs P2 WHERE P2.linkId = P.linkId) AS version,
    H.userId                     AS updatedById,
    U.firstName                  AS updatedByFirstName,
    U.lastName                   AS updatedByLastName,
    C.id                         AS clientId,
    C.slug                       AS clientSlug,
    C.name                       AS clientName,
    C.createdAt                  AS clientCreatedAt,

    P.contentAuthor,
    P.contentDescription,

    CP.id                        AS contentProviderId,
    CP.name                      AS contentProviderName,

    Q.id                         AS questId,
    Q.title                      AS questTitle,
    Q.objective                  AS questObjective,
    Q.backgroundImageRef         AS questBackgroundImageRef,
    Q.featuredImageRef           AS questFeaturedImageRef,

    CH.id                        AS challengeId,
    CH.type                      AS challengeType,
    CH.title                     AS challengeTitle,
    CH.points                    AS challengePoints,
    CH.instructions              AS challengeInstructions,
    CH.finishText                AS challengeFinishText,
    CH.notes                     AS challengeNotes,
    CH.canUploadContent          AS challengeCanUploadContent,

    CQ.id                        AS questionId,
    CQ.question                  AS question,
    CQT.id                       AS questionTypeId,
    CQT.name                     AS questionTypeName,

    CA.id                        AS answerId,
    CA.answer,
    CA.correct                   AS answerCorrect,
    CA.sequence                   AS answerSequence,

    CM.id                        AS mediaId,
    CM.type                      AS mediaType,
    CM.data                      AS mediaData,
    CM.name                      AS mediaName,
    CM.description               AS mediaDescription,
    CM.sourceDate                AS mediaSourceDate,
    CM.ref                       AS mediaRef,
    CM.source                    AS mediaSource,
    CM.coverUrl                  AS coverUrl,
    (SELECT GROUP_CONCAT(type SEPARATOR ',') AS types FROM Encodings WHERE ref=CM.ref AND status='ready' GROUP BY ref) AS mediaEncodings,

    CR.id                        AS resultId,
    CR.points                    AS resultPoints,
    CR.createdAt                 AS resultCreatedAt,
    CR.updatedAt                 AS resultUpdatedAt

  FROM Programs P
    JOIN Histories H ON H.programId = P.id
    JOIN Users U ON U.id = H.userId
    JOIN Clients C ON C.id = P.clientId
    LEFT OUTER JOIN ContentProviders CP ON CP.id = P.contentProviderId
    LEFT OUTER JOIN Quests Q ON Q.programId = P.id

    LEFT OUTER JOIN Challenges CH ON CH.questId = Q.id

    LEFT OUTER JOIN ChallengeQuestions CQ ON CQ.challengeId = CH.id
    LEFT OUTER JOIN ChallengeQuestionTypes CQT ON CQT.id = CQ.typeId

    LEFT OUTER JOIN ChallengeAnswers CA ON CA.questionId = CQ.id

    LEFT OUTER JOIN ChallengeMedia CM ON CM.challengeId = CH.id

    LEFT OUTER JOIN ChallengeResults CR ON CR.challengeId = CH.id
  WHERE
    P.id = @id AND
    P.deletedAt IS NULL AND
    ((preview=0 AND P.published IS NOT NULL) OR preview<>0)
  ORDER BY
    Q.sequence, Q.id, Q.createdAt DESC,
    CH.sequence, CH.id, CH.createdAt DESC,
    CQ.sequence, CQ.id, CQ.createdAt DESC,
    CA.sequence, CA.id, CA.createdAt DESC,
    CM.sequence, CM.id, CM.createdAt DESC;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `get_session_user` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`jubi`@`%` PROCEDURE `get_session_user`(IN theUserId INT)
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

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `get_user_programs_short` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`jubi`@`%` PROCEDURE `get_user_programs_short`(IN theUserID INT, IN preview INT)
BEGIN
    SELECT P.id, P.linkId
    FROM Programs P
    WHERE P.id IN (
        SELECT MAX(P.id) FROM Programs P
            JOIN Clients C ON C.id=P.clientId JOIN ClientUsers CU ON CU.clientId=C.id
        WHERE
            P.deletedAt IS NULL AND
            CU.userId=theUserID AND
            (preview=1 OR P.status != 'preview') AND
            P.published IS NOT NULL AND (
                (SELECT COUNT(*) FROM ProgramUsers PU1 WHERE PU1.linkId = P.linkId)<=0 OR
                (SELECT COUNT(*) FROM ProgramUsers PU2 WHERE PU2.userId=theUserID AND PU2.linkId = P.linkId) > 0)
        GROUP BY P.linkId
    );
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Final view structure for view `PollResults`
--

/*!50001 DROP VIEW IF EXISTS `PollResults`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8 */;
/*!50001 SET character_set_results     = utf8 */;
/*!50001 SET collation_connection      = utf8_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`jubi`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `PollResults` AS select `CRI`.`questionId` AS `questionId`,`CRI`.`answerId` AS `answerId`,`CR`.`userId` AS `userId` from (((((`ChallengeResultItems` `CRI` join `ChallengeResults` `CR` on((`CR`.`id` = `CRI`.`resultId`))) join `ChallengeAnswers` `CA` on((`CA`.`id` = `CRI`.`answerId`))) join `Challenges` `C` on((`C`.`id` = `CR`.`challengeId`))) join `ChallengeQuestions` `CQ` on((`CQ`.`challengeId` = `C`.`id`))) join `ChallengeQuestionTypes` `CTQ` on((`CTQ`.`id` = `CQ`.`typeId`))) where (`CTQ`.`name` in ('Poll','Poll Multi Select')) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `ProgramUserStats`
--

/*!50001 DROP VIEW IF EXISTS `ProgramUserStats`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8 */;
/*!50001 SET character_set_results     = utf8 */;
/*!50001 SET collation_connection      = utf8_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`jubi`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `ProgramUserStats` AS select `D`.`date` AS `date`,date_format(`D`.`date`,'%m/%d/%Y') AS `dateDisplay`,`D`.`weekOfYear` AS `week`,concat('Week ',`D`.`weekOfYear`) AS `weekDisplay`,`D`.`month` AS `month`,`D`.`monthName` AS `monthName`,`D`.`monthYear` AS `monthYear`,`D`.`mmyyyy` AS `mmyyyy`,`D`.`monthName` AS `monthDisplay`,`D`.`quarter` AS `quarter`,`D`.`quarterName` AS `quarterName`,concat('Q',`D`.`quarter`) AS `quarterDisplay`,`D`.`year` AS `year`,`D`.`yearName` AS `yearName`,concat(`D`.`year`) AS `yearDisplay`,`F`.`dimDateId` AS `dimDateId`,`F`.`programLinkId` AS `programLinkId`,`F`.`userId` AS `userId`,ifnull(`U`.`firstName`,'') AS `userFirstName`,ifnull(`U`.`lastName`,'') AS `userLastName`,concat(ifnull(`U`.`firstName`,''),' ',ifnull(`U`.`lastName`,'')) AS `userFullName`,`F`.`levelsCompletedCount` AS `levelsCompletedCount`,`F`.`levelsCompletedPoints` AS `levelsCompletedPoints`,`F`.`questsCompletedCount` AS `questsCompletedCount`,`F`.`questsCompletedPoints` AS `questsCompletedPoints`,`F`.`challengesCompletedCount` AS `challengesCompletedCount`,`F`.`challengesCompletedPoints` AS `challengesCompletedPoints`,`F`.`challenges1stAttemptCorrectCount` AS `challenges1stAttemptCorrectCount`,`F`.`todosCompletedCount` AS `todosCompletedCount`,`F`.`todosCompletedPoints` AS `todosCompletedPoints`,`F`.`totalBasePoints` AS `totalBasePoints`,`F`.`badgesEarnedCount` AS `badgesEarnedCount` from ((`FactProgramUserStatsIntraday` `F` join `Users` `U` on((`U`.`id` = `F`.`userId`))) join `DimDates` `D` on((`D`.`id` = `F`.`dimDateId`))) union all select `D`.`date` AS `date`,date_format(`D`.`date`,'%m/%d/%Y') AS `dateDisplay`,`D`.`weekOfYear` AS `week`,concat('Week ',`D`.`weekOfYear`) AS `weekDisplay`,`D`.`month` AS `month`,`D`.`monthName` AS `monthName`,`D`.`monthYear` AS `monthYear`,`D`.`mmyyyy` AS `mmyyyy`,`D`.`monthName` AS `monthDisplay`,`D`.`quarter` AS `quarter`,`D`.`quarterName` AS `quarterName`,concat('Q',`D`.`quarter`) AS `quarterDisplay`,`D`.`year` AS `year`,`D`.`yearName` AS `yearName`,concat(`D`.`year`) AS `yearDisplay`,`F`.`dimDateId` AS `dimDateId`,`F`.`programLinkId` AS `programLinkId`,`F`.`userId` AS `userId`,ifnull(`U`.`firstName`,'') AS `userFirstName`,ifnull(`U`.`lastName`,'') AS `userLastName`,concat(ifnull(`U`.`firstName`,''),' ',ifnull(`U`.`lastName`,'')) AS `userFullName`,`F`.`levelsCompletedCount` AS `levelsCompletedCount`,`F`.`levelsCompletedPoints` AS `levelsCompletedPoints`,`F`.`questsCompletedCount` AS `questsCompletedCount`,`F`.`questsCompletedPoints` AS `questsCompletedPoints`,`F`.`challengesCompletedCount` AS `challengesCompletedCount`,`F`.`challengesCompletedPoints` AS `challengesCompletedPoints`,`F`.`challenges1stAttemptCorrectCount` AS `challenges1stAttemptCorrectCount`,`F`.`todosCompletedCount` AS `todosCompletedCount`,`F`.`todosCompletedPoints` AS `todosCompletedPoints`,`F`.`totalBasePoints` AS `totalBasePoints`,`F`.`badgesEarnedCount` AS `badgesEarnedCount` from ((`FactProgramUserStats` `F` join `Users` `U` on((`U`.`id` = `F`.`userId`))) join `DimDates` `D` on((`D`.`id` = `F`.`dimDateId`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2018-02-22 15:39:10
