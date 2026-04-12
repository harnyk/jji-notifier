import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { connectOnce } from "../src/infrastructure/db/connection.js";
import { OfferModel, QueryModel } from "../src/infrastructure/db/models.js";
import { MongoOfferRepository } from "../src/infrastructure/db/MongoOfferRepository.js";
import { JjiApiClient } from "../src/infrastructure/api/JjiApiClient.js";
import { applyPostFilters, validatePostFilters } from "../src/domain/postFilters.js";
import type { SearchQuery } from "../src/domain/types.js";

const app = new Hono();

// Ensure connected before handling any request
app.use("*", async (_c, next) => {
  await connectOnce();
  await next();
});

app.get("/api/queries", async (c) => {
  const queries = await QueryModel.find().sort({ createdAt: -1 }).lean();
  return c.json(queries);
});

app.post("/api/queries", async (c) => {
  const { label, config } = await c.req.json<{ label: string; config: SearchQuery }>();
  validatePostFilters(config.postFilters ?? []);

  const query = await QueryModel.create({ label, config, isBootstrapped: false, isArchived: false });

  // Bootstrap: fetch and upsert without emitting notifications
  const api = await new JjiApiClient().fetchOffers(config);
  await new MongoOfferRepository().upsertOffers(
    applyPostFilters(api.data, config.postFilters ?? []),
    { skipNotifications: true },
  );

  query.isBootstrapped = true;
  await query.save();

  return c.json(query.toObject(), 201);
});

app.patch("/api/queries/:id/active", async (c) => {
  const { isActive } = await c.req.json<{ isActive: boolean }>();
  const query = await QueryModel.findByIdAndUpdate(
    c.req.param("id"),
    { isActive },
    { new: true },
  ).lean();
  if (!query) return c.json({ error: "Not found" }, 404);
  return c.json(query);
});

app.patch("/api/queries/:id/label", async (c) => {
  const { label } = await c.req.json<{ label: string }>();
  const query = await QueryModel.findByIdAndUpdate(
    c.req.param("id"),
    { label },
    { new: true },
  ).lean();
  if (!query) return c.json({ error: "Not found" }, 404);
  return c.json(query);
});

app.patch("/api/queries/:id/archive", async (c) => {
  const query = await QueryModel.findByIdAndUpdate(
    c.req.param("id"),
    { isArchived: true },
    { new: true },
  ).lean();
  if (!query) return c.json({ error: "Not found" }, 404);
  return c.json(query);
});

app.post("/api/queries/preview", async (c) => {
  const { config } = await c.req.json<{ config: SearchQuery }>();
  validatePostFilters(config.postFilters ?? []);
  const api = await new JjiApiClient().fetchOffers(config);
  const offers = applyPostFilters(api.data, config.postFilters ?? []);
  const fetchedGuids = new Set(
    await OfferModel.distinct("guid", { guid: { $in: offers.map((offer) => offer.guid) } }),
  );

  return c.json({
    offers: offers.map((offer) => ({
      ...offer,
      alreadyFetched: fetchedGuids.has(offer.guid),
    })),
    total: offers.length,
  });
});

serve({ fetch: app.fetch, port: 8001 }, () => {
  console.log("Admin API running on http://localhost:8001");
});
