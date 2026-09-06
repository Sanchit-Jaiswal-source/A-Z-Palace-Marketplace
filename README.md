# A-Z Palace Backend

A starter REST API for the A-Z Palace marketplace.

## Included

- Product catalog
- Search and category filtering
- User registration/login with JWT
- Seller product creation
- Cart management
- Order creation and order lookup
- Product reviews
- Health endpoint
- CORS enabled for frontend integration
- Simple JSON-file persistence for development

## Run

```bash
npm install
npm start
```

The API runs at:

`http://localhost:5000`

## Example endpoints

- `GET /api/health`
- `GET /api/products`
- `GET /api/products?search=gaming`
- `GET /api/products?category=electronics`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/cart`
- `POST /api/cart/items`
- `POST /api/orders`
- `GET /api/orders`
- `POST /api/products/:id/reviews`

## Important

This version uses local JSON files to keep setup simple. For production, replace the repositories with PostgreSQL/MongoDB, use hashed passwords, secure secrets, validation, rate limiting, payment webhooks, and object storage.
