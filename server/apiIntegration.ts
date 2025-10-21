/**
 * External API Integration for Watch Data
 * 
 * This module provides integration with external watch data APIs:
 * 1. TheWatchAPI - Free tier (25 requests/day) for basic watch data
 * 2. WatchBase DataFeed - Pay-per-record ($0.30/record) for detailed specs
 * 3. Chrono24 API - Market price data (requires commercial license)
 */

import { getDb } from "./db";
import { watches, marketPrices } from "../drizzle/schema";
import { sql, eq } from "drizzle-orm";

// API Configuration
interface APIConfig {
  theWatchAPI: {
    baseUrl: string;
    apiKey?: string;
    freeLimit: number; // requests per day
  };
  watchBase: {
    baseUrl: string;
    apiKey?: string;
    costPerRecord: number;
  };
  chrono24: {
    baseUrl: string;
    apiKey?: string;
  };
}

const API_CONFIG: APIConfig = {
  theWatchAPI: {
    baseUrl: "https://api.thewatchapi.com/v1",
    apiKey: process.env.THE_WATCH_API_KEY,
    freeLimit: 25,
  },
  watchBase: {
    baseUrl: "https://datafeed.watchbase.com/api",
    apiKey: process.env.WATCHBASE_API_KEY,
    costPerRecord: 0.30,
  },
  chrono24: {
    baseUrl: "https://api.chrono24.com/v1",
    apiKey: process.env.CHRONO24_API_KEY,
  },
};

/**
 * Fetch watch data from TheWatchAPI (Free tier)
 */
export async function fetchFromTheWatchAPI(brand: string, model: string) {
  if (!API_CONFIG.theWatchAPI.apiKey) {
    console.warn("[TheWatchAPI] API key not configured");
    return null;
  }

  try {
    const response = await fetch(
      `${API_CONFIG.theWatchAPI.baseUrl}/watches?brand=${encodeURIComponent(brand)}&model=${encodeURIComponent(model)}`,
      {
        headers: {
          "Authorization": `Bearer ${API_CONFIG.theWatchAPI.apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error(`[TheWatchAPI] HTTP ${response.status}: ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("[TheWatchAPI] Fetch error:", error);
    return null;
  }
}

/**
 * Fetch detailed specs from WatchBase DataFeed
 * Note: This is a paid service ($0.30 per record)
 */
export async function fetchFromWatchBase(referenceNumber: string) {
  if (!API_CONFIG.watchBase.apiKey) {
    console.warn("[WatchBase] API key not configured");
    return null;
  }

  try {
    const response = await fetch(
      `${API_CONFIG.watchBase.baseUrl}/watch/${encodeURIComponent(referenceNumber)}`,
      {
        headers: {
          "X-API-Key": API_CONFIG.watchBase.apiKey,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error(`[WatchBase] HTTP ${response.status}: ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("[WatchBase] Fetch error:", error);
    return null;
  }
}

/**
 * Fetch market prices from Chrono24 API
 */
export async function fetchMarketPricesFromChrono24(referenceNumber: string) {
  if (!API_CONFIG.chrono24.apiKey) {
    console.warn("[Chrono24] API key not configured");
    return null;
  }

  try {
    const response = await fetch(
      `${API_CONFIG.chrono24.baseUrl}/listings?reference=${encodeURIComponent(referenceNumber)}`,
      {
        headers: {
          "Authorization": `Bearer ${API_CONFIG.chrono24.apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error(`[Chrono24] HTTP ${response.status}: ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("[Chrono24] Fetch error:", error);
    return null;
  }
}

/**
 * Update market prices for a specific watch
 */
export async function updateMarketPrices(watchId: number, referenceNumber: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Fetch prices from Chrono24
  const priceData = await fetchMarketPricesFromChrono24(referenceNumber);
  
  if (!priceData || !priceData.listings) {
    console.log(`[Market Prices] No data found for ${referenceNumber}`);
    return 0;
  }

  let insertedCount = 0;
  
  for (const listing of priceData.listings) {
    try {
      await db.insert(marketPrices).values({
        watchId,
        priceUsd: listing.price_usd.toString(),
        source: "chrono24",
        condition: listing.condition || "used",
        recordedAt: new Date(listing.timestamp || Date.now()),
      });
      insertedCount++;
    } catch (error) {
      console.error(`[Market Prices] Failed to insert price for watch ${watchId}:`, error);
    }
  }

  console.log(`[Market Prices] Inserted ${insertedCount} price records for watch ${watchId}`);
  return insertedCount;
}

/**
 * Scheduled job: Update market prices for all watches
 * Recommended: Run once per day
 */
export async function scheduledMarketPriceUpdate() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  console.log("[Scheduled Job] Starting market price update...");

  // Get all watches with reference numbers
  const watchesWithRef = await db
    .select({ id: watches.id, referenceNumber: watches.referenceNumber })
    .from(watches)
    .where(sql`${watches.referenceNumber} IS NOT NULL AND ${watches.referenceNumber} != ''`)
    .limit(100); // Limit to avoid rate limiting

  let totalUpdated = 0;

  for (const watch of watchesWithRef) {
    if (!watch.referenceNumber) continue;
    
    const count = await updateMarketPrices(watch.id, watch.referenceNumber);
    totalUpdated += count;

    // Rate limiting: wait 1 second between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`[Scheduled Job] Updated ${totalUpdated} price records for ${watchesWithRef.length} watches`);
  return { watchesProcessed: watchesWithRef.length, pricesUpdated: totalUpdated };
}

/**
 * Manual trigger for market price update (for testing)
 */
export async function manualPriceUpdate(watchId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const watch = await db
    .select({ referenceNumber: watches.referenceNumber })
    .from(watches)
    .where(eq(watches.id, watchId))
    .limit(1);

  if (!watch[0] || !watch[0].referenceNumber) {
    throw new Error("Watch not found or missing reference number");
  }

  return await updateMarketPrices(watchId, watch[0].referenceNumber);
}

// Export API configuration for admin panel
export function getAPIStatus() {
  return {
    theWatchAPI: {
      configured: !!API_CONFIG.theWatchAPI.apiKey,
      freeLimit: API_CONFIG.theWatchAPI.freeLimit,
    },
    watchBase: {
      configured: !!API_CONFIG.watchBase.apiKey,
      costPerRecord: API_CONFIG.watchBase.costPerRecord,
    },
    chrono24: {
      configured: !!API_CONFIG.chrono24.apiKey,
    },
  };
}

