import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import { env } from "./config/env.js";
import routes from "./routes/index.js";
import { notFound, errorHandler } from "./middleware/error.middleware.js";
import { apiLimiter } from "./middleware/rateLimiter.middleware.js";

const app = express();

// Trust Vercel's reverse proxy so Express and express-rate-limit
// can correctly determine the client's IP address.
app.set("trust proxy", 1);

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://kollecsion.vercel.app",
];

app.use(helmet());

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests without an Origin header (Postman, curl, etc.)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);

app.use(compression());
app.use(morgan(env.isProduction ? "combined" : "dev"));

app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "API is healthy",
  });
});

app.use("/api", apiLimiter, routes);

app.use(notFound);
app.use(errorHandler);

export default app;
