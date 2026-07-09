import { Router } from 'express'
import { login, getMe } from '../controllers/auth.controller.js'
import { validate } from '../middleware/validate.middleware.js'
import { protect } from '../middleware/auth.middleware.js'
import { loginSchema } from '../validations/auth.validation.js'
import { authLimiter } from '../middleware/rateLimiter.middleware.js'

const router = Router()

router.post('/login', authLimiter, validate(loginSchema), login)
router.get('/me', protect, getMe)

export default router
