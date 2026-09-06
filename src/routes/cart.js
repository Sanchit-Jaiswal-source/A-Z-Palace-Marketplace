const express = require("express");
const { v4: uuid } = require("uuid");
const { readStore, writeStore } = require("../utils/store");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

function getCart(store, userId) {
  let cart = store.carts.find(c => c.userId === userId);
  if (!cart) {
    cart = { id: uuid(), userId, items: [] };
    store.carts.push(cart);
  }
  return cart;
}

router.get("/", authRequired, (req, res) => {
  const store = readStore();
  const cart = getCart(store, req.user.id);

  const detailed = cart.items.map(item => {
    const product = store.products.find(p => p.id === item.productId);
    return {
      ...item,
      product,
      lineTotal: product ? product.price * item.quantity : 0
    };
  }).filter(item => item.product);

  const subtotal = detailed.reduce((sum, i) => sum + i.lineTotal, 0);

  res.json({
    items: detailed,
    subtotal,
    itemCount: detailed.reduce((sum, i) => sum + i.quantity, 0)
  });
});

router.post("/items", authRequired, (req, res) => {
  const { productId, quantity = 1 } = req.body || {};
  const qty = Number(quantity);
  const store = readStore();
  const product = store.products.find(p => p.id === productId);

  if (!product) return res.status(404).json({ error: "Product not found." });
  if (!Number.isInteger(qty) || qty < 1) {
    return res.status(400).json({ error: "quantity must be a positive integer." });
  }
  if (product.stock < qty) {
    return res.status(400).json({ error: "Not enough stock available." });
  }

  const cart = getCart(store, req.user.id);
  const existing = cart.items.find(i => i.productId === productId);

  if (existing) existing.quantity += qty;
  else cart.items.push({ productId, quantity: qty });

  if (cart.items.some(i => {
    const p = store.products.find(x => x.id === i.productId);
    return p && i.quantity > p.stock;
  })) {
    return res.status(400).json({ error: "Cart quantity exceeds available stock." });
  }

  writeStore(store);
  res.status(201).json({ message: "Item added to cart.", cart });
});

router.patch("/items/:productId", authRequired, (req, res) => {
  const qty = Number(req.body?.quantity);
  const store = readStore();
  const cart = getCart(store, req.user.id);
  const item = cart.items.find(i => i.productId === req.params.productId);

  if (!item) return res.status(404).json({ error: "Item is not in the cart." });
  if (!Number.isInteger(qty) || qty < 1) {
    return res.status(400).json({ error: "quantity must be a positive integer." });
  }

  const product = store.products.find(p => p.id === item.productId);
  if (!product || qty > product.stock) {
    return res.status(400).json({ error: "Quantity exceeds stock." });
  }

  item.quantity = qty;
  writeStore(store);
  res.json({ message: "Cart updated.", cart });
});

router.delete("/items/:productId", authRequired, (req, res) => {
  const store = readStore();
  const cart = getCart(store, req.user.id);
  cart.items = cart.items.filter(i => i.productId !== req.params.productId);
  writeStore(store);
  res.json({ message: "Item removed.", cart });
});

module.exports = router;
