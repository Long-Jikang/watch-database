import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Watch search and retrieval
  watches: router({
    // Search watches with filters
    search: publicProcedure
      .input(z.object({
        query: z.string().optional(),
        brand: z.string().optional(),
        family: z.string().optional(),
        caseMaterial: z.string().optional(),
        movementType: z.string().optional(),
        diameterMin: z.number().optional(),
        diameterMax: z.number().optional(),
        features: z.array(z.string()).optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        sortBy: z.enum(['name', 'brand', 'diameter']).default('name'),
        sortOrder: z.enum(['asc', 'desc']).default('asc'),
      }))
      .query(async ({ input }) => {
        return await db.searchWatches(input);
      }),

    // Get watch by ID
    getById: publicProcedure
      .input(z.object({
        id: z.number(),
      }))
      .query(async ({ input }) => {
        const watch = await db.getWatchById(input.id);
        if (!watch) {
          throw new Error("Watch not found");
        }
        return watch;
      }),

    // Get watch features
    getFeatures: publicProcedure
      .input(z.object({
        watchId: z.number(),
      }))
      .query(async ({ input }) => {
        return await db.getWatchFeatures(input.watchId);
      }),

    // Get watch with features (combined)
    getWithFeatures: publicProcedure
      .input(z.object({
        id: z.number(),
      }))
      .query(async ({ input }) => {
        const watch = await db.getWatchById(input.id);
        if (!watch) {
          throw new Error("Watch not found");
        }
        const features = await db.getWatchFeatures(input.id);
        return {
          watch,
          features
        };
      }),

    // Get price history
    getPriceHistory: publicProcedure
      .input(z.object({
        watchId: z.number(),
        limit: z.number().min(1).max(1000).default(100),
      }))
      .query(async ({ input }) => {
        return await db.getWatchPriceHistory(input.watchId, input.limit);
      }),
  }),

  // Filter options
  filters: router({
    // Get all brands
    getBrands: publicProcedure.query(async () => {
      return await db.getBrands();
    }),

    // Get all case materials
    getCaseMaterials: publicProcedure.query(async () => {
      return await db.getCaseMaterials();
    }),

    // Get all movement types
    getMovementTypes: publicProcedure.query(async () => {
      return await db.getMovementTypes();
    }),
  }),

  // User watchlist (protected)
  watchlist: router({
    // Get user's watchlist
    get: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserWatchlist(ctx.user.id);
    }),

    // Add to watchlist
    add: protectedProcedure
      .input(z.object({
        watchId: z.number(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.addToWatchlist(ctx.user.id, input.watchId, input.notes);
        return { success: true };
      }),

    // Remove from watchlist
    remove: protectedProcedure
      .input(z.object({
        watchId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.removeFromWatchlist(ctx.user.id, input.watchId);
        return { success: true };
      }),
  }),

  // Database statistics
  stats: router({
    get: publicProcedure.query(async () => {
      return await db.getDbStats();
    }),
  }),
});

export type AppRouter = typeof appRouter;

