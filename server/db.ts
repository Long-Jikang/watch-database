import { eq, and, like, or, sql, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, watchFeatures, marketPrices } from "../drizzle/schema";
import { watchCatalog, WatchCatalog } from "../drizzle/watch_catalog_schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.id) {
    throw new Error("User ID is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      id: user.id,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role === undefined) {
      if (user.id === ENV.ownerId) {
        user.role = 'admin';
        values.role = 'admin';
        updateSet.role = 'admin';
      }
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUser(id: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Watch search interface
export interface WatchSearchParams {
  query?: string;
  brand?: string;
  family?: string;
  caseMaterial?: string;
  movementType?: string;
  diameterMin?: number;
  diameterMax?: number;
  priceMin?: number;
  priceMax?: number;
  features?: string[]; // Array of feature values to match
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'brand' | 'diameter' | 'price';
  sortOrder?: 'asc' | 'desc';
}

export async function searchWatches(params: WatchSearchParams) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const {
    query,
    brand,
    family,
    caseMaterial,
    movementType,
    diameterMin,
    diameterMax,
    features,
    limit = 50,
    offset = 0,
    sortBy = 'name',
    sortOrder = 'asc'
  } = params;

  // Build WHERE conditions
  const conditions = [];

  if (query) {
    conditions.push(
      or(
        like(watchCatalog.name, `%${query}%`),
        like(watchCatalog.brand, `%${query}%`),
        like(watchCatalog.reference, `%${query}%`)
      )
    );
  }

  if (brand) {
    conditions.push(eq(watchCatalog.brand, brand));
  }

  if (family) {
    conditions.push(eq(watchCatalog.family, family));
  }

  if (caseMaterial) {
    conditions.push(eq(watchCatalog.case_material, caseMaterial));
  }

  if (movementType) {
    conditions.push(eq(watchCatalog.movement_caliber, movementType));
  }

  if (diameterMin !== undefined) {
    conditions.push(sql`CAST(${watchCatalog.diameter} AS DECIMAL) >= ${diameterMin}`);
  }

  if (diameterMax !== undefined) {
    conditions.push(sql`CAST(${watchCatalog.diameter} AS DECIMAL) <= ${diameterMax}`);
  }

  let query_builder = db.select().from(watchCatalog);

  // Apply WHERE conditions
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(watchCatalog)
    .where(whereClause);

  const total = Number(countResult[0]?.count || 0);

  // Build ORDER BY
  let orderByClause;
  switch (sortBy) {
    case 'brand':
      orderByClause = sortOrder === 'asc' ? asc(watchCatalog.brand) : desc(watchCatalog.brand);
      break;
    case 'diameter':
      orderByClause = sortOrder === 'asc' 
        ? sql`CAST(${watchCatalog.diameter} AS DECIMAL) ASC`
        : sql`CAST(${watchCatalog.diameter} AS DECIMAL) DESC`;
      break;
    case 'name':
    default:
      orderByClause = sortOrder === 'asc' ? asc(watchCatalog.name) : desc(watchCatalog.name);
  }

  // Execute query
  const results = await db
    .select()
    .from(watchCatalog)
    .where(whereClause)
    .orderBy(orderByClause)
    .limit(limit)
    .offset(offset);

  return {
    watches: results,
    total,
    limit,
    offset
  };
}

export async function getWatchById(id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.select().from(watchCatalog).where(eq(watchCatalog.id, id)).limit(1);
  return result[0] || null;
}

export async function getWatchFeatures(watchId: number) {
  // watchFeatures表不存在，返回空数组
  console.warn("[Database] getWatchFeatures: watchFeatures table does not exist");
  return [];
}

export async function getWatchPriceHistory(watchId: number, limit = 100) {
  // marketPrices表不存在，返回空数组
  console.warn("[Database] getWatchPriceHistory: marketPrices table does not exist");
  return [];
}

// Get unique values for filters
export async function getBrands() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const results = await db
    .selectDistinct({ brand: watchCatalog.brand })
    .from(watchCatalog)
    .where(sql`${watchCatalog.brand} IS NOT NULL AND ${watchCatalog.brand} != ''`)
    .orderBy(asc(watchCatalog.brand));

  return results.map(r => r.brand).filter(b => b && b.trim().length > 0);
}

export async function getCaseMaterials() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const results = await db
    .selectDistinct({ material: watchCatalog.case_material })
    .from(watchCatalog)
    .where(sql`${watchCatalog.case_material} IS NOT NULL AND ${watchCatalog.case_material} != ''`)
    .orderBy(asc(watchCatalog.case_material));

  return results.map(r => r.material).filter(m => m && m.trim().length > 0);
}

export async function getMovementTypes() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const results = await db
    .selectDistinct({ type: watchCatalog.movement_caliber })
    .from(watchCatalog)
    .where(sql`${watchCatalog.movement_caliber} IS NOT NULL AND ${watchCatalog.movement_caliber} != ''`)
    .orderBy(asc(watchCatalog.movement_caliber));

  return results.map(r => r.type).filter(t => t && t.trim().length > 0);
}

// User watchlist functions
export async function addToWatchlist(userId: string, watchId: number, notes?: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.insert(userWatchlist).values({
    userId,
    watchId,
    notes: notes || null
  });
}

export async function removeFromWatchlist(userId: string, watchId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db
    .delete(userWatchlist)
    .where(and(
      eq(userWatchlist.userId, userId),
      eq(userWatchlist.watchId, watchId)
    ));
}

export async function getUserWatchlist(userId: string) {
  // 用户收藏列表功能暂时不可用，因为userWatchlist表不存在
  console.warn("[Database] getUserWatchlist: userWatchlist table does not exist");
  return [];
}

// Database statistics
export async function getDbStats() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const [watchCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(watchCatalog);
  const [brandCount] = await db.select({ count: sql<number>`COUNT(DISTINCT brand)` }).from(watchCatalog);

  return {
    totalWatches: Number(watchCount.count),
    totalBrands: Number(brandCount.count),
    totalFeatures: 0, // watchFeatures表不存在，返回默认值
    totalPriceRecords: 0 // marketPrices表不存在，返回默认值
  };
}

