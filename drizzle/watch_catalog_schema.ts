import { mysqlTable, varchar, text, decimal, int } from 'drizzle-orm/mysql-core';

export const watchCatalog = mysqlTable('watch_catalog', {
  id: int('id').primaryKey().autoincrement(),
  brand: varchar('brand', { length: 255 }).notNull(),
  family: varchar('family', { length: 255 }),
  name: varchar('name', { length: 255 }).notNull(),
  file_name: varchar('file_name', { length: 255 }),
  cny: decimal('cny', { precision: 10, scale: 2 }),
  hkd: decimal('hkd', { precision: 10, scale: 2 }),
  usd: decimal('usd', { precision: 10, scale: 2 }),
  sgd: decimal('sgd', { precision: 10, scale: 2 }),
  reference: varchar('reference', { length: 255 }),
  movement_caliber: varchar('movement_caliber', { length: 255 }),
  movement_functions: text('movement_functions'),
  limited: varchar('limited', { length: 255 }),
  case_material: varchar('case_material', { length: 255 }),
  glass: varchar('glass', { length: 255 }),
  back: varchar('back', { length: 255 }),
  shape: varchar('shape', { length: 255 }),
  diameter: varchar('diameter', { length: 255 }),
  height: varchar('height', { length: 255 }),
  wr: varchar('wr', { length: 255 }),
  dial_color: varchar('dial_color', { length: 255 }),
  indexes: varchar('indexes', { length: 255 }),
  hands: varchar('hands', { length: 255 }),
  description: text('description'),
});

export type WatchCatalog = typeof watchCatalog.$inferSelect;
export type InsertWatchCatalog = typeof watchCatalog.$inferInsert;