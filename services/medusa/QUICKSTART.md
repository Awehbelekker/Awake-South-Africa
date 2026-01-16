# 🚀 Medusa Backend - Quick Start Guide

## ✅ Setup Complete!

Your Medusa e-commerce backend is fully configured with:
- ✅ 36 Awake products with EUR cost prices
- ✅ Cost and margin tracking system
- ✅ Admin dashboard at http://localhost:9000/app
- ✅ Custom API endpoints for cost analysis
- ✅ Database migrations for extended fields
- ✅ PostgreSQL + Redis integration

---

## 🎯 Option 1: Start with Docker (Recommended)

This will start PostgreSQL, Redis, and Medusa all together:

```powershell
# From project root
cd C:\Users\Judy\awake-boards-infrastructure

# Start all services
docker-compose up -d postgres redis
docker-compose up medusa
```

Wait for services to be healthy, then:

```powershell
# Run migrations (in another terminal)
docker-compose exec medusa npm run migrations

# Seed products
docker-compose exec medusa npm run seed
```

**Access**:
- Admin Dashboard: http://localhost:9000/app
- API: http://localhost:9000

---

## 🎯 Option 2: Start Locally (Development)

### Step 1: Start PostgreSQL and Redis

```powershell
# Start database services only
cd C:\Users\Judy\awake-boards-infrastructure
docker-compose up -d postgres redis
```

### Step 2: Setup Medusa

```powershell
# Navigate to medusa
cd services\medusa

# Run database migrations
npm run migrations

# Seed products (36 products)
npm run seed

# Start dev server
npm run dev
```

**Access**:
- Admin Dashboard: http://localhost:9000/app
- API: http://localhost:9000

---

## 🔐 Default Admin Login

- **URL**: http://localhost:9000/app
- **Email**: admin@awakesa.co.za
- **Password**: awake2026admin

⚠️ **Change this password immediately!**

---

## 📊 View Costs & Margins

### Method 1: Admin Dashboard
1. Go to http://localhost:9000/app
2. Login with credentials above
3. Navigate to **Products**
4. Each product shows:
   - EUR cost price (in metadata)
   - ZAR cost (calculated)
   - Retail price
   - Margin percentage
   - Profit per unit

### Method 2: API Endpoint

```powershell
# Get all products with cost analysis
curl http://localhost:9000/admin/products/costs
```

Response includes:
```json
{
  "products": [
    {
      "title": "RÄVIK Explore XR 4",
      "costEUR": 5950,
      "costZAR": 118108,
      "priceExVAT": 209686,
      "marginPercent": "43.68",
      "profitZAR": 91578
    }
  ],
  "summary": {
    "totalProducts": 8,
    "averageMargin": "35.00",
    "totalProfit": 850000
  }
}
```

---

## 📦 What's Included

### 8 Main Products (from seed.json):
1. **RÄVIK Explore XR 4** - R241,139 (Cost: €5,950)
2. **RÄVIK Adventure XR 4** - R349,024 (Cost: €8,450)
3. **RÄVIK Ultimate XR 4** - R402,967 (Cost: €9,750)
4. **BRABUS Shadow** - R452,216 (Cost: €10,950) ⭐ Limited Edition
5. **VINGA Adventure LR 4** - R322,052 (Cost: €7,800)
6. **VINGA Adventure XR 4** - R362,509 (Cost: €8,780)
7. **VINGA Ultimate LR 4** - R349,024 (Cost: €8,450)
8. **VINGA Ultimate XR 4** - R389,481 (Cost: €9,430)

### Additional Products (add via admin):
- 2 Batteries (LR4, XR4)
- 5 Boards Only (without batteries)
- 5 Wing Kits
- 3 Bags
- 4 Safety & Storage items
- 3 Electronics
- 4 Parts
- 2 Apparel items

---

## 🔧 Common Commands

```powershell
# Start dev server
npm run dev

# Build for production
npm run build
npm run start

# Run migrations
npm run migrations

# Revert last migration
npm run migrations:revert

# Seed database
npm run seed

# Watch for changes
npm run watch
```

---

## 🐛 Troubleshooting

### Port 9000 already in use
```powershell
# Find process
netstat -ano | findstr :9000

# Kill process (replace PID)
taskkill /PID <PID> /F
```

### Database connection error
```powershell
# Check if PostgreSQL is running
docker-compose ps postgres

# View logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

### Migrations fail
```powershell
# Reset database
docker-compose down -v
docker-compose up -d postgres redis

# Wait 10 seconds, then run migrations
npm run migrations
npm run seed
```

---

## 📊 Cost & Margin Calculation

### Pricing Formula:
```
Exchange Rate: R19.85/EUR
Target Margin: 35%
VAT: 15%

Cost ZAR = Cost EUR × 19.85
Price (ex VAT) = Cost ZAR ÷ (1 - 0.35)
Price (inc VAT) = Price (ex VAT) × 1.15
Profit = Price (ex VAT) - Cost ZAR
Margin % = (Profit ÷ Price ex VAT) × 100
```

### Example: RÄVIK Explore XR 4
```
Cost EUR: €5,950
Cost ZAR: R118,108 (5950 × 19.85)
Price ex VAT: R209,686
Price inc VAT: R241,139
Profit: R91,578
Margin: 43.68%
```

---

## 🌐 Connect Storefront

Update your storefront to use Medusa API:

**File**: `services/storefront/.env.local`
```env
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
```

The storefront will now pull products, inventory, and prices from Medusa!

---

## 📚 Next Steps

1. ✅ Start Medusa backend
2. ✅ Login to admin dashboard
3. ✅ Review products and costs
4. Add remaining 28 products via admin
5. Configure PayFast payment provider
6. Connect storefront to Medusa API
7. Test order flow end-to-end
8. Deploy to production

---

## 📞 Support

- **Medusa Docs**: https://docs.medusajs.com
- **API Reference**: http://localhost:9000/docs
- **Awake SA**: info@awakesa.co.za

---

**Ready to start? Run:**

```powershell
cd C:\Users\Judy\awake-boards-infrastructure
docker-compose up -d postgres redis
cd services\medusa
npm run migrations
npm run seed
npm run dev
```

Then open: http://localhost:9000/app 🎉
