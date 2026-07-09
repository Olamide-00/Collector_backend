import { HTTP } from '../constants/httpStatus.js'
import * as paystackService from '../services/paystack.service.js'
import * as paymentService from '../services/payment.service.js'
import { Collection } from '../models/Collection.model.js'

export async function handlePaystackWebhook(req, res) {
  const signature = req.headers['x-paystack-signature']
  const isValid = paystackService.verifyWebhookSignature(req.rawBody, signature)

  if (!isValid) {
    return res.sendStatus(HTTP.UNAUTHORIZED)
  }

  const event = req.body

  try {
    if (event.event === 'charge.success' && event.data?.customer?.customer_code) {
      const collection = await Collection.findOne({
        'paymentAccount.paystackCustomerCode': event.data.customer.customer_code,
      })

      if (collection) {
        await paymentService.recordPaystackPayment({
          collection,
          amount: event.data.amount / 100,
          reference: event.data.reference,
          paidAt: new Date(event.data.paid_at ?? event.data.paidAt ?? Date.now()),
        })
      }
    }
  } catch (err) {
    console.error('Failed to process Paystack webhook event:', err.message)
  }

  // Always acknowledge quickly so Paystack doesn't keep retrying.
  res.sendStatus(HTTP.OK)
}
