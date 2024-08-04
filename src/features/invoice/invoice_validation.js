
const BaseJoi = require("joi");
const JoiPhoneNumber = require("joi-phone-number");
const Joi = BaseJoi.extend(JoiPhoneNumber);

// validation for invoice id
exports.validate_id = (id, joiErrors) => {
  const schema = Joi.object({
    id: Joi.number().integer().min(1).required(),
  });

  return schema.validate({ id }, { messages: joiErrors });
};

// validation for invoice object
exports.validate_create_object = (obj, joiErrors) => {
  const schema = Joi.object({
    customer_id: Joi.number().integer().min(1).required(),
    invoice_line: Joi.array().items(Joi.object({
      product_id: Joi.number().integer().min(1).required(),
      quantity: Joi.number().integer().min(1).required(),
    })).required().min(1),
  });

  return schema.validate(obj, { messages: joiErrors });
};

// validation for invoice update object
exports.validate_update_object = (obj, joiErrors) => {
  const schema = Joi.object({
    customer_id: Joi.number().integer().min(1),
    date: Joi.date(),
    invoice_line: Joi.array().items(Joi.object({
      product_id: Joi.number().integer().min(1).required(),
      quantity: Joi.number().integer().min(0).required(),
    })),
  });

  return schema.validate(obj, { messages: joiErrors });
};
