import asyncHandler from '../utils/asyncHandler.js'
import { recommendServices } from '../services/ai/recommendService.js'

// POST /api/ai/recommend-service
// req.validated.message was cleaned and checked by validateRecommendRequest.
// The AI only ever suggests; nothing here creates or changes a booking.
export const recommendService = asyncHandler(async (req, res) => {
  const result = await recommendServices(req.validated.message)
  res.status(200).json(result)
})
