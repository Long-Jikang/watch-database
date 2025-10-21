import { mysqlEnum, mysqlTable, text, timestamp, varchar, int, index, boolean, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Watch master table - stores core watch specifications
 */
export const watches = mysqlTable("watches", {
  id: int("id").primaryKey().autoincrement(),
  brand: varchar("brand", { length: 100 }).notNull(),
  family: varchar("family", { length: 100 }),
  name: text("name").notNull(),
  referenceNumber: varchar("referenceNumber", { length: 100 }),
  
  // Movement details
  movementCaliber: varchar("movementCaliber", { length: 100 }),
  movementType: varchar("movementType", { length: 50 }), // Automatic, Manual, Quartz
  movementFunctions: text("movementFunctions"),
  
  // Case specifications
  caseMaterial: varchar("caseMaterial", { length: 100 }),
  caseDiameterMm: decimal("caseDiameterMm", { precision: 5, scale: 2 }),
  caseThicknessMm: decimal("caseThicknessMm", { precision: 5, scale: 2 }),
  
  // Other specs
  glass: varchar("glass", { length: 50 }),
  back: varchar("back", { length: 50 }),
  waterResistanceM: int("waterResistanceM"),
  
  // Limited edition
  isLimited: boolean("isLimited").default(false),
  limitedEditionSize: int("limitedEditionSize"),
  
  // Production years
  yearOfProduction: varchar("yearOfProduction", { length: 50 }),
  
  // Description and images
  description: text("description"),
  imageUrl: text("imageUrl"),
  
  // Data source tracking
  dataSource: varchar("dataSource", { length: 50 }), // 'kaggle', 'thewatchapi', 'watchbase', etc.
  externalId: varchar("externalId", { length: 100 }),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
}, (table) => ({
  brandIdx: index("brand_idx").on(table.brand),
  referenceIdx: index("reference_idx").on(table.referenceNumber),
  familyIdx: index("family_idx").on(table.family),
  caseMaterialIdx: index("case_material_idx").on(table.caseMaterial),
  movementTypeIdx: index("movement_type_idx").on(table.movementType),
}));

export type Watch = typeof watches.$inferSelect;
export type InsertWatch = typeof watches.$inferInsert;

/**
 * Watch features table - stores searchable features/complications
 * Allows flexible multi-value attributes (e.g., GMT, Chronograph, etc.)
 */
export const watchFeatures = mysqlTable("watchFeatures", {
  id: int("id").primaryKey().autoincrement(),
  watchId: int("watchId").notNull(),
  featureKey: varchar("featureKey", { length: 50 }).notNull(), // 'complication', 'dial_color', 'bracelet_material', etc.
  featureValue: varchar("featureValue", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
}, (table) => ({
  watchIdIdx: index("watch_id_idx").on(table.watchId),
  featureKeyIdx: index("feature_key_idx").on(table.featureKey),
  featureValueIdx: index("feature_value_idx").on(table.featureValue),
}));

export type WatchFeature = typeof watchFeatures.$inferSelect;
export type InsertWatchFeature = typeof watchFeatures.$inferInsert;

/**
 * Market prices table - stores historical price data
 * Time-series data for price tracking
 */
export const marketPrices = mysqlTable("marketPrices", {
  id: int("id").primaryKey().autoincrement(),
  watchId: int("watchId").notNull(),
  
  // Price data
  priceUsd: decimal("priceUsd", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("USD").notNull(),
  
  // Price type
  priceType: mysqlEnum("priceType", ["market", "retail", "auction"]).default("market").notNull(),
  condition: mysqlEnum("condition", ["new", "used", "vintage"]).default("new").notNull(),
  
  // Data source
  source: varchar("source", { length: 50 }).notNull(), // 'thewatchapi', 'chrono24', 'manual', etc.
  sourceUrl: text("sourceUrl"),
  
  // Timestamp
  recordedAt: timestamp("recordedAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
}, (table) => ({
  watchIdIdx: index("watch_id_idx").on(table.watchId),
  recordedAtIdx: index("recorded_at_idx").on(table.recordedAt),
  sourceIdx: index("source_idx").on(table.source),
}));

export type MarketPrice = typeof marketPrices.$inferSelect;
export type InsertMarketPrice = typeof marketPrices.$inferInsert;

/**
 * User favorites/watchlist
 */
export const userWatchlist = mysqlTable("userWatchlist", {
  id: int("id").primaryKey().autoincrement(),
  userId: varchar("userId", { length: 64 }).notNull(),
  watchId: int("watchId").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow(),
}, (table) => ({
  userIdIdx: index("user_id_idx").on(table.userId),
  watchIdIdx: index("watch_id_idx").on(table.watchId),
}));

export type UserWatchlist = typeof userWatchlist.$inferSelect;
export type InsertUserWatchlist = typeof userWatchlist.$inferInsert;

/**
 * API sync logs - track data synchronization status
 */
export const apiSyncLogs = mysqlTable("apiSyncLogs", {
  id: int("id").primaryKey().autoincrement(),
  apiSource: varchar("apiSource", { length: 50 }).notNull(),
  syncType: varchar("syncType", { length: 50 }).notNull(), // 'full', 'incremental', 'price_update'
  status: mysqlEnum("status", ["pending", "running", "success", "failed"]).default("pending").notNull(),
  recordsProcessed: int("recordsProcessed").default(0),
  errorMessage: text("errorMessage"),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow(),
}, (table) => ({
  apiSourceIdx: index("api_source_idx").on(table.apiSource),
  statusIdx: index("status_idx").on(table.status),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
}));

export type ApiSyncLog = typeof apiSyncLogs.$inferSelect;
export type InsertApiSyncLog = typeof apiSyncLogs.$inferInsert;

