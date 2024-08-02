
const BaseJoi = require("joi");
const JoiPhoneNumber = require("joi-phone-number");
const Joi = BaseJoi.extend(JoiPhoneNumber);

// validation for supplier id
exports.validate_id = (id, joiErrors) => {
  const schema = Joi.object({
    id: Joi.number().integer().min(1).required(),
  });

  return schema.validate({ id }, { messages: joiErrors });
};

// validation for supplier object
exports.validate_create_object = (obj, joiErrors) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(191).required(),
    phone: Joi.string().phoneNumber({
      defaultCountry: "IQ",
      format: "international",
      strict: true,
    }).required(),
  });

  return schema.validate(obj, { messages: joiErrors });
};

// validation for supplier update object
exports.validate_update_object = (obj, joiErrors) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(191),
    phone: Joi.string().phoneNumber({
      defaultCountry: "IQ",
      format: "international",
      strict: true,
    }),
  });

  return schema.validate(obj, { messages: joiErrors });
};
