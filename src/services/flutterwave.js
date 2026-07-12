import axios from "axios";
import crypto from "crypto";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import { HTTP } from "../constants/httpStatus.js";

// IMPORTANT: this client uses the Flutterwave *client secret* to mint OAuth tokens
// and must only ever run on the server. Never expose FLUTTERWAVE_CLIENT_SECRET to the frontend.

const TOKEN_URL =
  "https://idp.flutterwave.com/realms/flutterwave/protocol/openid-connect/token";

// in-memory token cache — avoids minting a new token on every request
let cachedToken = null;
let cachedTokenExpiresAt = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < cachedTokenExpiresAt) {
    return cachedToken;
  }

  try {
    const { data } = await axios.post(
      TOKEN_URL,
      new URLSearchParams({
        client_id: env.flutterwaveClientId,
        client_secret: env.flutterwaveClientSecret,
        grant_type: "client_credentials",
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 15000,
      }
    );

    cachedToken = data.access_token;
    // refresh 60s before actual expiry to avoid using a stale token mid-request
    cachedTokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
    return cachedToken;
  } catch (err) {
    throw new ApiError(
      HTTP.BAD_GATEWAY,
      `Flutterwave auth failed: ${err.response?.data?.message ?? err.message}`
    );
  }
}

async function flutterwaveClient() {
  const token = await getAccessToken();
  return axios.create({
    baseURL: env.flutterwaveBaseUrl,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    timeout: 15000,
  });
}

// normalizes a local Nigerian number (0803...) into { country_code, number } shape
function toFlutterwavePhone(phone) {
  const digitsOnly = phone.replace(/\D/g, "");
  const local = digitsOnly.startsWith("0") ? digitsOnly.slice(1) : digitsOnly;
  return { country_code: "234", number: local };
}

export async function createCustomer({ email, name, phone }) {
  const [firstName, ...rest] = name.trim().split(" ");
  const lastName = rest.join(" ") || firstName;
  const client = await flutterwaveClient();

  try {
    const { data } = await client.post("/customers", {
      email,
      name: { first: firstName, last: lastName },
      phone: toFlutterwavePhone(phone),
    });
    return data.data;
  } catch (err) {
    throw new ApiError(
      HTTP.BAD_GATEWAY,
      `Flutterwave customer creation failed: ${
        err.response?.data?.message ?? err.message
      }`
    );
  }
}

export async function createDedicatedVirtualAccount(customerId) {
  const client = await flutterwaveClient();

  try {
    const { data } = await client.post("/virtual-accounts", {
      reference: `dva-${customerId}-${Date.now()}`,
      customer_id: customerId,
      amount: 0, // 0 = static/permanent account, reusable across payments
      currency: env.flutterwaveCurrency ?? "NGN",
      account_type: "static",
      bank_code: env.flutterwavePreferredBank,
    });
    return data.data;
  } catch (err) {
    throw new ApiError(
      HTTP.BAD_GATEWAY,
      `Flutterwave dedicated account creation failed: ${
        err.response?.data?.message ?? err.message
      }`
    );
  }
}

// v4 webhooks sign with HMAC-SHA256(secretHash) -> base64, sent as `flutterwave-signature`
export function verifyWebhookSignature(rawBody, signature) {
  if (!rawBody || !signature) return false;
  const hash = crypto
    .createHmac("sha256", env.flutterwaveSecretHash)
    .update(rawBody)
    .digest("base64");
  return hash === signature;
}
