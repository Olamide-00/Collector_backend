import { ApiError } from '../utils/ApiError.js'
import { HTTP } from '../constants/httpStatus.js'

export const restrictTo = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new ApiError(HTTP.FORBIDDEN, 'You do not have permission to perform this action'))
  }
  next()
}
