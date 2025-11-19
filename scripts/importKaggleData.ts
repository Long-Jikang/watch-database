import { drizzle } from "drizzle-orm/mysql2";
import * as fs from "fs";
import * as path from "path";
import { watches, watchFeatures, InsertWatch, InsertWatchFeature } from "../drizzle/schema.ts";

const CSV_FILE_PATH = path.join(__dirname, "../data/watch_sample.csv");
const BATCH_SIZE = 100;

interface CSVRow {
  Brand: string;
  Family: string;
  Name: string;
  Reference: string;
  Movement_Caliber: string;
  Movement_Functions: string;
  Limited: string;
  "Case Material": string;
  Glass: string;
  Back: string;
  Shape: string;
  Diameter: string;
  Height: string;
  "W/R": string;
  "Dial Color": string;
  Indexes: string;
  Hands: string;
  Description: string;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ';' && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

function parseDiameter(diameterStr: string): number | null {
  if (!diameterStr) return null;
  const match = diameterStr.match(/(\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : null;
}

function parseThickness(heightStr: string): number | null {
  if (!heightStr) return null;
  const match = heightStr.match(/(\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : null;
}

function parseWaterResistance(wrStr: string): number | null {
  if (!wrStr) return null;
  const match = wrStr.match(/(\d+)/);
  return match ? parseInt(match[1]) : null;
}

function parseLimited(limitedStr: string): { isLimited: boolean; size: number | null } {
  if (!limitedStr || limitedStr.toLowerCase() === "no") {
    return { isLimited: false, size: null };
  }
  
  const match = limitedStr.match(/(\d+)/);
  return {
    isLimited: true,
    size: match ? parseInt(match[1]) : null,
  };
}

function determineMovementType(caliber: string, functions: string): string | null {
  const combined = `${caliber} ${functions}`.toLowerCase();
  
  if (combined.includes("automatic") || combined.includes("self-winding")) {
    return "Automatic";
  } else if (combined.includes("manual") || combined.includes("hand-wound")) {
    return "Manual";
  } else if (combined.includes("quartz")) {
    return "Quartz";
  }
  
  return null;
}

async function importData() {
  console.log("Starting Kaggle data import...");
  
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const db = drizzle(process.env.DATABASE_URL);
  
  // Check if CSV file exists
  if (!fs.existsSync(CSV_FILE_PATH)) {
    console.warn(`CSV file not found at ${CSV_FILE_PATH}. Please ensure the file exists.`);
    console.log("Skipping data import as no CSV file is available.");
    return;
  }

  // Read CSV file
  const csvContent = fs.readFileSync(CSV_FILE_PATH, "utf-8");
  const lines = csvContent.split("\n");
  
  // Parse header
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);
  
  console.log(`Found ${lines.length - 1} rows in CSV`);
  console.log(`Headers: ${headers.join(", ")}`);
  
  let processedCount = 0;
  let errorCount = 0;
  let watchBatch: InsertWatch[] = [];
  let featureBatch: Array<{ watchId: number; features: InsertWatchFeature[] }> = [];
  
  // Process data rows (skip header)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    try {
      const values = parseCSVLine(line);
      
      if (values.length < headers.length) {
        console.warn(`Row ${i}: Incomplete data, skipping`);
        continue;
      }
      
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });
      
      const limited = parseLimited(row.Limited);
      const movementType = determineMovementType(row.Movement_Caliber, row.Movement_Functions);
      
      const watch: InsertWatch = {
        brand: row.Brand || "Unknown",
        family: row.Family || null,
        name: row.Name || "Unnamed Watch",
        referenceNumber: row.Reference || null,
        movementCaliber: row.Movement_Caliber || null,
        movementType: movementType,
        movementFunctions: row.Movement_Functions || null,
        caseMaterial: row["Case Material"] || null,
        caseDiameterMm: parseDiameter(row.Diameter)?.toString() || null,
        caseThicknessMm: parseThickness(row.Height)?.toString() || null,
        glass: row.Glass || null,
        back: row.Back || null,
        waterResistanceM: parseWaterResistance(row["W/R"]),
        isLimited: limited.isLimited,
        limitedEditionSize: limited.size,
        yearOfProduction: null,
        description: row.Description || null,
        imageUrl: null,
        dataSource: "kaggle",
        externalId: row.Reference || null,
      };
      
      watchBatch.push(watch);
      
      // Prepare features for this watch (will be associated after watch insert)
      const features: Omit<InsertWatchFeature, "watchId" | "id" | "createdAt">[] = [];
      
      if (row["Dial Color"]) {
        features.push({
          featureKey: "dial_color",
          featureValue: row["Dial Color"],
        });
      }
      
      if (row.Shape) {
        features.push({
          featureKey: "case_shape",
          featureValue: row.Shape,
        });
      }
      
      if (row.Indexes) {
        features.push({
          featureKey: "indexes",
          featureValue: row.Indexes,
        });
      }
      
      if (row.Hands) {
        features.push({
          featureKey: "hands",
          featureValue: row.Hands,
        });
      }
      
      // Parse movement functions as individual features
      if (row.Movement_Functions) {
        const functions = row.Movement_Functions.split("|").map(f => f.trim());
        functions.forEach(func => {
          if (func) {
            features.push({
              featureKey: "complication",
              featureValue: func,
            });
          }
        });
      }
      
      // Store features index to associate with watch later
      if (features.length > 0) {
        featureBatch.push({ watchId: watchBatch.length - 1, features }); // 当前批次中的索引

      }
      
      // Insert batch when reaching BATCH_SIZE
      if (watchBatch.length >= BATCH_SIZE) {
        await insertBatch(db, watchBatch, featureBatch);
        processedCount += watchBatch.length;
        console.log(`Processed ${processedCount} watches...`);
        watchBatch = [];
        featureBatch = [];
      }
      
    } catch (error) {
      errorCount++;
      console.error(`Error processing row ${i}:`, error);
      if (errorCount > 100) {
        console.error("Too many errors, stopping import");
        break;
      }
    }
  }
  
  // Insert remaining batch
  if (watchBatch.length > 0) {
    await insertBatch(db, watchBatch, featureBatch);
    processedCount += watchBatch.length;
  }
  
  console.log(`\nImport completed!`);
  console.log(`Total processed: ${processedCount}`);
  console.log(`Total errors: ${errorCount}`);
}

async function insertBatch(
  db: ReturnType<typeof drizzle>,
  watchBatch: InsertWatch[],
  featureBatch: Array<{ watchId: number; features: Omit<InsertWatchFeature, "watchId" | "id" | "createdAt">[] }>
) {
  // Insert watches
  const insertedWatches = await db.insert(watches).values(watchBatch);
  
  // Get the starting ID of inserted watches
  // 使用 drizzle 的 insert 返回结果，获取插入的起始 ID
  const startId = Number((insertedWatches as any).insertId);
  
  // Prepare all features with correct watchId
  const allFeatures: Omit<InsertWatchFeature, "id" | "createdAt">[] = [];
  featureBatch.forEach((item) => {
    const watchId = startId + item.watchId; // item.watchId is the index in batch
    item.features.forEach(feature => {
      allFeatures.push({
        watchId,
        featureKey: feature.featureKey,
        featureValue: feature.featureValue,
      });
    });
  });
  
  // Insert features if any
  if (allFeatures.length > 0) {
    await db.insert(watchFeatures).values(allFeatures);
  }
}

// Run import
importData()
  .then(() => {
    console.log("Import script finished successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Import script failed:", error);
    process.exit(1);
  });

