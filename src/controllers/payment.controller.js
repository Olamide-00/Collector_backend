import { catchAsync } from '../utils/catchAsync.js'
import { sendSuccess } from '../utils/apiResponse.js'
import { HTTP } from '../constants/httpStatus.js'
import * as paymentService from '../services/payment.service.js'
import * as collectionService from '../services/collection.service.js'

export const addPayment = catchAsync(async (req, res) => {
  await collectionService.getCollectionById(req.params.id, req.user)
  const payment = await paymentService.addPayment(req.params.id, req.body, req.user)
  sendSuccess(res, HTTP.CREATED, 'Payment recorded', { payment })
})

export const getPayments = catchAsync(async (req, res) => {
  await collectionService.getCollectionById(req.params.id, req.user)
  const payments = await paymentService.getPaymentsForCollection(req.params.id)
  sendSuccess(res, HTTP.OK, 'Payments fetched', { payments })
})
