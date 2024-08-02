
const validate_user = require("./authentication_validation");
const user_module = require("./authentication_module");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const {createResponse} = require("../../../utilities/create_response");
const { logger } = require("../../../config/pino.config");

const i18next = require("i18next");

function getErrorMessage(result) {
  if (result.errorOccured) {
    if (result.errorOccured.code) {
      if (i18next.exists(`prisma.${result.errorOccured.code}`)) {
        return `prisma.${result.errorOccured.code}`;
      }
      return "prisma.defaultPrismaError";
    }
    return "prisma.defaultPrismaError";
  }
  return null;
}

// get all user api
exports.getAll = async (req, res) => {

  const page = parseInt(req.query.page) || 1;
  const perPage = parseInt(req.query.perPage) || 30;

  const result = await user_module.getAllWithDeleted(page,perPage);
  const count = await user_module.getusersCount();
  const deletedCount = await user_module.getDeletedusersCount();
  
  const page_meta = {
    total: count,
    deleted: deletedCount,
    page: page,
    perPage: perPage,
    totalPages: Math.ceil(count/perPage)
  }
  
  const errorMessage = getErrorMessage(result);
  if (errorMessage) {
    return res.status(404).send(createResponse(req.t(errorMessage)));
  }

  // if result is empty return 404 error no record found, else return the
  if (result.length === 0) {
    page_meta.total = 0;
    page_meta.totalPages = 0;
    page_meta.page = 0;
    page_meta.perPage = 0;
    res.send(createResponse(req.t("noRecordFound"), [], page_meta));
    return;
  }

  // logger.info(result);
  // logger.info("page_meta: ", page_meta);
  // logger.info();
  logger.info(`returned ${result.length} users out of ${count} users`);
  res.send(createResponse(req.t("returnedAllValues"), result, page_meta));

};

// get a user by id api
exports.getById = async (req, res) => {
  const id = req.params.id;

    const joiErrors = i18next.getResourceBundle(
      req.i18n.language,
      "translation"
    ).joiErrors;

  // validate if id is correct
  const {error, value} = validate_user.validate_id(id, joiErrors);

  if (error) {
    logger.info({'message': error.details[0].message});
    res.status(404).send({'message': error.details[0].message});
    return;
  }
  
  const result = await user_module.getById(value.id);
  
  // logger.info("result of getById: ", result);
  // if result is empty return 404 error no user found, else return the user
  if (!result) {
    res.send(createResponse(req.t("noRecordFound")));
    return;
  }
  
  const errorMessage = getErrorMessage(result);
  if (errorMessage) {
    return res.status(404).send(createResponse(req.t(errorMessage)));
  }

  logger.info(`returned user with id ${value.id}`);
  res.send(createResponse(req.t("returnedSingleValue"), result));
};

// login a user api
exports.login = async (req, res) => {
  const joiErrors = i18next.getResourceBundle(
    req.i18n.language,
    "translation"
  ).joiErrors;

  // validate the req.body object
  const result1 = validate_user.validate_login_object(req.body, joiErrors);

  //check if error exists
  if (result1.error) {
    logger.info(createResponse(result1.error.details[0].message));
    res.status(404).send(createResponse(result1.error.details[0].message));
    return;
  }

  // check if result is an empty object
  if (Object.keys(result1.value).length === 0) {
    res.status(404).send(createResponse(req.t("noDataProvided")));
    return;
  }

  let user = result1.value;

  // check if the user exists in the database
  let userExists = await user_module.getByEmail(user.email);

  // console.log("USER EXISTS: ", userExists);

  const errorMessage = getErrorMessage(userExists);
  if (errorMessage) {
    return res.status(404).send(createResponse(req.t(errorMessage)));
  }

  if (userExists.length === 0) {
    res.status(404).send(createResponse(req.t("userNotFound")));
    return;
  }
  // console.log(userExists);

  userExists = userExists[0];

  // check if the password is correct
  const passwordMatch = await bcrypt.compare(
    user.password,
    userExists.password
  );

  if (!passwordMatch) {
    res.status(404).send(createResponse(req.t("passwordIncorrect")));
    return;
  }

  // // get the current time in iraq
  // const iraqTime = moment().tz("Asia/Baghdad").format("YYYY-MM-DD HH:mm:ss");
  
  // // get the time left for the shop, if it's greater than 24 hours, then create a token for 24 hours, else create a token for the time left
  // const timeLeft = moment(userExists.shop.end_date).diff(iraqTime, "minutes");
  // console.log(timeLeft);
  // if (timeLeft > 1440) {
  //   userExists.token = jwt.sign(
  //     { shop_id: userExists.shop_id, role: userExists.role },
  //     process.env.JWT_SECRET,
  //     { expiresIn: "24h" }
  //   );
  //   console.log("24h token created");
  // } else {
  //   userExists.token = jwt.sign(
  //     { shop_id: userExists.shop_id, role: userExists.role },
  //     process.env.JWT_SECRET,
  //     { expiresIn: `${timeLeft}m` }
  //   );
  //   console.log(`${timeLeft}m token created`);
  // }

  // a token for 24 hours
  const user_access_token = jwt.sign({ user: userExists, role: "USER" }, process.env.JWT_SECRET, { expiresIn: "24h" });
  const user_refresh_token = jwt.sign({ user: userExists, role: "USER" }, process.env.JWT_SECRET_REFRESH);
  
  userExists.user_access_token = user_access_token;
  userExists.user_refresh_token = user_refresh_token;

  delete userExists.password;
  // console.log(userExists);

  logger.info(`logged in user with id ${userExists.id}`);
  res.send(createResponse(req.t("loginSuccessful"), userExists));
};

// refresh token api
exports.refreshToken = async (req, res) => {

  // get the refresh token from the request body
  const refresh_token = req.body.refresh_token;

  // check if the refresh token exists
  if (!refresh_token) {
    res.status(404).send(createResponse(req.t("noRefreshTokenProvided")));
    return;
  }

  // verify the refresh token
  jwt.verify(refresh_token, process.env.JWT_SECRET_REFRESH, async (err, decoded) => {
    if (err) {
      res.status(404).send(createResponse(req.t("invalidRefreshToken")));
      return;
    }

    // create a new access token
    const user_access_token = jwt.sign({ user: decoded.user, role: "USER" }, process.env.JWT_SECRET, { expiresIn: "24h" });
    const user_refresh_token = jwt.sign({ user: decoded.user, role: "USER" }, process.env.JWT_SECRET_REFRESH);

    decoded.user.user_access_token = user_access_token;
    decoded.user.user_refresh_token = user_refresh_token;

    delete decoded.user.password;

    res.send(createResponse(req.t("refreshTokenSuccessful"), decoded.user));
  });

};

// insert a user into the database
exports.createOne = async (req, res) => {

  const joiErrors = i18next.getResourceBundle(
    req.i18n.language,
    "translation"
  ).joiErrors;

  // validate the req.body object
  const {error, value} = validate_user.validate_create_object(
    req.body,
    joiErrors
  );

  //check if error exists
  if (error) {
    logger.info({'message': error.details[0].message});
    res.status(404).send({'message': error.details[0].message});
    return;
  }

  // check if result is an empty object
  if (Object.keys(value).length === 0) {
    res.status(404).send(createResponse(req.t("noDataProvided")));
    return;
  }

  const user = value;
  // logger.info(user);

  // hash the password
  user.password = await bcrypt.hash(user.password, 10);

  try {
  
    // insert the user into the database
    let result = await user_module.createOne(user);

    // if result.errorOccured is true, return the error
    const errorMessage = getErrorMessage(result);
    if (errorMessage) {
      return res.status(404).send(createResponse(req.t(errorMessage)));
    }
  
    logger.info(`created user with id ${result.id}`);
    res.send(createResponse(req.t("createdSuccessful"), result));
  } catch (error) {
    logger.info(error);
    res.status(404).send(createResponse(req.t("prisma.defaultPrismaError")));
  }
};

// update a user based on it's id 
exports.updateByID = async(req, res) => {

  const id = req.params.id;

  const joiErrors = i18next.getResourceBundle(
    req.i18n.language,
    "translation"
  ).joiErrors;

  // validate the req.body object
  const result1 = validate_user.validate_update_object(
    req.body,
    joiErrors
  );

  // validate if id is correct
  const result2 = validate_user.validate_id(req.params.id, joiErrors);

  // logger.info(req.params.id);

  //check if error exists
  if (result1.error) {
    logger.info({'message': result1.error.details[0].message});
    res.status(404).send({'message': result1.error.details[0].message});
    return;
  }
  
  if (result2.error) {
    logger.info({'message': result2.error.details[0].message});
    res.status(404).send({'message': result2.error.details[0].message});
    return;
  }

  // check if result is an empty object
  if (Object.keys(result1.value).length === 0) {
    res.status(404).send(createResponse(req.t("noDataProvided")));
    return;
  }

  const user = result1.value;

  // check the role of the user
  const result = await user_module.updateByID(result2.value.id,user);
  
  const errorMessage = getErrorMessage(result);
  if (errorMessage) {
    return res.status(404).send(createResponse(req.t(errorMessage)));
  }

  logger.info(`updated user with id ${result.id}`);
  res.send(createResponse(req.t("updatedSuccessful"), result));
};

exports.changePassword = async (req, res) => {

  const id = req.params.id;

  const joiErrors = i18next.getResourceBundle(
    req.i18n.language,
    "translation"
  ).joiErrors;

  // validate the req.body object
  const result1 = validate_user.validate_change_password_object(
    req.body,
    joiErrors
  );

  // validate if id is correct
  const result2 = validate_user.validate_id(req.params.id, joiErrors);

  // logger.info(req.params.id);

  //check if error exists
  if (result1.error) {
    logger.info({'message': result1.error.details[0].message});
    res.status(404).send({'message': result1.error.details[0].message});
    return;
  }
  
  if (result2.error) {
    logger.info({'message': result2.error.details[0].message});
    res.status(404).send({'message': result2.error.details[0].message});
    return;
  }

  // check if result is an empty object
  if (Object.keys(result1.value).length === 0) {
    res.status(404).send(createResponse(req.t("noDataProvided")));
    return;
  }

  const passwords = result1.value;

  // get the user from the database
  const user = await user_module.getByIdWithPassword(result2.value.id);

  // check if user exists
  if (!user) {
    res.status(404).send(createResponse(req.t("noRecordFound")));
    return;
  }

  // check for errors
  const errorMessage = getErrorMessage(user);
  if (errorMessage) {
    return res.status(404).send(createResponse(req.t(errorMessage)));
  }

  // check if the old password is correct
  const isPasswordCorrect = await bcrypt.compare(passwords.old_password, user.password);

  // if the password is not correct return error
  if (!isPasswordCorrect) {
    res.status(404).send(createResponse(req.t("incorrectOldPassword")));
    return;
  }

  // hash the new password
  passwords.new_password = await bcrypt.hash(passwords.new_password, 10);

  // update the password
  const result = await user_module.updateByID(result2.value.id, {password: passwords.new_password});

  const errorMessage2 = getErrorMessage(result);
  if (errorMessage2) {
    return res.status(404).send(createResponse(req.t(errorMessage2)));
  }

  logger.info(`updated password for user with id ${result.id}`);
  res.send(createResponse(req.t("updatedSuccessful"), result));
}

exports.deleteByID = async (req, res) => {
  const id = req.params.id;

  const joiErrors = i18next.getResourceBundle(
    req.i18n.language,
    "translation"
  ).joiErrors;

  // validate if id is correct
  const {error,value} = validate_user.validate_id(
    id,
    joiErrors
  );

  if (error) {
    logger.info(createResponse(error.details[0].message));
    res.status(404).send(createResponse(error.details[0].message));
    return;
  }

  // delete the user inside the database
  const result = await user_module.deleteByID(value.id);

  const errorMessage = getErrorMessage(result);
  if (errorMessage) {
    return res.status(404).send(createResponse(req.t(errorMessage)));
  }
  
  logger.info(`deleted user with id ${result.id}`);
  res.send(createResponse(req.t("deletedSuccessful"), result));

};
