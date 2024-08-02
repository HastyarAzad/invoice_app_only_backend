
const BaseJoi = require("joi");
const JoiPhoneNumber = require("joi-phone-number");
const Joi = BaseJoi.extend(JoiPhoneNumber);

// validation for user id
exports.validate_id = (id, joiErrors) => {
  const schema = Joi.object({
    id: Joi.number().integer().min(1).required(),
  });

  return schema.validate({ id }, { messages: joiErrors });
};

// validation for user object
exports.validate_create_object = (obj, joiErrors) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
  });

  return schema.validate(obj, { messages: joiErrors });
};

// validation for user update object
exports.validate_update_object = (obj, joiErrors) => {
  const schema = Joi.object({
    email: Joi.string().email(),
  });

  return schema.validate(obj, { messages: joiErrors });
};

// validate_changePassword_object
exports.validate_change_password_object = (obj, joiErrors) => {
  const schema = Joi.object({
    old_password: Joi.string().min(8).required(),
    new_password: Joi.string().min(8).required(),
  });

  return schema.validate(obj, { messages: joiErrors });
};

// validate_login_object
exports.validate_login_object = (obj, joiErrors) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
  });

  return schema.validate(obj, { messages: joiErrors });
};
