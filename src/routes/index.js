import { Router } from 'express'
import authRoutes from './auth.routes.js'
import collectionRoutes from './collection.routes.js'
import webhookRoutes from './webhook.routes.js'

const router = Router()

router.use('/auth', authRoutes)
router.use('/collections', collectionRoutes)
router.use('/webhooks', webhookRoutes)

export default router
