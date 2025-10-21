CREATE TABLE `apiSyncLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`apiSource` varchar(50) NOT NULL,
	`syncType` varchar(50) NOT NULL,
	`status` enum('pending','running','success','failed') NOT NULL DEFAULT 'pending',
	`recordsProcessed` int DEFAULT 0,
	`errorMessage` text,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `apiSyncLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `marketPrices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`watchId` int NOT NULL,
	`priceUsd` decimal(12,2) NOT NULL,
	`currency` varchar(10) NOT NULL DEFAULT 'USD',
	`priceType` enum('market','retail','auction') NOT NULL DEFAULT 'market',
	`condition` enum('new','used','vintage') NOT NULL DEFAULT 'new',
	`source` varchar(50) NOT NULL,
	`sourceUrl` text,
	`recordedAt` timestamp NOT NULL,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `marketPrices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userWatchlist` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` varchar(64) NOT NULL,
	`watchId` int NOT NULL,
	`notes` text,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `userWatchlist_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `watchFeatures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`watchId` int NOT NULL,
	`featureKey` varchar(50) NOT NULL,
	`featureValue` varchar(100) NOT NULL,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `watchFeatures_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `watches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`brand` varchar(100) NOT NULL,
	`family` varchar(100),
	`name` text NOT NULL,
	`referenceNumber` varchar(100),
	`movementCaliber` varchar(100),
	`movementType` varchar(50),
	`movementFunctions` text,
	`caseMaterial` varchar(100),
	`caseDiameterMm` decimal(5,2),
	`caseThicknessMm` decimal(5,2),
	`glass` varchar(50),
	`back` varchar(50),
	`waterResistanceM` int,
	`isLimited` boolean DEFAULT false,
	`limitedEditionSize` int,
	`yearOfProduction` varchar(50),
	`description` text,
	`imageUrl` text,
	`dataSource` varchar(50),
	`externalId` varchar(100),
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `watches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `api_source_idx` ON `apiSyncLogs` (`apiSource`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `apiSyncLogs` (`status`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `apiSyncLogs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `watch_id_idx` ON `marketPrices` (`watchId`);--> statement-breakpoint
CREATE INDEX `recorded_at_idx` ON `marketPrices` (`recordedAt`);--> statement-breakpoint
CREATE INDEX `source_idx` ON `marketPrices` (`source`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `userWatchlist` (`userId`);--> statement-breakpoint
CREATE INDEX `watch_id_idx` ON `userWatchlist` (`watchId`);--> statement-breakpoint
CREATE INDEX `watch_id_idx` ON `watchFeatures` (`watchId`);--> statement-breakpoint
CREATE INDEX `feature_key_idx` ON `watchFeatures` (`featureKey`);--> statement-breakpoint
CREATE INDEX `feature_value_idx` ON `watchFeatures` (`featureValue`);--> statement-breakpoint
CREATE INDEX `brand_idx` ON `watches` (`brand`);--> statement-breakpoint
CREATE INDEX `reference_idx` ON `watches` (`referenceNumber`);--> statement-breakpoint
CREATE INDEX `family_idx` ON `watches` (`family`);--> statement-breakpoint
CREATE INDEX `case_material_idx` ON `watches` (`caseMaterial`);--> statement-breakpoint
CREATE INDEX `movement_type_idx` ON `watches` (`movementType`);