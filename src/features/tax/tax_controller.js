const validate_tax = require("./tax_validation");
const tax_module = require("./tax_module");

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

// get a tax by id api
exports.getById = async (req, res) => {
  const id = req.params.id;

  const joiErrors = i18next.getResourceBundle(
    req.i18n.language,
    "translation"
  ).joiErrors;

  // validate if id is correct
  const { error, value } = validate_tax.validate_id(id, joiErrors);

  if (error) {
    logger.info({ message: error.details[0].message });
    res.status(400).send({ message: error.details[0].message });
    return;
  }

  const result = await tax_module.getById(value.id);

  // logger.info("result of getById: ", result);
  // if result is empty return 404 error no tax found, else return the tax
  if (!result) {
    res.status(404).send(createResponse(req.t("noRecordFound")));
    return;
  }

  const errorMessage = getErrorMessage(result);
  if (errorMessage) {
    return res.status(500).send(createResponse(req.t(errorMessage)));
  }

  logger.info(`returned tax with id ${value.id}`);
  res.send(createResponse(req.t("returnedSingleValue"), result));
};

exports.patchByID = async (req, res) => {
  const id = req.params.id;

  const joiErrors = i18next.getResourceBundle(
    req.i18n.language,
    "translation"
  ).joiErrors;

  // validate if id is correct
  const { error, value } = validate_tax.validate_id(id, joiErrors);

  if (error) {
    logger.info(createResponse(error.details[0].message));
    res.status(404).send(createResponse(error.details[0].message));
    return;
  }

  // validate the req.body object
  const result1 = validate_tax.validate_patch_object(req.body, joiErrors);

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

  const tax = result1.value;

  // patch the tax inside the database
  const result = await tax_module.patchByID(value.id, tax);

  const errorMessage = getErrorMessage(result);
  if (errorMessage) {
    return res.status(500).send(createResponse(req.t(errorMessage)));
  }

  logger.info(`updated tax with id ${result.id}`);
  res.send(createResponse(req.t("updatedSuccessful"), result));
};
