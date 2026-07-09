import Joi from 'joi'

export const addPaymentSchema = Joi.object({
  amount: Joi.number().positive().required(),
  paymentDate: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required(),
  paymentTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .required(),
  note: Joi.string().allow('', null).max(300),
})
