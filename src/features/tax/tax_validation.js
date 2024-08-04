
const BaseJoi = require("joi");
const JoiPhoneNumber = require("joi-phone-number");
const Joi = BaseJoi.extend(JoiPhoneNumber);

// validation for tax id
exports.validate_id = (id, joiErrors) => {
  const schema = Joi.object({
    id: Joi.number().integer().min(1).max(100).required(),
  });

  return schema.validate({ id }, { messages: joiErrors });
};


// validation for tax patch object
exports.validate_patch_object = (obj, joiErrors) => {
  const schema = Joi.object({
    rate: Joi.number().min(1).max(100),
    threshold: Joi.number().min(1),
  });

  return schema.validate(obj, { messages: joiErrors });
};
