import { Router } from "express";
import { db } from "@workspace/db";
import { nailColorsTable } from "@workspace/db/schema";
import { eq, and, count, ilike } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { getPaginationParams, paginate } from "../lib/pagination.js";

const router = Router();

function formatColor(color: any) {
  return {
    ...color,
    price: color.price ? parseFloat(color.price) : null,
    tags: color.tags || [],
  };
}

router.get("/salons/:salonId/nail-colors", async (req, res) => {
  try {
    const salonId = parseInt(req.params.salonId);
    const pagination = getPaginationParams(req.query);
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    const conditions: any[] = [eq(nailColorsTable.salonId, salonId)];
    if (req.query.brand) conditions.push(eq(nailColorsTable.brand, req.query.brand as string));
    if (req.query.finish) conditions.push(eq(nailColorsTable.finish, req.query.finish as any));
    if (req.query.inStock === "true") conditions.push(eq(nailColorsTable.inStock, true));
    if (req.query.search) conditions.push(ilike(nailColorsTable.name, `%${req.query.search}%`));

    const where = conditions.length === 1 ? conditions[0] : and(...conditions);

    const [colors, totalResult] = await Promise.all([
      db.select().from(nailColorsTable).where(where).limit(limit).offset(offset),
      db.select({ count: count() }).from(nailColorsTable).where(where),
    ]);

    res.json(paginate(colors.map(formatColor), totalResult[0].count, pagination));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to list nail colors" });
  }
});

router.post("/salons/:salonId/nail-colors", requireAuth, async (req, res) => {
  try {
    const salonId = parseInt(req.params.salonId);
    const { name, brand, colorCode, finish, collection, imageUrl, inStock, stockQuantity, price, tags } = req.body;

    const [color] = await db.insert(nailColorsTable).values({
      salonId,
      name,
      brand,
      colorCode,
      finish,
      collection: collection || null,
      imageUrl: imageUrl || null,
      inStock: inStock !== undefined ? inStock : true,
      stockQuantity: stockQuantity || null,
      price: price ? String(price) : null,
      tags: tags || [],
    }).returning();

    res.status(201).json(formatColor(color));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to add nail color" });
  }
});

router.get("/salons/:salonId/nail-colors/try-on", async (_req, res) => {
  res.status(200).json({
    previewImageUrl: "/images/try-on-placeholder.png",
    colorId: 0,
    colorName: "Preview",
    colorCode: "#FF0000",
  });
});

router.post("/salons/:salonId/nail-colors/try-on", async (req, res) => {
  try {
    const { colorId } = req.body;
    const salonId = parseInt(req.params.salonId);

    const colors = await db.select().from(nailColorsTable).where(eq(nailColorsTable.id, colorId));
    const color = colors[0];

    res.json({
      previewImageUrl: `/images/try-on-placeholder.png`,
      colorId,
      colorName: color?.name || "Unknown",
      colorCode: color?.colorCode || "#000000",
    });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: "Virtual try-on failed" });
  }
});

router.get("/salons/:salonId/nail-colors/:colorId", async (req, res) => {
  try {
    const colorId = parseInt(req.params.colorId);
    const colors = await db.select().from(nailColorsTable).where(eq(nailColorsTable.id, colorId));
    if (!colors[0]) {
      res.status(404).json({ error: "Not Found", message: "Nail color not found" });
      return;
    }
    res.json(formatColor(colors[0]));
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: "Failed to get nail color" });
  }
});

router.put("/salons/:salonId/nail-colors/:colorId", requireAuth, async (req, res) => {
  try {
    const colorId = parseInt(req.params.colorId);
    const updates: any = {};
    const allowed = ["name", "brand", "colorCode", "finish", "collection", "imageUrl", "inStock", "stockQuantity", "price", "isPopular", "tags"];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[key] = key === "price" ? String(req.body[key]) : req.body[key];
      }
    }
    updates.updatedAt = new Date();

    const [updated] = await db.update(nailColorsTable).set(updates).where(eq(nailColorsTable.id, colorId)).returning();
    if (!updated) {
      res.status(404).json({ error: "Not Found", message: "Nail color not found" });
      return;
    }
    res.json(formatColor(updated));
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: "Failed to update nail color" });
  }
});

router.delete("/salons/:salonId/nail-colors/:colorId", requireAuth, async (req, res) => {
  try {
    const colorId = parseInt(req.params.colorId);
    await db.delete(nailColorsTable).where(eq(nailColorsTable.id, colorId));
    res.json({ message: "Nail color removed" });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: "Failed to delete nail color" });
  }
});

export default router;
