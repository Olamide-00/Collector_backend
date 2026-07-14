import { HTTP } from "../constants/httpStatus.js";
import * as flutterwaveService from "../services/flutterwave.js";
import * as paymentService from "../services/payment.service.js";
import { Collection } from "../models/Collection.model.js";

export async function handleFlutterwaveWebhook(req, res) {
  const signature = req.headers["flutterwave-signature"];
  const isValid = flutterwaveService.verifyWebhookSignature(
    req.rawBody,
    signature
  );

  if (!isValid) {
    return res.sendStatus(HTTP.UNAUTHORIZED);
  }

  const event = req.body;

  try {
    if (
      event.type === "charge.completed" &&
      event.data?.status === "succeeded" &&
      event.data?.customer?.id
    ) {
      const collection = await Collection.findOne({
        "paymentAccount.flutterwaveCustomerId": event.data.customer.id,
      });

      if (collection) {
        await paymentService.recordFlutterwavePayment({
          collection,
          amount: event.data.amount,
          reference: event.data.reference,
          paidAt: new Date(event.data.created_datetime),
        });
      }
    }
  } catch (err) {
    console.error("Failed to process Flutterwave webhook event:", err.message);
  }

  // Always acknowledge quickly so Flutterwave doesn't keep retrying.
  res.sendStatus(HTTP.OK);
}
