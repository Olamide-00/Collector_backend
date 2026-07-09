import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import { env } from './config/env.js'
import routes from './routes/index.js'
import { notFound, errorHandler } from './middleware/error.middleware.js'
import { apiLimiter } from './middleware/rateLimiter.middleware.js'

const app = express()

app.use(helmet())
app.use(cors({ origin: env.clientUrl }))
app.use(compression())
app.use(morgan(env.isProduction ? 'combined' : 'dev'))

// Captures the raw request body (needed to verify the Paystack webhook signature)
// while still parsing JSON normally for every other route.
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf
    },
  })
)
app.use(express.urlencoded({ extended: true }))

app.get('/health', (req, res) => res.json({ success: true, message: 'API is healthy' }))

app.use('/api', apiLimiter, routes)

app.use(notFound)
app.use(errorHandler)

export default app
