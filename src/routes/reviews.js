const express = require("express");
const { v4: uuid } = require("uuid");
const { readStore, writeStore } = require("../utils/store");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

router.post("/:productId", authRequired, (req, res) => {
  const { rating, text = "" } = req.body || {};
  const numericRating = Number(rating);
  const store = readStore();

  const product = store.products.find(p => p.id === req.params.productId);
  if (!product) return res.status(404).json({ error: "Product not found." });

  if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
    return res.status(400).json({ error: "rating must be an integer from 1 to 5." });
  }

  const alreadyReviewed = store.reviews.some(
    r => r.productId === product.id && r.userId === req.user.id
  );
  if (alreadyReviewed) {
    return res.status(409).json({ error: "You already reviewed this product." });
  }

  const review = {
    id: uuid(),
    productId: product.id,
    userId: req.user.id,
    rating: numericRating,
    text: String(text).trim(),
    createdAt: new Date().toISOString()
  };

  store.reviews.push(review);

  const productReviews = store.reviews.filter(r => r.productId === product.id);
  product.reviewsCount = productReviews.length;
  product.rating =
    productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;

  writeStore(store);
  res.status(201).json(review);
});

module.exports = router;
