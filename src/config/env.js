import 'dotenv/config'
import Joi from 'joi'

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(5000),
  MONGO_URI: Joi.string().required().messages({ 'any.required': 'MONGO_URI is required in .env' }),
  JWT_SECRET: Joi.string().min(16).required().messages({ 'any.required': 'JWT_SECRET is required in .env (min 16 chars)' }),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  PAYSTACK_SECRET_KEY: Joi.string().required().messages({ 'any.required': 'PAYSTACK_SECRET_KEY is required in .env' }),
  PAYSTACK_BASE_URL: Joi.string().uri().default('https://api.paystack.co'),
  PAYSTACK_PREFERRED_BANK: Joi.string().default('wema-bank'),
  CLIENT_URL: Joi.string().default('http://localhost:5173'),
}).unknown(true)

const { error, value: envVars } = envSchema.validate(process.env)

if (error) {
  console.error(`❌ Invalid environment configuration: ${error.message}`)
  process.exit(1)
}

export const env = {
  nodeEnv: envVars.NODE_ENV,
  port: envVars.PORT,
  mongoUri: envVars.MONGO_URI,
  jwtSecret: envVars.JWT_SECRET,
  jwtExpiresIn: envVars.JWT_EXPIRES_IN,
  paystackSecretKey: envVars.PAYSTACK_SECRET_KEY,
  paystackBaseUrl: envVars.PAYSTACK_BASE_URL,
  paystackPreferredBank: envVars.PAYSTACK_PREFERRED_BANK,
  clientUrl: envVars.CLIENT_URL,
  isProduction: envVars.NODE_ENV === 'production',
}
