const validate_customer = require("./customer_validation");
const customer_module = require("./customer_module");

const { createResponse } = require("../../../utilities/create_response");
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

// get all customer api
exports.getAll = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const perPage = parseInt(req.query.perPage) || 30;

  const result = await customer_module.getAllWithDeleted(page, perPage);
  const count = await customer_module.getcustomersCount();
  const deletedCount = await customer_module.getDeletedcustomersCount();

  const page_meta = {
    total: count,
    deleted: deletedCount,
    page: page,
    perPage: perPage,
    totalPages: Math.ceil(count / perPage),
  };

  const errorMessage = getErrorMessage(result);
  if (errorMessage) {
    return res.status(500).send(createResponse(req.t(errorMessage)));
  }

  // if result is empty return 404 error no record found, else return the
  if (result.length === 0) {
    page_meta.total = 0;
    page_meta.totalPages = 0;
    page_meta.page = 0;
    page_meta.perPage = 0;
    res.status(404).send(createResponse(req.t("noRecordFound"), [], page_meta));
    return;
  }

  // logger.info(result);
  // logger.info("page_meta: ", page_meta);
  // logger.info();
  logger.info(`returned ${result.length} customers out of ${count} customers`);
  res.send(createResponse(req.t("returnedAllValues"), result, page_meta));
};

// get a customer by id api
exports.getById = async (req, res) => {
  const id = req.params.id;

  const joiErrors = i18next.getResourceBundle(
    req.i18n.language,
    "translation"
  ).joiErrors;

  // validate if id is correct
  const { error, value } = validate_customer.validate_id(id, joiErrors);

  if (error) {
    logger.info({ message: error.details[0].message });
    res.status(400).send({ message: error.details[0].message });
    return;
  }

  const result = await customer_module.getById(value.id);

  // logger.info("result of getById: ", result);
  // if result is empty return 404 error no customer found, else return the customer
  if (!result) {
    res.status(404).send(createResponse(req.t("noRecordFound")));
    return;
  }

  const errorMessage = getErrorMessage(result);
  if (errorMessage) {
    return res.status(500).send(createResponse(req.t(errorMessage)));
  }

  logger.info(`returned customer with id ${value.id}`);
  res.send(createResponse(req.t("returnedSingleValue"), result));
};

// insert a customer into the database
exports.createOne = async (req, res) => {
  const joiErrors = i18next.getResourceBundle(
    req.i18n.language,
    "translation"
  ).joiErrors;

  // validate the req.body object
  const { error, value } = validate_customer.validate_create_object(
    req.body,
    joiErrors
  );

  //check if error exists
  if (error) {
    logger.info({ message: error.details[0].message });
    res.status(400).send({ message: error.details[0].message });
    return;
  }

  // check if result is an empty object
  if (Object.keys(value).length === 0) {
    res.status(400).send(createResponse(req.t("noDataProvided")));
    return;
  }

  const customer = value;
  // logger.info(customer);

  try {
    // insert the customer into the database
    let result = await customer_module.createOne(customer);

    // if result.errorOccured is true, return the error
    const errorMessage = getErrorMessage(result);
    if (errorMessage) {
      return res.status(404).send(createResponse(req.t(errorMessage)));
    }

    logger.info(`created customer with id ${result.id}`);
    res.send(createResponse(req.t("createdSuccessful"), result));
  } catch (error) {
    logger.info(error);
    res.status(500).send(createResponse(req.t("prisma.defaultPrismaError")));
  }
};

// update a customer based on it's id
exports.updateByID = async (req, res) => {
  const id = req.params.id;

  const joiErrors = i18next.getResourceBundle(
    req.i18n.language,
    "translation"
  ).joiErrors;

  // validate the req.body object
  const result1 = validate_customer.validate_update_object(req.body, joiErrors);

  // validate if id is correct
  const result2 = validate_customer.validate_id(req.params.id, joiErrors);

  // logger.info(req.params.id);

  //check if error exists
  if (result1.error) {
    logger.info({ message: result1.error.details[0].message });
    res.status(404).send({ message: result1.error.details[0].message });
    return;
  }

  if (result2.error) {
    logger.info({ message: result2.error.details[0].message });
    res.status(404).send({ message: result2.error.details[0].message });
    return;
  }

  // check if result is an empty object
  if (Object.keys(result1.value).length === 0) {
    res.status(400).send(createResponse(req.t("noDataProvided")));
    return;
  }

  const customer = result1.value;

  // check the role of the customer
  const result = await customer_module.updateByID(result2.value.id, customer);

  const errorMessage = getErrorMessage(result);
  if (errorMessage) {
    return res.status(500).send(createResponse(req.t(errorMessage)));
  }

  logger.info(`updated customer with id ${result.id}`);
  res.send(createResponse(req.t("updatedSuccessful"), result));
};

exports.deleteByID = async (req, res) => {
  const id = req.params.id;

  const joiErrors = i18next.getResourceBundle(
    req.i18n.language,
    "translation"
  ).joiErrors;

  // validate if id is correct
  const { error, value } = validate_customer.validate_id(id, joiErrors);

  if (error) {
    logger.info(createResponse(error.details[0].message));
    res.status(404).send(createResponse(error.details[0].message));
    return;
  }

  // delete the customer inside the database
  const result = await customer_module.deleteByID(value.id);

  const errorMessage = getErrorMessage(result);
  if (errorMessage) {
    return res.status(500).send(createResponse(req.t(errorMessage)));
  }

  logger.info(`deleted customer with id ${result.id}`);
  res.send(createResponse(req.t("deletedSuccessful"), result));
};

exports.patchByID = async (req, res) => {
  const id = req.params.id;

  const joiErrors = i18next.getResourceBundle(
    req.i18n.language,
    "translation"
  ).joiErrors;

  // validate if id is correct
  const { error, value } = validate_customer.validate_id(id, joiErrors);

  if (error) {
    logger.info(createResponse(error.details[0].message));
    res.status(404).send(createResponse(error.details[0].message));
    return;
  }

  // validate the req.body object
  const result1 = validate_customer.validate_patch_object(req.body, joiErrors);

  //check if error exists
  if (result1.error) {
    logger.info(createResponse(result1.error.details[0].message));
    res.status(404).send(createResponse(result1.error.details[0].message));
    return;
  }

  // check if result is an empty object
  if (Object.keys(result1.value).length === 0) {
    res.status(400).send(createResponse(req.t("noDataProvided")));
    return;
  }

  const customer = result1.value;

  let result = null;
  // patch the customer inside the database based on their transaction type
  if (customer.transaction_type === "DEPOSIT") {
    result = await customer_module.patchByID(value.id, {
      balance: { increment: customer.balance },
    });
  } else if (customer.transaction_type === "WITHDRAW") {
    // check if the customer has enough balance to withdraw
    const checkCustomer = await customer_module.getById(value.id);
    if (!checkCustomer) {
      res.status(404).send(createResponse(req.t("noRecordFound")));
      return;
    }

    if (checkCustomer.balance < customer.balance) {
      res.status(400).send(createResponse(req.t("insufficientBalance")));
      return;
    }

    result = await customer_module.patchByID(value.id, {
      balance: { decrement: customer.balance },
    });
  }

  const errorMessage = getErrorMessage(result);
  if (errorMessage) {
    return res.status(500).send(createResponse(req.t(errorMessage)));
  }

  logger.info(`updated customer with id ${result.id}`);
  res.send(createResponse(req.t("updatedSuccessful"), result));
};
