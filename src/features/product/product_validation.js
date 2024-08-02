
const BaseJoi = require("joi");
const JoiPhoneNumber = require("joi-phone-number");
const Joi = BaseJoi.extend(JoiPhoneNumber);

// validation for product id
exports.validate_id = (id, joiErrors) => {
  const schema = Joi.object({
    id: Joi.number().integer().min(1).required(),
  });

  return schema.validate({ id }, { messages: joiErrors });
};

// validation for product object
exports.validate_create_object = (obj, joiErrors) => {
  const schema = Joi.object({
    supplier_id: Joi.number().integer().min(1).required(),
    name: Joi.string().min(3).max(255).required(),
    barcode: Joi.string().min(3).max(255).required(),
    quantity: Joi.number().integer().min(1).required(),
    price: Joi.number().precision(2).min(0).required(),
    image: Joi.string().required(),
  });

  return schema.validate(obj, { messages: joiErrors });
};

// validation for product update object
exports.validate_update_object = (obj, joiErrors) => {
  const schema = Joi.object({
    supplier_id: Joi.number().integer().min(1),
    name: Joi.string().min(3).max(255),
    barcode: Joi.string().min(3).max(255),
    price: Joi.number().precision(2).min(0),
    image: Joi.string(),
  });

  return schema.validate(obj, { messages: joiErrors });
};

// validation for product patch object
exports.validate_patch_object = (obj, joiErrors) => {
  const schema = Joi.object({
    transaction_type: Joi.string().valid("INPUT", "OUTPUT").required(),
    quantity: Joi.number().integer().min(1).required(),
  });

  return schema.validate(obj, { messages: joiErrors });
};
