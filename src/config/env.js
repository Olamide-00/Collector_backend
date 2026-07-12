import "dotenv/config";
import Joi from "joi";

const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "production", "test")
    .default("development"),
  PORT: Joi.number().default(5000),
  MONGO_URI: Joi.string()
    .required()
    .messages({ "any.required": "MONGO_URI is required in .env" }),
  JWT_SECRET: Joi.string().min(16).required().messages({
    "any.required": "JWT_SECRET is required in .env (min 16 chars)",
  }),
  JWT_EXPIRES_IN: Joi.string().default("7d"),
  FLUTTERWAVE_CLIENT_ID: Joi.string()
    .required()
    .messages({ "any.required": "FLUTTERWAVE_CLIENT_ID is required in .env" }),
  FLUTTERWAVE_CLIENT_SECRET: Joi.string().required().messages({
    "any.required": "FLUTTERWAVE_CLIENT_SECRET is required in .env",
  }),
  FLUTTERWAVE_BASE_URL: Joi.string()
    .required()
    .messages({ "any.required": "FLUTTERWAVE_BASE_URL is required in .env" }),
  FLUTTERWAVE_SECRET_HASH: Joi.string().required().messages({
    "any.required": "FLUTTERWAVE_SECRET_HASH is required in .env",
  }),
  FLUTTERWAVE_CURRENCY: Joi.string().default("NGN"),
  FLUTTERWAVE_PREFERRED_BANK: Joi.string().allow("").optional(),
  CLIENT_URL: Joi.string().default("http://localhost:5173"),
}).unknown(true);

const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
  console.error(`❌ Invalid environment configuration: ${error.message}`);
  process.exit(1);
}

export const env = {
  nodeEnv: envVars.NODE_ENV,
  port: envVars.PORT,
  mongoUri: envVars.MONGO_URI,
  jwtSecret: envVars.JWT_SECRET,
  jwtExpiresIn: envVars.JWT_EXPIRES_IN,

  flutterwaveClientId: envVars.FLUTTERWAVE_CLIENT_ID,
  flutterwaveClientSecret: envVars.FLUTTERWAVE_CLIENT_SECRET,
  flutterwaveBaseUrl: envVars.FLUTTERWAVE_BASE_URL,
  flutterwaveSecretHash: envVars.FLUTTERWAVE_SECRET_HASH,
  flutterwaveCurrency: envVars.FLUTTERWAVE_CURRENCY,
  flutterwavePreferredBank: envVars.FLUTTERWAVE_PREFERRED_BANK,

  clientUrl: envVars.CLIENT_URL,
  isProduction: envVars.NODE_ENV === "production",
};
