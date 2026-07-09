import { Router } from 'express'
import { restrictTo } from '../middleware/role.middleware.js'
import { validate } from '../middleware/validate.middleware.js'
import { ROLES } from '../constants/roles.js'
import { assignLogin } from '../controllers/user.controller.js'
import { assignLoginSchema } from '../validations/user.validation.js'

const router = Router({ mergeParams: true })

router.post('/', restrictTo(ROLES.ADMIN), validate(assignLoginSchema), assignLogin)

export default router
