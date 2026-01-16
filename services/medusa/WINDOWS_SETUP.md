# 🚀 Medusa Backend - Windows Local Setup (No Docker)

Since Docker virtualization is not available, here's how to run Medusa locally on Windows:

---

## 📋 Prerequisites

### 1. Install PostgreSQL 15

**Download**: https://www.postgresql.org/download/windows/

**During installation:**
- Port: 5432
- Username: postgres
- Password: `medusa_password` (or your choice)
- Create database: `medusa`

**After installation**, create the database:
```powershell
# Open PowerShell as Administrator
psql -U postgres

# In psql prompt:
CREATE DATABASE medusa;
\q
```

### 2. Install Redis (Windows)

**Option A: Redis for Windows**
Download from: https://github.com/microsoftarchive/redis/releases
- Latest: Redis-x64-3.2.100.msi
- Install to: C:\Program Files\Redis
- Run as Windows Service

**Option B: Memurai (Redis alternative for Windows)**
Download from: https://www.memurai.com/get-memurai
- Free developer version available
- Includes GUI

**Test Redis:**
```powershell
redis-cli ping
# Should respond: PONG
```

### 3. Node.js 18+

Already installed ✅

---

## ⚙️ Configuration

### Update .env file

**File**: `C:\Users\Judy\awake-boards-infrastructure\.env`

Update these values:
```env
# Local PostgreSQL (no docker)
MEDUSA_DATABASE_URL=postgres://postgres:medusa_password@localhost:5432/medusa

# Local Redis (no docker)
MEDUSA_REDIS_URL=redis://localhost:6379

# Keep existing secrets
MEDUSA_JWT_SECRET=awake_jwt_secret_key_2026_super_secure_string
MEDUSA_COOKIE_SECRET=awake_cookie_secret_2026_super_secure_string
MEDUSA_STORE_CORS=http://localhost:3000,https://awakesa.co.za
MEDUSA_ADMIN_CORS=http://localhost:7000,https://admin.awakesa.co.za

# Storefront
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
```

### Create local .env for Medusa

**File**: `services/medusa/.env`

```env
DATABASE_URL=postgres://postgres:medusa_password@localhost:5432/medusa
REDIS_URL=redis://localhost:6379
JWT_SECRET=awake_jwt_secret_key_2026_super_secure_string
COOKIE_SECRET=awake_cookie_secret_2026_super_secure_string
STORE_CORS=http://localhost:3000
ADMIN_CORS=http://localhost:7000
NODE_ENV=development
```

---

## 🚀 Start Medusa Backend

```powershell
# Navigate to medusa directory
cd C:\Users\Judy\awake-boards-infrastructure\services\medusa

# Run database migrations
npm run migrations

# Seed products (8 main products)
npm run seed

# Start development server
npm run dev
```

**Expected output:**
```
info:    Server is ready on port: 9000
info:    Admin listening on port: 7001
```

---

## 🌐 Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| **Admin Dashboard** | http://localhost:7001 | admin@awakesa.co.za / awake2026admin |
| **API** | http://localhost:9000 | - |
| **Storefront** | http://localhost:3000 | - |

---

## 📊 View Costs & Margins

### In Admin Dashboard:
1. Go to http://localhost:7001
2. Login: `admin@awakesa.co.za` / `awake2026admin`
3. Click **Products** in sidebar
4. Click any product to see:
   - **Metadata → costEUR**: EUR cost price
   - **Variants → Price**: ZAR retail price
   - Calculate margin: `((price - (costEUR × 19.85)) / price) × 100`

### Via API:
```powershell
# Get cost analysis for all products
Invoke-WebRequest -Uri "http://localhost:9000/admin/products/costs" | ConvertFrom-Json
```

---

## 🔧 Database Management

### Connect to PostgreSQL:
```powershell
psql -U postgres -d medusa
```

### View all products:
```sql
SELECT id, title, metadata FROM product;
```

### Check product costs:
```sql
SELECT 
  p.title,
  p.metadata->>'costEUR' as cost_eur,
  v.metadata->>'costZAR' as cost_zar,
  v.prices->0->>'amount' as price_zar
FROM product p
LEFT JOIN product_variant v ON v.product_id = p.id;
```

### Reset database:
```powershell
# In psql:
DROP DATABASE medusa;
CREATE DATABASE medusa;
\q

# Then re-run:
npm run migrations
npm run seed
```

---

## 🐛 Troubleshooting

### PostgreSQL connection error

**Error**: `ECONNREFUSED localhost:5432`

**Fix**:
```powershell
# Check if PostgreSQL service is running
Get-Service -Name postgresql*

# Start service if stopped
Start-Service postgresql-x64-15

# Or restart
Restart-Service postgresql-x64-15
```

### Redis connection error

**Error**: `ECONNREFUSED localhost:6379`

**Fix**:
```powershell
# Check Redis service
Get-Service -Name Redis

# Start Redis service
Start-Service Redis

# Or if using Memurai:
Start-Service Memurai
```

### Port 9000 already in use

```powershell
# Find what's using port 9000
netstat -ano | findstr :9000

# Kill process (replace <PID> with actual PID)
taskkill /PID <PID> /F

# Or change Medusa port in medusa-config.js:
# Add: port: 9001
```

### Migration errors

```powershell
# Clear and recreate database
psql -U postgres

DROP DATABASE medusa;
CREATE DATABASE medusa;
\q

# Re-run migrations
cd C:\Users\Judy\awake-boards-infrastructure\services\medusa
npm run migrations
npm run seed
```

---

## 📦 Products Included

The seed includes **8 complete products**:

### Jetboards (4)
1. RÄVIK Explore XR 4 - R241,139 (€5,950 cost)
2. RÄVIK Adventure XR 4 - R349,024 (€8,450 cost)
3. RÄVIK Ultimate XR 4 - R402,967 (€9,750 cost)
4. BRABUS Shadow ⭐ - R452,216 (€10,950 cost)

### eFoils (4)
5. VINGA Adventure LR 4 - R322,052 (€7,800 cost)
6. VINGA Adventure XR 4 - R362,509 (€8,780 cost)
7. VINGA Ultimate LR 4 - R349,024 (€8,450 cost)
8. VINGA Ultimate XR 4 - R389,481 (€9,430 cost)

**To add remaining 28 products:**
- Use Admin Dashboard → Products → Add Product
- Or import CSV
- Or extend seed.json file

---

## 💰 Cost & Margin Calculation

Each product has:
- **costEUR**: Base cost in euros
- **costZAR**: `costEUR × 19.85`
- **priceExVAT**: Retail price excluding VAT
- **priceIncVAT**: Final price (includes 15% VAT)
- **margin**: `((priceExVAT - costZAR) / priceExVAT) × 100`

### Example: RÄVIK Explore XR 4
```
Cost EUR: €5,950
Cost ZAR: R118,108 (5,950 × 19.85)
Price ex VAT: R209,686
Price inc VAT: R241,139 (209,686 × 1.15)
Profit: R91,578 (209,686 - 118,108)
Margin: 43.68%
```

---

## 🔄 Connect to Vercel Storefront

Your storefront at **https://storefront-teal-three.vercel.app** needs to connect to Medusa:

### Option 1: Use Vercel-deployed Medusa (Recommended)
Deploy Medusa to Vercel or Railway, then update:
```env
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://your-medusa.vercel.app
```

### Option 2: Expose local Medusa (Development only)
Use ngrok to expose localhost:
```powershell
ngrok http 9000
```
Then update Vercel env:
```env
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://abc123.ngrok.io
```

---

## 📝 Quick Commands Reference

```powershell
# Start Medusa dev server
cd C:\Users\Judy\awake-boards-infrastructure\services\medusa
npm run dev

# Run migrations
npm run migrations

# Seed products
npm run seed

# Build for production
npm run build

# Start production server
npm run start

# Check PostgreSQL status
Get-Service postgresql*

# Check Redis status
Get-Service Redis

# Connect to database
psql -U postgres -d medusa
```

---

## 🎯 Next Steps

1. ✅ Install PostgreSQL & Redis locally
2. ✅ Update .env with local connection strings
3. ✅ Run `npm run migrations`
4. ✅ Run `npm run seed`
5. ✅ Start dev server: `npm run dev`
6. ✅ Access admin: http://localhost:7001
7. Add remaining 28 products via admin
8. Configure PayFast payment
9. Deploy to production (Railway/Vercel)
10. Connect storefront to Medusa API

---

**Ready? Start here:**

```powershell
cd C:\Users\Judy\awake-boards-infrastructure\services\medusa
npm run dev
```

Then visit: **http://localhost:7001** 🎉

---

## 📞 Support

- **Medusa Docs**: https://docs.medusajs.com
- **PostgreSQL Help**: https://www.postgresql.org/docs/
- **Redis Windows**: https://github.com/microsoftarchive/redis
- **Awake SA**: info@awakesa.co.za
