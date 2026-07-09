import { Router } from 'express'
import { restrictTo } from '../middleware/role.middleware.js'
import { validate } from '../middleware/validate.middleware.js'
import { ROLES } from '../constants/roles.js'
import { addPayment, getPayments } from '../controllers/payment.controller.js'
import { addPaymentSchema } from '../validations/payment.validation.js'

const router = Router({ mergeParams: true })

router.get('/', getPayments)
router.post('/', restrictTo(ROLES.ADMIN), validate(addPaymentSchema), addPayment)

export default router
