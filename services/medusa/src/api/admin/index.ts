import { Router } from "express"
import cors from "cors"

export function attachAdminRoutes(app: Router) {
  const corsOptions = {
    origin: process.env.ADMIN_CORS?.split(",") || ["http://localhost:7000"],
    credentials: true,
  }

  // Custom admin API routes
  
  // GET /admin/products/costs - Get all products with cost and margin data
  app.get("/admin/products/costs", cors(corsOptions), async (req, res) => {
    try {
      const productService = req.scope.resolve("productService")
      const products = await productService.list({}, {
        relations: ["variants"],
      })

      const productsWithCosts = products.map(product => {
        const variant = product.variants?.[0]
        const priceExVAT = variant?.metadata?.priceExVAT || 0
        const costEUR = variant?.metadata?.costEUR || 0
        const exchangeRate = 19.85
        const costZAR = costEUR * exchangeRate
        const margin = priceExVAT > 0 ? ((priceExVAT - costZAR) / priceExVAT * 100).toFixed(2) : 0
        const profit = priceExVAT - costZAR

        return {
          id: product.id,
          title: product.title,
          handle: product.handle,
          sku: variant?.sku || "",
          costEUR,
          costZAR: Math.round(costZAR),
          priceExVAT: Math.round(priceExVAT),
          priceIncVAT: variant?.prices?.[0]?.amount ? variant.prices[0].amount / 100 : 0,
          marginPercent: margin,
          profitZAR: Math.round(profit),
          category: product.metadata?.category || "Unknown",
        }
      })

      res.json({
        products: productsWithCosts,
        summary: {
          totalProducts: productsWithCosts.length,
          averageMargin: (productsWithCosts.reduce((sum, p) => sum + parseFloat(p.marginPercent as string), 0) / productsWithCosts.length).toFixed(2),
          totalProfit: productsWithCosts.reduce((sum, p) => sum + p.profitZAR, 0),
        }
      })
    } catch (error) {
      res.status(500).json({
        message: "Error fetching product costs",
        error: error.message
      })
    }
  })

  // Example: GET /admin/custom
  app.get("/admin/custom", cors(corsOptions), (req, res) => {
    res.json({
      message: "Awake Boards SA - Custom Admin API"
    })
  })
}
