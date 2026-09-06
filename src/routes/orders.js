const express = require("express");
const { v4: uuid } = require("uuid");
const { readStore, writeStore } = require("../utils/store");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

router.post("/", authRequired, (req, res) => {
  const { shippingAddress = {}, paymentMethod = "cod" } = req.body || {};
  const store = readStore();
  const cart = store.carts.find(c => c.userId === req.user.id);

  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ error: "Your cart is empty." });
  }

  const detailed = cart.items.map(item => {
    const product = store.products.find(p => p.id === item.productId);
    return { item, product };
  });

  const invalid = detailed.find(x => !x.product || x.product.stock < x.item.quantity);
  if (invalid) {
    return res.status(400).json({ error: "One or more items are unavailable or out of stock." });
  }

  const subtotal = detailed.reduce((sum, x) => sum + x.product.price * x.item.quantity, 0);
  const deliveryFee = subtotal >= 999 ? 0 : 49;
  const total = subtotal + deliveryFee;

  detailed.forEach(x => {
    x.product.stock -= x.item.quantity;
  });

  const order = {
    id: `AZP-${Date.now().toString().slice(-8)}`,
    userId: req.user.id,
    items: detailed.map(x => ({
      productId: x.product.id,
      name: x.product.name,
      price: x.product.price,
      quantity: x.item.quantity
    })),
    shippingAddress,
    paymentMethod,
    subtotal,
    deliveryFee,
    total,
    status: "confirmed",
    createdAt: new Date().toISOString(),
    tracking: [
      { status: "confirmed", at: new Date().toISOString() }
    ]
  };

  store.orders.push(order);
  cart.items = [];
  writeStore(store);

  res.status(201).json(order);
});

router.get("/", authRequired, (req, res) => {
  const store = readStore();
  const orders = store.orders.filter(o => o.userId === req.user.id);
  res.json({ orders });
});

router.get("/:id", authRequired, (req, res) => {
  const store = readStore();
  const order = store.orders.find(o => o.id === req.params.id && o.userId === req.user.id);

  if (!order) return res.status(404).json({ error: "Order not found." });
  res.json(order);
});

module.exports = router;
