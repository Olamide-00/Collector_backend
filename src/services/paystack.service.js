import axios from "axios";
import crypto from "crypto";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import { HTTP } from "../constants/httpStatus.js";

// IMPORTANT: this client uses the Paystack *secret* key and must only ever run
// on the server. Never expose PAYSTACK_SECRET_KEY to the frontend.
const paystackClient = axios.create({
  baseURL: env.paystackBaseUrl,
  headers: {
    Authorization: `Bearer ${env.paystackSecretKey}`,
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

export async function createCustomer({ email, name, phone }) {
  const [firstName, ...rest] = name.trim().split(" ");
  const lastName = rest.join(" ") || firstName;

  try {
    const { data } = await paystackClient.post("/customer", {
      email,
      first_name: firstName,
      last_name: lastName,
      phone,
    });
    return data.data;
  } catch (err) {
    throw new ApiError(
      HTTP.BAD_GATEWAY,
      `Paystack customer creation failed: ${
        err.response?.data?.message ?? err.message
      }`
    );
  }
}

export async function createDedicatedVirtualAccount(customerCode) {
  try {
    const { data } = await paystackClient.post("/dedicated_account", {
      customer: customerCode,
      preferred_bank: env.paystackPreferredBank,
    });
    return data.data;
  } catch (err) {
    throw new ApiError(
      HTTP.BAD_GATEWAY,
      `Paystack dedicated account creation failed: ${
        err.response?.data?.message ?? err.message
      }`
    );
  }
}

export function verifyWebhookSignature(rawBody, signature) {
  if (!rawBody || !signature) return false;
  const hash = crypto
    .createHmac("sha512", env.paystackSecretKey)
    .update(rawBody)
    .digest("hex");
  return hash === signature;
}
