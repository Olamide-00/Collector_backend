import { Router } from 'express'
import { handlePaystackWebhook } from '../controllers/webhook.controller.js'

const router = Router()

router.post('/paystack', handlePaystackWebhook)

export default router
