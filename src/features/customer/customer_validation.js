
const BaseJoi = require("joi");
const JoiPhoneNumber = require("joi-phone-number");
const Joi = BaseJoi.extend(JoiPhoneNumber);

// validation for customer id
exports.validate_id = (id, joiErrors) => {
  const schema = Joi.object({
    id: Joi.number().integer().min(1).required(),
  });

  return schema.validate({ id }, { messages: joiErrors });
};

// validation for customer object
exports.validate_create_object = (obj, joiErrors) => {
  const schema = Joi.object({
    first_name: Joi.string().min(2).max(191).required(),
    last_name: Joi.string().min(2).max(191).required(),
    address: Joi.string().min(2).max(191).required(),
    phone: Joi.string().phoneNumber({
      defaultCountry: "IQ",
      format: "international",
      strict: true,
    }).required(),
    balance: Joi.number().precision(2).min(0).required(),
  });

  return schema.validate(obj, { messages: joiErrors });
};

// validation for customer update object
exports.validate_update_object = (obj, joiErrors) => {
  const schema = Joi.object({
    first_name: Joi.string().min(2).max(191),
    last_name: Joi.string().min(2).max(191),
    address: Joi.string().min(2).max(191),
    phone: Joi.string().phoneNumber({
      defaultCountry: "IQ",
      format: "international",
      strict: true,
    }),
  });

  return schema.validate(obj, { messages: joiErrors });
};

// validation for customer patch object
exports.validate_patch_object = (obj, joiErrors) => {
  const schema = Joi.object({
    // add or remove balance field 
    transaction_type: Joi.string().valid("DEPOSIT", "WITHDRAW").required(),
    balance: Joi.number().precision(2).min(0),
  });

  return schema.validate(obj, { messages: joiErrors });
};
