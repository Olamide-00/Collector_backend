import { Collection } from '../models/Collection.model.js'
import { Payment } from '../models/Payment.model.js'
import { ApiError } from '../utils/ApiError.js'
import { HTTP } from '../constants/httpStatus.js'
import { computeCollectionStatus, PAYMENT_SOURCE } from '../constants/collection.js'

export async function addPayment(collectionId, input, recordedBy) {
  const collection = await Collection.findById(collectionId)
  if (!collection) {
    throw new ApiError(HTTP.NOT_FOUND, 'Collection not found')
  }

  if (input.amount > collection.remainingAmount) {
    throw new ApiError(
      HTTP.BAD_REQUEST,
      `Amount can't exceed the remaining balance of ${collection.remainingAmount}`
    )
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
    paystackReference: input.paystackReference,
  })

  collection.collectedAmount += input.amount
  collection.remainingAmount = Math.max(collection.totalAmount - collection.collectedAmount, 0)
  collection.status = computeCollectionStatus(collection.totalAmount, collection.collectedAmount)
  await collection.save()

  return payment
}

export async function getPaymentsForCollection(collectionId) {
  return Payment.find({ collection: collectionId }).sort({ createdAt: 1 })
}

// Called from the Paystack webhook when a transfer lands in a collection's
// dedicated account. Idempotent — safe to call again if Paystack retries the event.
export async function recordPaystackPayment({ collection, amount, reference, paidAt }) {
  const existing = await Payment.findOne({ paystackReference: reference })
  if (existing) return existing

  const paymentDate = paidAt.toISOString().slice(0, 10)
  const paymentTime = paidAt.toISOString().slice(11, 16)

  return addPayment(
    collection._id,
    {
      amount,
      paymentDate,
      paymentTime,
      note: 'Received via Paystack transfer',
      source: PAYMENT_SOURCE.PAYSTACK,
      paystackReference: reference,
    },
    { email: 'paystack@webhook', role: 'system' }
  )
}
