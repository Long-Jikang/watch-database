/**
 * Watch Image Management
 * Handles image fetching from Unsplash and image uploads
 */

import { getDb } from "./db";
import { watches } from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";

// Unsplash API configuration
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || "demo"; // Free tier: 50 requests/hour

/**
 * Fetch watch image from Unsplash
 */
export async function fetchWatchImageFromUnsplash(brand: string, model: string): Promise<string | null> {
  try {
    const query = `${brand} ${model} watch luxury`.trim();
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=portrait`,
      {
        headers: {
          "Authorization": `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      }
    );

    if (!response.ok) {
      console.error(`[Unsplash] HTTP ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      return data.results[0].urls.regular; // 1080px width
    }

    return null;
  } catch (error) {
    console.error("[Unsplash] Fetch error:", error);
    return null;
  }
}

/**
 * Generate placeholder image URL using a service
 */
export function generatePlaceholderImage(brand?: string, model?: string): string {
  const text = brand && model ? `${brand} ${model}` : brand || "Watch";
  // Using a placeholder service
  return `https://placehold.co/400x500/1e40af/white?text=${encodeURIComponent(text)}`;
}

/**
 * Update watch image URL in database
 */
export async function updateWatchImage(watchId: number, imageUrl: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db
    .update(watches)
    .set({ imageUrl, updatedAt: new Date() })
    .where(eq(watches.id, watchId));
}

/**
 * Batch update images for watches without images
 */
export async function batchUpdateMissingImages(limit: number = 50) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Get watches without images
  const watchesWithoutImages = await db
    .select({
      id: watches.id,
      brand: watches.brand,
      name: watches.name,
    })
    .from(watches)
    .where(sql`${watches.imageUrl} IS NULL OR ${watches.imageUrl} = ''`)
    .limit(limit);

  let updated = 0;

  for (const watch of watchesWithoutImages) {
    const placeholderUrl = generatePlaceholderImage(watch.brand || undefined, watch.name || undefined);
    
    await db
      .update(watches)
      .set({ imageUrl: placeholderUrl })
      .where(eq(watches.id, watch.id));
    
    updated++;
  }

  console.log(`[Image Manager] Updated ${updated} watches with placeholder images`);
  return updated;
}

/**
 * Fetch and update images from Unsplash (rate limited)
 */
export async function fetchAndUpdateImagesFromUnsplash(limit: number = 10) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Get watches without images that have brand and name
  const watchesNeedingImages = await db
    .select({
      id: watches.id,
      brand: watches.brand,
      name: watches.name,
    })
    .from(watches)
    .where(sql`(${watches.imageUrl} IS NULL OR ${watches.imageUrl} = '') 
               AND ${watches.brand} IS NOT NULL 
               AND ${watches.brand} != ''
               AND ${watches.name} IS NOT NULL
               AND ${watches.name} != ''`)
    .limit(limit);

  let updated = 0;

  for (const watch of watchesNeedingImages) {
    if (!watch.brand || !watch.name) continue;

    const imageUrl = await fetchWatchImageFromUnsplash(watch.brand, watch.name);
    
    if (imageUrl) {
      await db
        .update(watches)
        .set({ imageUrl })
        .where(eq(watches.id, watch.id));
      updated++;
    } else {
      // Fallback to placeholder
      const placeholderUrl = generatePlaceholderImage(watch.brand, watch.name);
      await db
        .update(watches)
        .set({ imageUrl: placeholderUrl })
        .where(eq(watches.id, watch.id));
    }

    // Rate limiting: wait 1 second between requests (Unsplash free tier: 50/hour)
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`[Image Manager] Updated ${updated} watches with Unsplash images`);
  return updated;
}

