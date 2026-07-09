import Joi from "joi";

const phonePattern = /^\+?[0-9]{10,15}$/;

export const createCollectionSchema = Joi.object({
  name: Joi.string().trim().min(1).max(120).required(),
  totalAmount: Joi.number().positive().required(),
  loginEmail: Joi.string().email().required(),
  loginPassword: Joi.string().min(4).required(),
  loginPhone: Joi.string().pattern(phonePattern).required().messages({
    "string.pattern.base":
      "loginPhone must be a valid phone number (10-15 digits, optional leading +)",
  }),
});

export const collectionIdParamSchema = Joi.object({
  id: Joi.string().hex().length(24).required(),
});
