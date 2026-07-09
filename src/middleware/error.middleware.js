import { env } from '../config/env.js'
import { HTTP } from '../constants/httpStatus.js'

export function notFound(req, res) {
  res.status(HTTP.NOT_FOUND).json({ success: false, message: `Route not found: ${req.originalUrl}` })
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode && err.statusCode >= 400 ? err.statusCode : HTTP.INTERNAL_SERVER_ERROR

  if (!env.isProduction) {
    console.error(err)
  }

  res.status(statusCode).json({
    success: false,
    message: err.isOperational ? err.message : 'Something went wrong',
    ...(env.isProduction ? {} : { stack: err.stack }),
  })
}
