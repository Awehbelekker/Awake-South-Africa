# 🏄 Awake Boards SA

**Self-Hosted E-Commerce Platform for South Africa's Premium eFoil Distributor**

## 🌊 Overview

Complete self-hosted e-commerce infrastructure featuring:

- **Storefront** - Next.js 14 with dark Scandinavian theme
- **E-Commerce** - Medusa headless commerce
- **Booking** - Cal.com for demo rides
- **CRM** - Twenty for customer relationships
- **Support** - Chatwoot for live chat
- **Automation** - n8n workflow engine
- **Analytics** - Metabase dashboards
- **Auth** - Authentik SSO
- **Monitoring** - Uptime Kuma

## 🇿🇦 South Africa Features

- **PayFast** payment gateway integration
- **ZAR** currency with 15% VAT
- **SA Provinces** for shipping
- **WhatsApp** support integration

## 🚀 Quick Start

### 1. Clone & Configure

```bash
git clone https://github.com/Awehbelekker/Awake-South-Africa.git
cd Awake-South-Africa
cp .env.example .env
# Edit .env with your values
```

### 2. Start Services

```bash
docker-compose up -d
```

### 3. Access Services

| Service | URL | Description |
|---------|-----|-------------|
| Storefront | http://localhost:3000 | Customer website |
| Medusa API | http://localhost:9000 | E-commerce backend |
| Cal.com | http://localhost:3001 | Demo bookings |
| Twenty CRM | http://localhost:3002 | Customer management |
| Chatwoot | http://localhost:3003 | Live chat support |
| Metabase | http://localhost:3004 | Analytics |
| Uptime Kuma | http://localhost:3005 | Monitoring |
| n8n | http://localhost:5678 | Automation |
| Authentik | http://localhost:9080 | SSO |

## 📦 Admin Features

### Upload Images & Logos
1. Access Medusa Admin at http://localhost:7000
2. Go to **Settings** → **Store Details**
3. Upload your logo and brand assets
4. For products: **Products** → **Edit** → **Media** section

### Configure Store
- Currency: ZAR (South African Rand)
- Tax Rate: 15% VAT (automatic)
- Region: South Africa

## 🔧 Email Configuration

Your GoDaddy email is pre-configured:
```
SMTP Host: smtpout.secureserver.net
SMTP Port: 465
Email: awakesa-dot-co-dot-za@...godaddy.com
```

Just add your password in the `.env` file.

## ☁️ Hosting Recommendations

### Option A: Self-Hosted (Recommended for SA)
- **Pros**: Full control, no egress costs, data stays in SA
- **Cons**: Need to manage server
- **Cost**: ~R500-R1500/month for VPS

### Option B: Hybrid (Vercel + Self-Hosted)
- Deploy **Storefront** to Vercel (free tier)
- Keep backend services on local server/VPS
- Best of both worlds

### Option C: Full Cloud
- More expensive for backend services
- Better for scaling

**Recommendation**: Start with self-hosted on a local machine for testing, then move to a South African VPS (e.g., Afrihost, Hetzner SA) for production.

## 📁 Project Structure

```
awake-boards-infrastructure/
├── docker-compose.yml      # All services
├── .env.example            # Configuration template
├── services/
│   └── storefront/         # Next.js website
│       ├── src/
│       │   ├── app/        # Pages
│       │   ├── components/ # UI components
│       │   ├── lib/        # Utilities
│       │   └── store/      # State management
│       └── public/         # Static files
├── n8n/workflows/          # Automation workflows
└── docker/postgres/        # Database init
```

## 🔐 Generate Secrets

Run this to generate secure secrets:
```powershell
# PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
```

## 📞 Support

- Email: info@awakesa.co.za
- WhatsApp: +27 XXX XXX XXXX

---

**Built with ❤️ for South African waters 🇿🇦**
