import { Router } from 'express'
import { restrictTo } from '../middleware/role.middleware.js'
import { validate } from '../middleware/validate.middleware.js'
import { ROLES } from '../constants/roles.js'
import { addPayment, getPayments, editPayment } from '../controllers/payment.controller.js'
import {
  addPaymentSchema,
  editPaymentSchema,
  paymentIdParamSchema,
} from '../validations/payment.validation.js'

const router = Router({ mergeParams: true })

router.get('/', getPayments)
router.post('/', restrictTo(ROLES.ADMIN), validate(addPaymentSchema), addPayment)
router.patch(
  '/:paymentId',
  restrictTo(ROLES.ADMIN),
  validate(paymentIdParamSchema, 'params'),
  validate(editPaymentSchema),
  editPayment
)

export default router