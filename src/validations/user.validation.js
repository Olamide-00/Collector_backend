import Joi from "joi";

const phonePattern = /^\+?[0-9]{10,15}$/;

export const assignLoginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(4).required(),
  phone: Joi.string().pattern(phonePattern).required().messages({
    "string.pattern.base":
      "phone must be a valid phone number (10-15 digits, optional leading +)",
  }),
});
