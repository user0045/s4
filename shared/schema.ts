import { pgTable, text, serial, integer, timestamp, json, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const content = pgTable("content", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(), // "movie" or "tv_show"
  genres: text("genres").array().notNull(),
  description: text("description"),
  releaseYear: integer("release_year"),
  ratingType: text("rating_type").notNull(),
  rating: integer("rating").notNull(), // stored as integer (multiplied by 10, e.g., 9.3 becomes 93)
  director: text("director"),
  writer: text("writer"),
  cast: text("cast").array(),
  thumbnailUrl: text("thumbnail_url"),
  trailerUrl: text("trailer_url"),
  videoUrl: text("video_url"), // Only for movies
  views: integer("views").default(0),
  // Feature flags
  homeHero: boolean("home_hero").default(false),
  typePageHero: boolean("type_page_hero").default(false), // movies/tv shows page hero
  homeNewRelease: boolean("home_new_release").default(false),
  typePageNewRelease: boolean("type_page_new_release").default(false),
  homePopular: boolean("home_popular").default(false),
  typePagePopular: boolean("type_page_popular").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const seasons = pgTable("seasons", {
  id: serial("id").primaryKey(),
  contentId: integer("content_id").references(() => content.id).notNull(),
  seasonNumber: integer("season_number").notNull(),
  description: text("description"),
  releaseYear: integer("release_year"),
  ratingType: text("rating_type").notNull(),
  rating: integer("rating").notNull(), // stored as integer (multiplied by 10, e.g., 9.3 becomes 93)
  director: text("director"),
  writer: text("writer"),
  cast: text("cast").array(),
  thumbnailUrl: text("thumbnail_url"),
  trailerUrl: text("trailer_url"),
  // Feature flags
  homeHero: boolean("home_hero").default(false),
  typePageHero: boolean("type_page_hero").default(false),
  homeNewRelease: boolean("home_new_release").default(false),
  typePageNewRelease: boolean("type_page_new_release").default(false),
  homePopular: boolean("home_popular").default(false),
  typePagePopular: boolean("type_page_popular").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const episodes = pgTable("episodes", {
  id: serial("id").primaryKey(),
  seasonId: integer("season_id").references(() => seasons.id).notNull(),
  episodeNumber: integer("episode_number").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  duration: text("duration"),
  videoUrl: text("video_url"),
  thumbnailUrl: text("thumbnail_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const upcomingContent = pgTable("upcoming_content", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(), // "movie" or "tv_show"
  genres: text("genres").array().notNull(),
  episodes: integer("episodes"), // Only for TV shows
  releaseDate: timestamp("release_date").notNull(),
  description: text("description").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  trailerUrl: text("trailer_url"),
  sectionOrder: integer("section_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  contentId: integer("content_id").references(() => content.id),
  eventType: text("event_type").notNull(), // "view", "play", "like", "add_to_list"
  userId: integer("user_id").references(() => users.id),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  metadata: json("metadata"), // Additional event data
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertContentSchema = createInsertSchema(content).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  views: true,
});

export const insertSeasonSchema = createInsertSchema(seasons).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEpisodeSchema = createInsertSchema(episodes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUpcomingContentSchema = createInsertSchema(upcomingContent).omit({
  id: true,
  createdAt: true,
}).extend({
  releaseDate: z.string().transform((str) => new Date(str))
});

export const insertAnalyticsSchema = createInsertSchema(analytics).omit({
  id: true,
  timestamp: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Content = typeof content.$inferSelect;
export type InsertContent = z.infer<typeof insertContentSchema>;

export type Season = typeof seasons.$inferSelect;
export type InsertSeason = z.infer<typeof insertSeasonSchema>;

export type Episode = typeof episodes.$inferSelect;
export type InsertEpisode = z.infer<typeof insertEpisodeSchema>;

export type UpcomingContent = typeof upcomingContent.$inferSelect;
export type InsertUpcomingContent = z.infer<typeof insertUpcomingContentSchema>;

export type Analytics = typeof analytics.$inferSelect;
export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;