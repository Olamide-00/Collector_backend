import { ApiError } from '../utils/ApiError.js'
import { HTTP } from '../constants/httpStatus.js'

export const validate = (schema, property = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[property], { abortEarly: false, stripUnknown: true })
  if (error) {
    const message = error.details.map((d) => d.message).join(', ')
    return next(new ApiError(HTTP.BAD_REQUEST, message))
  }
  req[property] = value
  next()
}
