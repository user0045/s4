import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContentSchema, insertSeasonSchema, insertEpisodeSchema, insertUpcomingContentSchema, insertAnalyticsSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Content routes
  app.get('/api/content', async (req, res) => {
    try {
      const content = await storage.getAllContent();
      res.json(content);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch content' });
    }
  });

  app.get('/api/content/published', async (req, res) => {
    try {
      const content = await storage.getPublishedContent();
      res.json(content);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch published content' });
    }
  });

  app.get('/api/content/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const content = await storage.getContentById(id);
      if (!content) {
        return res.status(404).json({ error: 'Content not found' });
      }
      res.json(content);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch content' });
    }
  });

  app.post('/api/content', async (req, res) => {
    try {
      const validatedData = insertContentSchema.parse(req.body);
      const content = await storage.createContent(validatedData);
      res.json(content);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create content' });
    }
  });

  app.put('/api/content/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertContentSchema.partial().parse(req.body);
      const content = await storage.updateContent(id, validatedData);
      if (!content) {
        return res.status(404).json({ error: 'Content not found' });
      }
      res.json(content);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to update content' });
    }
  });

  app.delete('/api/content/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteContent(id);
      if (!success) {
        return res.status(404).json({ error: 'Content not found' });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete content' });
    }
  });

  // Upcoming content routes
  app.get('/api/upcoming-content', async (req, res) => {
    try {
      const content = await storage.getAllUpcomingContent();
      res.json(content);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch upcoming content' });
    }
  });

  app.get('/api/upcoming-content/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const content = await storage.getUpcomingContentById(id);
      if (!content) {
        return res.status(404).json({ error: 'Upcoming content not found' });
      }
      res.json(content);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch upcoming content' });
    }
  });

  app.post('/api/upcoming-content', async (req, res) => {
    try {
      // Manual validation and transformation for date handling
      const data = {
        ...req.body,
        releaseDate: new Date(req.body.releaseDate)
      };
      const content = await storage.createUpcomingContent(data);
      res.json(content);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create upcoming content' });
    }
  });

  app.put('/api/upcoming-content/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertUpcomingContentSchema.partial().parse(req.body);
      const content = await storage.updateUpcomingContent(id, validatedData);
      if (!content) {
        return res.status(404).json({ error: 'Upcoming content not found' });
      }
      res.json(content);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to update upcoming content' });
    }
  });

  app.delete('/api/upcoming-content/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteUpcomingContent(id);
      if (!success) {
        return res.status(404).json({ error: 'Upcoming content not found' });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete upcoming content' });
    }
  });

  // Season routes
  app.get('/api/content/:contentId/seasons', async (req, res) => {
    try {
      const contentId = parseInt(req.params.contentId);
      const seasons = await storage.getSeasonsByContentId(contentId);
      res.json(seasons);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch seasons' });
    }
  });

  app.post('/api/seasons', async (req, res) => {
    try {
      const validatedData = insertSeasonSchema.parse(req.body);
      const season = await storage.createSeason(validatedData);
      res.json(season);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create season' });
    }
  });

  app.put('/api/seasons/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertSeasonSchema.partial().parse(req.body);
      const season = await storage.updateSeason(id, validatedData);
      if (!season) {
        return res.status(404).json({ error: 'Season not found' });
      }
      res.json(season);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to update season' });
    }
  });

  app.delete('/api/seasons/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteSeason(id);
      if (!success) {
        return res.status(404).json({ error: 'Season not found' });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete season' });
    }
  });

  // Episode routes
  app.get('/api/seasons/:seasonId/episodes', async (req, res) => {
    try {
      const seasonId = parseInt(req.params.seasonId);
      const episodes = await storage.getEpisodesBySeasonId(seasonId);
      res.json(episodes);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch episodes' });
    }
  });

  app.post('/api/episodes', async (req, res) => {
    try {
      const validatedData = insertEpisodeSchema.parse(req.body);
      const episode = await storage.createEpisode(validatedData);
      res.json(episode);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create episode' });
    }
  });

  app.put('/api/episodes/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertEpisodeSchema.partial().parse(req.body);
      const episode = await storage.updateEpisode(id, validatedData);
      if (!episode) {
        return res.status(404).json({ error: 'Episode not found' });
      }
      res.json(episode);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to update episode' });
    }
  });

  app.delete('/api/episodes/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteEpisode(id);
      if (!success) {
        return res.status(404).json({ error: 'Episode not found' });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete episode' });
    }
  });

  // Analytics routes
  app.post('/api/analytics', async (req, res) => {
    try {
      const validatedData = insertAnalyticsSchema.parse(req.body);
      const event = await storage.createAnalyticsEvent(validatedData);
      res.json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create analytics event' });
    }
  });

  app.get('/api/analytics', async (req, res) => {
    try {
      const analytics = await storage.getAnalytics();
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
