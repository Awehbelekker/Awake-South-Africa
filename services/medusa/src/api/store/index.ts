import { Router } from "express"

export function attachStoreRoutes(app: Router) {
  // Custom store API routes
  
  // Example: GET /store/custom
  app.get("/store/custom", (req, res) => {
    res.json({
      message: "Awake Boards SA - Custom Store API"
    })
  })
}
