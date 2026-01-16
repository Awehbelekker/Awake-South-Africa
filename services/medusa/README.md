# Awake Boards SA - Medusa Backend

Complete e-commerce backend with inventory management, order processing, and cost/margin tracking.

## 🚀 Features

- **Product Management**: Full catalog of 36 Awake products
- **Cost Tracking**: EUR cost prices with ZAR conversion (R19.85/EUR)
- **Margin Analysis**: 35% target margins with real-time profit calculations
- **Inventory Management**: Stock levels and SKU tracking
- **Order Processing**: Complete order management system
- **Customer Management**: Customer profiles and history
- **Admin Dashboard**: Full-featured admin panel
- **Custom API Endpoints**: Cost and margin reporting

## 📦 Product Categories

- **Jetboards**: RÄVIK Explore, Adventure, Ultimate (XR4)
- **Limited Edition**: BRABUS Shadow
- **eFoils**: VINGA Adventure & Ultimate (LR4/XR4)
- **Batteries**: Flex LR4 (90min), Flex XR4 (65min)
- **Boards Only**: 5 models without batteries
- **Wings**: 5 eFoil wing kits
- **Accessories**: Bags, safety gear, electronics, parts, apparel

## 🛠️ Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis 7+

### Environment Variables

See main `.env` file at project root. Required variables:

```env
DATABASE_URL=postgres://medusa:password@postgres:5432/medusa
REDIS_URL=redis://:password@redis:6379
JWT_SECRET=your-jwt-secret
COOKIE_SECRET=your-cookie-secret
ADMIN_CORS=http://localhost:7000
STORE_CORS=http://localhost:3000
```

### Installation

```bash
# Install dependencies
npm install

# Run migrations
npm run migrations

# Seed database with products
npm run seed

# Start development server
npm run dev
```

The backend will be available at:
- **API**: http://localhost:9000
- **Admin Dashboard**: http://localhost:9000/app

### Default Admin Credentials

- **Email**: admin@awakesa.co.za
- **Password**: awake2026admin

⚠️ **Change these credentials immediately in production!**

## 📊 Custom API Endpoints

### GET /admin/products/costs

Returns all products with cost and margin analysis:

```json
{
  "products": [
    {
      "id": "prod_xxx",
      "title": "RÄVIK Explore XR 4",
      "sku": "RAVIK-EXPLORE-XR4",
      "costEUR": 5950,
      "costZAR": 118108,
      "priceExVAT": 209686,
      "priceIncVAT": 241139,
      "marginPercent": "43.68",
      "profitZAR": 91578,
      "category": "jetboards"
    }
  ],
  "summary": {
    "totalProducts": 36,
    "averageMargin": "35.00",
    "totalProfit": 2500000
  }
}
```

## 🔧 Docker Usage

```bash
# Build and start with docker-compose
cd ../..
docker-compose up medusa

# Or build standalone
docker build -t awake-medusa .
docker run -p 9000:9000 awake-medusa
```

## 📚 Product Cost Structure

All products include:

- **costEUR**: Base cost in EUR from official price list
- **costZAR**: Calculated as `costEUR × 19.85` (exchange rate)
- **priceExVAT**: Retail price excluding VAT
- **priceIncVAT**: Retail price including 15% VAT
- **marginPercent**: `((priceExVAT - costZAR) / priceExVAT) × 100`
- **profitZAR**: `priceExVAT - costZAR`

### Pricing Formula

```
Cost ZAR = Cost EUR × R19.85
Target Price (ex VAT) = Cost ZAR ÷ (1 - 0.35)  [35% margin]
Final Price (inc VAT) = Target Price × 1.15    [15% VAT]
```

## 🗄️ Database Structure

Extended Medusa tables:

### Product Table Extensions
- `cost_eur` (decimal): EUR cost price
- `cost_zar` (decimal): ZAR cost price
- `skill_level` (varchar): Beginner/Intermediate/Expert
- `category_tag` (varchar): Product category
- `target_margin_percent` (decimal): Target margin

### Product Variant Table Extensions
- `cost_eur` (decimal): Variant EUR cost
- `cost_zar` (decimal): Variant ZAR cost
- `price_ex_vat` (decimal): Price excluding VAT

## 🔐 Security

- JWT authentication for API access
- Cookie-based admin sessions
- CORS configuration for store and admin
- PostgreSQL with SSL in production
- Redis for session management

## 📖 API Documentation

Visit http://localhost:9000/docs for full API documentation.

## 🐛 Troubleshooting

### Database connection errors
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# View logs
docker-compose logs medusa
```

### Migration errors
```bash
# Reset and rerun migrations
npm run migrations:revert
npm run migrations
```

### Seed data issues
```bash
# Clear database and reseed
npm run migrations:revert
npm run migrations
npm run seed
```

## 📞 Support

- **Email**: info@awakesa.co.za
- **Docs**: https://docs.medusajs.com

---

**Awake Boards SA** - Official South African Distributor
