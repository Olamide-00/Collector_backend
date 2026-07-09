import { Router } from 'express'
import { protect } from '../middleware/auth.middleware.js'
import { restrictTo } from '../middleware/role.middleware.js'
import { validate } from '../middleware/validate.middleware.js'
import { ROLES } from '../constants/roles.js'
import {
  createCollection,
  getCollections,
  getCollection,
  retryAccount,
} from '../controllers/collection.controller.js'
import { createCollectionSchema, collectionIdParamSchema } from '../validations/collection.validation.js'
import paymentRoutes from './payment.routes.js'
import userRoutes from './user.routes.js'

const router = Router()

router.use(protect)

router.get('/', restrictTo(ROLES.ADMIN), getCollections)
router.post('/', restrictTo(ROLES.ADMIN), validate(createCollectionSchema), createCollection)
router.get('/:id', validate(collectionIdParamSchema, 'params'), getCollection)
router.post(
  '/:id/account/retry',
  restrictTo(ROLES.ADMIN),
  validate(collectionIdParamSchema, 'params'),
  retryAccount
)

router.use('/:id/payments', paymentRoutes)
router.use('/:id/login', userRoutes)

export default router
