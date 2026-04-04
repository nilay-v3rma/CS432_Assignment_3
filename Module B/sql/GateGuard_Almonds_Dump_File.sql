CREATE DATABASE  IF NOT EXISTS `gate_guard` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `gate_guard`;
-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: gate_guard
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL UNIQUE,
  `password_hash` text NOT NULL,
  `role` varchar(20) NOT NULL CHECK (role IN ('admin', 'user')),
  `email` varchar(100),
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','$2a$10$2h4deMRkLLsABD8Ag8cFcOE1DGTvJKlJpGJ3KlXpJQ8q3vQKz.YAi','admin','admin@gateguard.local','2026-03-19 00:00:00');
INSERT INTO `users` VALUES (2,'user','$2a$10$5wE2X8U0XFGz8pQhH3nJNOkL1kPjQmM9R6sT7uVw8xYzA1bCdF2Hy','user','user@gateguard.local','2026-03-19 00:00:00');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `blacklist`
--

DROP TABLE IF EXISTS `blacklist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `blacklist` (
  `blacklist_id` bigint NOT NULL AUTO_INCREMENT,
  `person_id` bigint DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `contact` varchar(15) DEFAULT NULL,
  `image` text,
  `expiry` date NOT NULL,
  PRIMARY KEY (`blacklist_id`),
  KEY `fk_blacklist_person` (`person_id`),
  CONSTRAINT `fk_blacklist_person` FOREIGN KEY (`person_id`) REFERENCES `person_info` (`person_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `blacklist`
--

LOCK TABLES `blacklist` WRITE;
/*!40000 ALTER TABLE `blacklist` DISABLE KEYS */;
INSERT INTO `blacklist` VALUES (1,5,'Neha Patel','7766554433','img_neha.jpg','2026-06-01');
/*!40000 ALTER TABLE `blacklist` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gate`
--

DROP TABLE IF EXISTS `gate`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gate` (
  `gate_id` bigint NOT NULL AUTO_INCREMENT,
  `status` enum('open','closed') NOT NULL DEFAULT 'open',
  `opening_time` time NOT NULL,
  `closing_time` time NOT NULL,
  PRIMARY KEY (`gate_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gate`
--

LOCK TABLES `gate` WRITE;
/*!40000 ALTER TABLE `gate` DISABLE KEYS */;
INSERT INTO `gate` VALUES (1,'open','00:00:00','23:59:59'),(2,'open','06:00:00','22:00:00'),(3,'open','18:00:00','06:00:00');
/*!40000 ALTER TABLE `gate` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `guard`
--

DROP TABLE IF EXISTS `guard`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `guard` (
  `guard_id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `image` text,
  `age` int DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `contact` varchar(15) DEFAULT NULL,
  `shift` enum('morning','night') NOT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `gate_id` bigint NOT NULL,
  PRIMARY KEY (`guard_id`),
  KEY `fk_guard_gate` (`gate_id`),
  CONSTRAINT `fk_guard_gate` FOREIGN KEY (`gate_id`) REFERENCES `gate` (`gate_id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `guard`
--

LOCK TABLES `guard` WRITE;
/*!40000 ALTER TABLE `guard` DISABLE KEYS */;
INSERT INTO `guard` VALUES (1,'Rajesh Singh','guard1.jpg',45,'rajesh@security.com','9000000001','morning','active',1),(2,'Suman Devi','guard2.jpg',38,'suman@security.com','9000000002','night','active',2),(3,'Vikram Rathore','guard3.jpg',42,'vikram@security.com','9000000003','morning','active',3);
/*!40000 ALTER TABLE `guard` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `guest`
--

DROP TABLE IF EXISTS `guest`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `guest` (
  `guest_id` varchar(50) NOT NULL,
  `person_id` bigint NOT NULL,
  `room_number` varchar(20) NOT NULL,
  `vehicle_id` bigint DEFAULT NULL,
  `guest_request_id` bigint NOT NULL,
  PRIMARY KEY (`guest_id`),
  UNIQUE KEY `person_id` (`person_id`),
  KEY `fk_guest_request` (`guest_request_id`),
  CONSTRAINT `fk_guest_pid` FOREIGN KEY (`person_id`) REFERENCES `person_info` (`person_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_guest_request` FOREIGN KEY (`guest_request_id`) REFERENCES `guest_request` (`guest_request_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `guest`
--

LOCK TABLES `guest` WRITE;
/*!40000 ALTER TABLE `guest` DISABLE KEYS */;
INSERT INTO `guest` VALUES ('GUEST_01',11,'101',NULL,1);
/*!40000 ALTER TABLE `guest` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `guest_request`
--

DROP TABLE IF EXISTS `guest_request`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `guest_request` (
  `guest_request_id` bigint NOT NULL AUTO_INCREMENT,
  `member_id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `contact` varchar(15) NOT NULL,
  `image` text,
  `age` int DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `reason` text NOT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `exit_date` date NOT NULL,
  `vehicle_number` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`guest_request_id`),
  KEY `fk_gr_member` (`member_id`),
  CONSTRAINT `fk_gr_member` FOREIGN KEY (`member_id`) REFERENCES `member` (`member_id`) ON DELETE CASCADE,
  CONSTRAINT `guest_request_chk_1` CHECK ((`age` between 0 and 120))
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `guest_request`
--

LOCK TABLES `guest_request` WRITE;
/*!40000 ALTER TABLE `guest_request` DISABLE KEYS */;
INSERT INTO `guest_request` VALUES (1,'IITGN_01','Rohan Das','9988776655','img_rohan.jpg',20,'rohan@xyz.com','Project Work','approved','2026-02-20',NULL);
/*!40000 ALTER TABLE `guest_request` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `member`
--

DROP TABLE IF EXISTS `member`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `member` (
  `member_id` varchar(50) NOT NULL,
  `person_id` bigint NOT NULL,
  `name` varchar(100) NOT NULL,
  `image` text NOT NULL,
  `age` int DEFAULT NULL,
  `email` varchar(150) NOT NULL,
  `contact` varchar(15) NOT NULL,
  PRIMARY KEY (`member_id`),
  UNIQUE KEY `person_id` (`person_id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `contact` (`contact`),
  CONSTRAINT `fk_member_pid` FOREIGN KEY (`person_id`) REFERENCES `person_info` (`person_id`) ON DELETE CASCADE,
  CONSTRAINT `member_chk_1` CHECK ((`age` between 16 and 100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `member`
--

LOCK TABLES `member` WRITE;
/*!40000 ALTER TABLE `member` DISABLE KEYS */;
INSERT INTO `member` VALUES ('IITGN_01',1,'Rahul Sharma','img_rahul.jpg',20,'rahul.s@iitgn.ac.in','9876543210'),('IITGN_02',2,'Suresh Kumar','img_suresh.jpg',35,'suresh.k@iitgn.ac.in','9123456789'),('IITGN_03',3,'Dr. Anjali Gupta','img_anjali.jpg',45,'anjali.g@iitgn.ac.in','9988776655'),('IITGN_04',4,'Vikram Singh','img_vikram.jpg',22,'vikram.s@iitgn.ac.in','8877665544'),('IITGN_05',5,'Neha Patel','img_neha.jpg',21,'neha.p@iitgn.ac.in','7766554433'),('IITGN_06',6,'Arjun Reddy','img_arjun.jpg',40,'arjun.r@iitgn.ac.in','6655443322'),('IITGN_07',7,'Priya Das','img_priya.jpg',19,'priya.d@iitgn.ac.in','5544332211'),('IITGN_08',8,'Prof. Amit Shah','img_amit.jpg',50,'amit.shah@iitgn.ac.in','4433221100'),('IITGN_09',9,'Kavita Mehra','img_kavita.jpg',23,'kavita.m@iitgn.ac.in','3322110099'),('IITGN_10',10,'Rohan Joshi','img_rohan.jpg',20,'rohan.j@iitgn.ac.in','2211009988');
/*!40000 ALTER TABLE `member` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `people_log`
--

DROP TABLE IF EXISTS `people_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `people_log` (
  `log_id` bigint NOT NULL AUTO_INCREMENT,
  `gate_id` bigint NOT NULL,
  `person_id` bigint NOT NULL,
  `vehicle_id` bigint DEFAULT NULL,
  `log_type` enum('entry','exit') NOT NULL,
  `time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  KEY `fk_log_gate` (`gate_id`),
  KEY `fk_log_person` (`person_id`),
  KEY `fk_log_vehicle` (`vehicle_id`),
  CONSTRAINT `fk_log_gate` FOREIGN KEY (`gate_id`) REFERENCES `gate` (`gate_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_log_person` FOREIGN KEY (`person_id`) REFERENCES `person_info` (`person_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_log_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicle` (`vehicle_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `people_log`
--

LOCK TABLES `people_log` WRITE;
/*!40000 ALTER TABLE `people_log` DISABLE KEYS */;
INSERT INTO `people_log` VALUES (1,1,1,NULL,'entry','2026-02-15 07:49:50'),(2,2,2,1,'entry','2026-02-15 08:49:50'),(3,1,1,NULL,'exit','2026-02-15 08:49:50'),(4,2,4,NULL,'entry','2026-02-15 09:49:50'),(5,1,5,NULL,'entry','2026-02-15 09:49:50'),(6,1,6,NULL,'entry','2026-02-15 10:49:50'),(7,2,5,NULL,'exit','2026-02-15 10:49:50'),(8,1,8,2,'entry','2026-02-15 11:19:50'),(9,1,9,NULL,'entry','2026-02-15 11:29:50'),(10,1,10,NULL,'entry','2026-02-15 11:39:50'),(11,1,12,NULL,'entry','2026-02-15 11:34:50'),(12,2,13,NULL,'entry','2026-02-15 11:39:50');
/*!40000 ALTER TABLE `people_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `person_info`
--

DROP TABLE IF EXISTS `person_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `person_info` (
  `person_id` bigint NOT NULL AUTO_INCREMENT,
  `type` enum('member','guest','visitor') NOT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`person_id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `person_info`
--

LOCK TABLES `person_info` WRITE;
/*!40000 ALTER TABLE `person_info` DISABLE KEYS */;
INSERT INTO `person_info` VALUES (1,'member','active','2026-02-15 11:49:50'),(2,'member','active','2026-02-15 11:49:50'),(3,'member','active','2026-02-15 11:49:50'),(4,'member','active','2026-02-15 11:49:50'),(5,'member','inactive','2026-02-15 11:49:50'),(6,'member','active','2026-02-15 11:49:50'),(7,'member','active','2026-02-15 11:49:50'),(8,'member','active','2026-02-15 11:49:50'),(9,'member','active','2026-02-15 11:49:50'),(10,'member','active','2026-02-15 11:49:50'),(11,'guest','active','2026-02-15 11:49:50'),(12,'visitor','active','2026-02-15 11:49:50'),(13,'visitor','active','2026-02-15 11:49:50');
/*!40000 ALTER TABLE `person_info` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `qr_code`
--

DROP TABLE IF EXISTS `qr_code`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `qr_code` (
  `qr_info` varchar(255) NOT NULL,
  `person_id` bigint NOT NULL,
  `valid_till` timestamp NOT NULL,
  `in_campus_flag` tinyint(1) NOT NULL DEFAULT '0',
  `issued_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`qr_info`),
  KEY `fk_qr_person` (`person_id`),
  CONSTRAINT `fk_qr_person` FOREIGN KEY (`person_id`) REFERENCES `person_info` (`person_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `qr_code`
--

LOCK TABLES `qr_code` WRITE;
/*!40000 ALTER TABLE `qr_code` DISABLE KEYS */;
INSERT INTO `qr_code` VALUES ('QR_GUEST_01',11,'2026-02-20 18:29:59',0,'2026-02-15 11:49:50'),('QR_IITGN_01',1,'2027-12-31 18:29:59',1,'2026-02-15 11:49:50'),('QR_IITGN_02',2,'2027-12-31 18:29:59',1,'2026-02-15 11:49:50'),('QR_IITGN_03',3,'2027-12-31 18:29:59',1,'2026-02-15 11:49:50'),('QR_IITGN_04',4,'2027-12-31 18:29:59',1,'2026-02-15 11:49:50'),('QR_IITGN_05',5,'2027-12-31 18:29:59',1,'2026-02-15 11:49:50'),('QR_IITGN_06',6,'2027-12-31 18:29:59',1,'2026-02-15 11:49:50'),('QR_IITGN_07',7,'2027-12-31 18:29:59',1,'2026-02-15 11:49:50'),('QR_IITGN_08',8,'2027-12-31 18:29:59',1,'2026-02-15 11:49:50'),('QR_IITGN_09',9,'2027-12-31 18:29:59',1,'2026-02-15 11:49:50'),('QR_IITGN_10',10,'2027-12-31 18:29:59',1,'2026-02-15 11:49:50');
/*!40000 ALTER TABLE `qr_code` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehicle`
--

DROP TABLE IF EXISTS `vehicle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicle` (
  `vehicle_id` bigint NOT NULL AUTO_INCREMENT,
  `person_id` bigint NOT NULL,
  `vehicle_number` varchar(20) NOT NULL,
  `type` enum('bike','car') NOT NULL,
  PRIMARY KEY (`vehicle_id`),
  UNIQUE KEY `vehicle_number` (`vehicle_number`),
  KEY `fk_vehicle_person` (`person_id`),
  CONSTRAINT `fk_vehicle_person` FOREIGN KEY (`person_id`) REFERENCES `person_info` (`person_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehicle`
--

LOCK TABLES `vehicle` WRITE;
/*!40000 ALTER TABLE `vehicle` DISABLE KEYS */;
INSERT INTO `vehicle` VALUES (1,2,'GJ-01-AB-1234','bike'),(2,8,'GJ-18-XY-9999','car');
/*!40000 ALTER TABLE `vehicle` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehicle_log`
--

DROP TABLE IF EXISTS `vehicle_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicle_log` (
  `vehicle_log_id` bigint NOT NULL AUTO_INCREMENT,
  `vehicle_id` bigint NOT NULL,
  `person_id` bigint NOT NULL,
  `gate_id` bigint NOT NULL,
  `log_type` enum('entry','exit') NOT NULL,
  `time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`vehicle_log_id`),
  KEY `fk_vlog_vehicle` (`vehicle_id`),
  KEY `fk_vlog_person` (`person_id`),
  KEY `fk_vlog_gate` (`gate_id`),
  CONSTRAINT `fk_vlog_gate` FOREIGN KEY (`gate_id`) REFERENCES `gate` (`gate_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_vlog_person` FOREIGN KEY (`person_id`) REFERENCES `person_info` (`person_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_vlog_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicle` (`vehicle_id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehicle_log`
--

LOCK TABLES `vehicle_log` WRITE;
/*!40000 ALTER TABLE `vehicle_log` DISABLE KEYS */;
INSERT INTO `vehicle_log` VALUES (1,1,2,2,'entry','2026-02-15 08:49:50'),(2,2,8,1,'entry','2026-02-15 11:19:50');
/*!40000 ALTER TABLE `vehicle_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehicle_qr`
--

DROP TABLE IF EXISTS `vehicle_qr`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicle_qr` (
  `qr_info` varchar(255) NOT NULL,
  `vehicle_id` bigint NOT NULL,
  `valid_till` timestamp NOT NULL,
  `in_campus_flag` tinyint(1) NOT NULL DEFAULT '0',
  `issued_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`qr_info`),
  KEY `fk_vehicle_qr_vehicle` (`vehicle_id`),
  CONSTRAINT `fk_vehicle_qr_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicle` (`vehicle_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehicle_qr`
--

LOCK TABLES `vehicle_qr` WRITE;
/*!40000 ALTER TABLE `vehicle_qr` DISABLE KEYS */;
INSERT INTO `vehicle_qr` VALUES ('VQR_BIKE_01',1,'2027-12-31 18:29:59',1,'2026-02-15 11:49:50'),('VQR_CAR_01',2,'2027-12-31 18:29:59',1,'2026-02-15 11:49:50');
/*!40000 ALTER TABLE `vehicle_qr` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `visitor`
--

DROP TABLE IF EXISTS `visitor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `visitor` (
  `visitor_id` varchar(50) NOT NULL,
  `person_id` bigint NOT NULL,
  `name` varchar(100) NOT NULL,
  `contact` varchar(15) NOT NULL,
  `age` int DEFAULT NULL,
  `reason` text NOT NULL,
  `vehicle_number` varchar(20) DEFAULT NULL,
  `gate_id` bigint NOT NULL,
  `in_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`visitor_id`),
  UNIQUE KEY `person_id` (`person_id`),
  KEY `fk_visitor_gate` (`gate_id`),
  CONSTRAINT `fk_visitor_gate` FOREIGN KEY (`gate_id`) REFERENCES `gate` (`gate_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_visitor_pid` FOREIGN KEY (`person_id`) REFERENCES `person_info` (`person_id`) ON DELETE CASCADE,
  CONSTRAINT `visitor_chk_1` CHECK ((`age` between 18 and 100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `visitor`
--

LOCK TABLES `visitor` WRITE;
/*!40000 ALTER TABLE `visitor` DISABLE KEYS */;
INSERT INTO `visitor` VALUES ('VIS_01',12,'Rajesh','9111111111',25,'Zomato Food Delivery',NULL,1,'2026-02-15 11:49:50'),('VIS_02',13,'Soham','9222222222',30,'Amazon Parcel Delivery',NULL,2,'2026-02-15 11:49:50');
/*!40000 ALTER TABLE `visitor` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-15 17:21:00
