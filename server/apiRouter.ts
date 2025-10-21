/**
 * API Management Router
 * Provides endpoints for managing external API integrations
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { 
  getAPIStatus, 
  manualPriceUpdate, 
  scheduledMarketPriceUpdate,
  fetchFromTheWatchAPI,
  fetchFromWatchBase
} from "./apiIntegration";

export const apiRouter = router({
  // Get API configuration status
  getStatus: protectedProcedure.query(async () => {
    return getAPIStatus();
  }),

  // Manual trigger for market price update
  updatePrices: protectedProcedure
    .input(z.object({ watchId: z.number() }))
    .mutation(async ({ input }) => {
      const count = await manualPriceUpdate(input.watchId);
      return { success: true, pricesUpdated: count };
    }),

  // Trigger scheduled update for all watches
  updateAllPrices: protectedProcedure.mutation(async () => {
    const result = await scheduledMarketPriceUpdate();
    return { success: true, ...result };
  }),

  // Test TheWatchAPI connection
  testTheWatchAPI: protectedProcedure
    .input(z.object({ brand: z.string(), model: z.string() }))
    .query(async ({ input }) => {
      const data = await fetchFromTheWatchAPI(input.brand, input.model);
      return { success: !!data, data };
    }),

  // Test WatchBase connection
  testWatchBase: protectedProcedure
    .input(z.object({ referenceNumber: z.string() }))
    .query(async ({ input }) => {
      const data = await fetchFromWatchBase(input.referenceNumber);
      return { success: !!data, data };
    }),
});

