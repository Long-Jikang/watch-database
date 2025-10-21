import { eq, and, like, or, sql, desc, asc, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, watches, watchFeatures, marketPrices, userWatchlist, Watch } from "../drizzle/schema";
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
        like(watches.name, `%${query}%`),
        like(watches.brand, `%${query}%`),
        like(watches.referenceNumber, `%${query}%`)
      )
    );
  }

  if (brand) {
    conditions.push(eq(watches.brand, brand));
  }

  if (family) {
    conditions.push(eq(watches.family, family));
  }

  if (caseMaterial) {
    conditions.push(eq(watches.caseMaterial, caseMaterial));
  }

  if (movementType) {
    conditions.push(eq(watches.movementType, movementType));
  }

  if (diameterMin !== undefined) {
    conditions.push(sql`CAST(${watches.caseDiameterMm} AS DECIMAL) >= ${diameterMin}`);
  }

  if (diameterMax !== undefined) {
    conditions.push(sql`CAST(${watches.caseDiameterMm} AS DECIMAL) <= ${diameterMax}`);
  }

  // If features are specified, we need to join with watchFeatures
  let query_builder = db.select().from(watches);

  if (features && features.length > 0) {
    // Get watch IDs that have all specified features
    const watchIdsWithFeatures = await db
      .select({ watchId: watchFeatures.watchId })
      .from(watchFeatures)
      .where(inArray(watchFeatures.featureValue, features))
      .groupBy(watchFeatures.watchId)
      .having(sql`COUNT(DISTINCT ${watchFeatures.featureValue}) = ${features.length}`);

    const watchIds = watchIdsWithFeatures.map(row => row.watchId);
    
    if (watchIds.length === 0) {
      return { watches: [], total: 0 };
    }

    conditions.push(inArray(watches.id, watchIds));
  }

  // Apply WHERE conditions
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(watches)
    .where(whereClause);

  const total = Number(countResult[0]?.count || 0);

  // Build ORDER BY
  let orderByClause;
  switch (sortBy) {
    case 'brand':
      orderByClause = sortOrder === 'asc' ? asc(watches.brand) : desc(watches.brand);
      break;
    case 'diameter':
      orderByClause = sortOrder === 'asc' 
        ? sql`CAST(${watches.caseDiameterMm} AS DECIMAL) ASC`
        : sql`CAST(${watches.caseDiameterMm} AS DECIMAL) DESC`;
      break;
    case 'name':
    default:
      orderByClause = sortOrder === 'asc' ? asc(watches.name) : desc(watches.name);
  }

  // Execute query
  const results = await db
    .select()
    .from(watches)
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

  const result = await db.select().from(watches).where(eq(watches.id, id)).limit(1);
  return result[0] || null;
}

export async function getWatchFeatures(watchId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return await db
    .select()
    .from(watchFeatures)
    .where(eq(watchFeatures.watchId, watchId));
}

export async function getWatchPriceHistory(watchId: number, limit = 100) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return await db
    .select()
    .from(marketPrices)
    .where(eq(marketPrices.watchId, watchId))
    .orderBy(desc(marketPrices.recordedAt))
    .limit(limit);
}

// Get unique values for filters
export async function getBrands() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const results = await db
    .selectDistinct({ brand: watches.brand })
    .from(watches)
    .where(sql`${watches.brand} IS NOT NULL AND ${watches.brand} != ''`)
    .orderBy(asc(watches.brand));

  return results.map(r => r.brand).filter(b => b && b.trim().length > 0);
}

export async function getCaseMaterials() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const results = await db
    .selectDistinct({ material: watches.caseMaterial })
    .from(watches)
    .where(sql`${watches.caseMaterial} IS NOT NULL AND ${watches.caseMaterial} != ''`)
    .orderBy(asc(watches.caseMaterial));

  return results.map(r => r.material).filter(m => m && m.trim().length > 0);
}

export async function getMovementTypes() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const results = await db
    .selectDistinct({ type: watches.movementType })
    .from(watches)
    .where(sql`${watches.movementType} IS NOT NULL AND ${watches.movementType} != ''`)
    .orderBy(asc(watches.movementType));

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
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const results = await db
    .select({
      watch: watches,
      notes: userWatchlist.notes,
      addedAt: userWatchlist.createdAt
    })
    .from(userWatchlist)
    .innerJoin(watches, eq(userWatchlist.watchId, watches.id))
    .where(eq(userWatchlist.userId, userId))
    .orderBy(desc(userWatchlist.createdAt));

  return results;
}

// Database statistics
export async function getDbStats() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const [watchCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(watches);
  const [featureCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(watchFeatures);
  const [priceCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(marketPrices);
  const [brandCount] = await db.select({ count: sql<number>`COUNT(DISTINCT brand)` }).from(watches);

  return {
    totalWatches: Number(watchCount.count),
    totalFeatures: Number(featureCount.count),
    totalPriceRecords: Number(priceCount.count),
    totalBrands: Number(brandCount.count)
  };
}

