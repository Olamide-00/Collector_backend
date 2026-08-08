import { Collection } from "../models/Collection.model.js";
import { Payment } from "../models/Payment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { HTTP } from "../constants/httpStatus.js";
import {
  computeCollectionStatus,
  PAYMENT_SOURCE,
} from "../constants/collection.js";

export async function addPayment(collectionId, input, recordedBy) {
  const collection = await Collection.findById(collectionId);
  if (!collection) {
    throw new ApiError(HTTP.NOT_FOUND, "Collection not found");
  }

  if (input.amount > collection.remainingAmount) {
    throw new ApiError(
      HTTP.BAD_REQUEST,
      `Amount can't exceed the remaining balance of ${collection.remainingAmount}`
    );
  }

  const payment = await Payment.create({
    collection: collectionId,
    amount: input.amount,
    paymentDate: input.paymentDate,
    paymentTime: input.paymentTime,
    note: input.note,
    recordedByEmail: recordedBy.email,
    recordedByRole: recordedBy.role,
    source: input.source ?? PAYMENT_SOURCE.MANUAL,
    flutterwaveReference: input.flutterwaveReference,
  });

  collection.collectedAmount += input.amount;
  collection.remainingAmount = Math.max(
    collection.totalAmount - collection.collectedAmount,
    0
  );
  collection.status = computeCollectionStatus(
    collection.totalAmount,
    collection.collectedAmount
  );
  await collection.save();

  return payment;
}

export async function getPaymentsForCollection(collectionId) {
  return Payment.find({ collection: collectionId }).sort({ createdAt: 1 });
}

// Admin-only correction of a manually recorded payment's amount (and optionally
// its note). Flutterwave-sourced payments can't be edited here since they must
// match what actually landed in the dedicated account. Recomputes the parent
// collection's collectedAmount/remainingAmount/status from the delta rather
// than re-summing all payments.
export async function editPayment(collectionId, paymentId, input) {
  const payment = await Payment.findById(paymentId);
  if (!payment || payment.collection.toString() !== collectionId) {
    throw new ApiError(HTTP.NOT_FOUND, "Payment not found for this collection");
  }

  if (payment.source !== PAYMENT_SOURCE.MANUAL) {
    throw new ApiError(
      HTTP.BAD_REQUEST,
      "Only manually recorded payments can be edited"
    );
  }

  const collection = await Collection.findById(collectionId);
  if (!collection) {
    throw new ApiError(HTTP.NOT_FOUND, "Collection not found");
  }

  const delta = input.amount - payment.amount;
  const newCollectedAmount = collection.collectedAmount + delta;

  if (newCollectedAmount < 0) {
    throw new ApiError(
      HTTP.BAD_REQUEST,
      "Edited amount would result in a negative collected total"
    );
  }
  if (newCollectedAmount > collection.totalAmount) {
    throw new ApiError(
      HTTP.BAD_REQUEST,
      `Edited amount would exceed the collection's total amount of ${collection.totalAmount}`
    );
  }

  payment.amount = input.amount;
  if (input.note !== undefined) payment.note = input.note;
  await payment.save();

  collection.collectedAmount = newCollectedAmount;
  collection.remainingAmount = collection.totalAmount - newCollectedAmount;
  collection.status = computeCollectionStatus(
    collection.totalAmount,
    collection.collectedAmount
  );
  await collection.save();

  return payment;
}

// Called from the Flutterwave webhook when a transfer lands in a collection's
// dedicated account. Idempotent — safe to call again if Flutterwave retries the event.
export async function recordFlutterwavePayment({
  collection,
  amount,
  reference,
  paidAt,
}) {
  const existing = await Payment.findOne({ flutterwaveReference: reference });
  if (existing) return existing;

  const paymentDate = paidAt.toISOString().slice(0, 10);
  const paymentTime = paidAt.toISOString().slice(11, 16);

  return addPayment(
    collection._id,
    {
      amount,
      paymentDate,
      paymentTime,
      note: "Received via Flutterwave transfer",
      source: PAYMENT_SOURCE.FLUTTERWAVE,
      flutterwaveReference: reference,
    },
    { email: "flutterwave@webhook", role: "system" }
  );
}