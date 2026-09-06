const express = require("express");
const { v4: uuid } = require("uuid");
const { readStore, writeStore } = require("../utils/store");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

router.get("/", (req, res) => {
  const store = readStore();
  const { search = "", category = "", minPrice, maxPrice, sort = "featured" } = req.query;

  let products = [...store.products];
  const q = String(search).trim().toLowerCase();

  if (q) {
    products = products.filter(p =>
      [p.name, p.description, p.category, p.location, ...(p.tags || [])]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }

  if (category) {
    products = products.filter(p => p.category.toLowerCase() === String(category).toLowerCase());
  }

  if (minPrice !== undefined) {
    products = products.filter(p => p.price >= Number(minPrice));
  }
  if (maxPrice !== undefined) {
    products = products.filter(p => p.price <= Number(maxPrice));
  }

  if (sort === "price_asc") products.sort((a, b) => a.price - b.price);
  if (sort === "price_desc") products.sort((a, b) => b.price - a.price);
  if (sort === "rating") products.sort((a, b) => b.rating - a.rating);

  res.json({
    count: products.length,
    products
  });
});

router.get("/:id", (req, res) => {
  const store = readStore();
  const product = store.products.find(p => p.id === req.params.id);

  if (!product) return res.status(404).json({ error: "Product not found." });

  const reviews = store.reviews.filter(r => r.productId === product.id);
  res.json({ ...product, reviews });
});

router.post("/", authRequired, (req, res) => {
  if (req.user.role !== "seller") {
    return res.status(403).json({ error: "Only sellers can create products." });
  }

  const { name, category, description = "", price, oldPrice = null, stock = 0, location = "", emoji = "📦", tags = [] } = req.body || {};

  if (!name || !category || price === undefined) {
    return res.status(400).json({ error: "name, category and price are required." });
  }

  const numericPrice = Number(price);
  const numericStock = Number(stock);

  if (!Number.isFinite(numericPrice) || numericPrice < 0) {
    return res.status(400).json({ error: "price must be a valid non-negative number." });
  }
  if (!Number.isInteger(numericStock) || numericStock < 0) {
    return res.status(400).json({ error: "stock must be a non-negative integer." });
  }

  const store = readStore();
  const product = {
    id: uuid(),
    name: String(name).trim(),
    category: String(category).trim().toLowerCase(),
    description: String(description).trim(),
    price: numericPrice,
    oldPrice: oldPrice === null ? null : Number(oldPrice),
    stock: numericStock,
    rating: 0,
    reviewsCount: 0,
    sellerId: req.user.id,
    location: String(location).trim(),
    emoji,
    tags: Array.isArray(tags) ? tags : []
  };

  store.products.push(product);
  writeStore(store);
  res.status(201).json(product);
});

module.exports = router;
