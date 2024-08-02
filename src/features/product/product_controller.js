const validate_product = require("./product_validation");
const product_module = require("./product_module");

const { createResponse } = require("../../../utilities/create_response");
const { logger } = require("../../../config/pino.config");

const i18next = require("i18next");

const UUID = require("uuid");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      // cb(null, path.join(__dirname, "/public/assets/products"));
      cb(null, path.resolve(process.cwd(), "public/assets/products")); // be carefull about production environment
    },
    filename: (req, file, cb) => {
      cb(null, UUID.v4() + "-" + file.originalname);
    },
  }),
});

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

// get all product api
exports.getAll = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const perPage = parseInt(req.query.perPage) || 30;

  const result = await product_module.getAllWithDeleted(page, perPage);
  const count = await product_module.getproductsCount();
  const deletedCount = await product_module.getDeletedproductsCount();

  const page_meta = {
    total: count,
    deleted: deletedCount,
    page: page,
    perPage: perPage,
    totalPages: Math.ceil(count / perPage),
  };

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
  logger.info(`returned ${result.length} products out of ${count} products`);
  res.send(createResponse(req.t("returnedAllValues"), result, page_meta));
};

// get a product by id api
exports.getById = async (req, res) => {
  const id = req.params.id;

  const joiErrors = i18next.getResourceBundle(
    req.i18n.language,
    "translation"
  ).joiErrors;

  // validate if id is correct
  const { error, value } = validate_product.validate_id(id, joiErrors);

  if (error) {
    logger.info({ message: error.details[0].message });
    res.status(404).send({ message: error.details[0].message });
    return;
  }

  const result = await product_module.getById(value.id);

  // logger.info("result of getById: ", result);
  // if result is empty return 404 error no product found, else return the product
  if (!result) {
    res.send(createResponse(req.t("noRecordFound")));
    return;
  }

  const errorMessage = getErrorMessage(result);
  if (errorMessage) {
    return res.status(404).send(createResponse(req.t(errorMessage)));
  }

  logger.info(`returned product with id ${value.id}`);
  res.send(createResponse(req.t("returnedSingleValue"), result));
};

// insert a product into the database
exports.createOne = async (req, res) => {
  try {
    upload.single("image")(req, res, async (err) => {
      if (err) {
        // console.log("hit error");
        logger.info(err);
        res.status(404).send(createResponse(req.t("imageUploadError")));
        return;
      }

      // check if req.file is empty
      if (!req.file) {
        res.status(404).send(createResponse(req.t("noImageProvided")));
        return;
      }

      req.body.image = req.file.path.split("public")[1];
      // console.log(req.file.path);

      const joiErrors = i18next.getResourceBundle(
        req.i18n.language,
        "translation"
      ).joiErrors;

      // validate the req.body object
      const { error, value } = validate_product.validate_create_object(
        req.body,
        joiErrors
      );

      //check if error exists
      if (error) {
        await deleteproductImage(req.file.path);
        logger.info({ message: error.details[0].message });
        res.status(404).send({ message: error.details[0].message });
        return;
      }

      // check if result is an empty object
      if (Object.keys(value).length === 0) {
        await deleteproductImage(req.file.path);
        res.status(404).send(createResponse(req.t("noDataProvided")));
        return;
      }

      const product = value;
      // logger.info(product);

      try {
        // logger.info("product: ", product)

        // insert the product into the database
        let result = await product_module.createOne(product);

        // if result.errorOccured is true, return the error
        const errorMessage = getErrorMessage(result);
        if (errorMessage) {
          await deleteproductImage(req.file.path);
          return res.status(404).send(createResponse(req.t(errorMessage)));
        }

        logger.info(`created product with id ${result.id}`);
        res.send(createResponse(req.t("createdSuccessful"), result));
      } catch (error) {
        logger.info(error);
        res
          .status(404)
          .send(createResponse(req.t("prisma.defaultPrismaError")));
      }
    });
  } catch (error) {
    logger.info(error);
    res.status(404).send(createResponse(req.t("imageUploadError")));
    return;
  }
};

async function deleteproductImage(path) {
  try {
    fs.unlinkSync(path);
    logger.info("image deleted successfully");
  } catch (error) {
    logger.info("error deleting image");
  }
}

// update a product based on it's id
exports.updateByID = async (req, res) => {
  const id = req.params.id;

  const joiErrors = i18next.getResourceBundle(
    req.i18n.language,
    "translation"
  ).joiErrors;

  // validate if id is correct
  const result2 = validate_product.validate_id(req.params.id, joiErrors);

  // logger.info(req.params.id);

  if (result2.error) {
    logger.info({ message: result2.error.details[0].message });
    res.status(404).send({ message: result2.error.details[0].message });
    return;
  }

  // check if product exists
  const productExists = await product_module.getById(result2.value.id);
  if (!productExists) {
    return res.status(404).send(createResponse(req.t("noRecordFound")));
  }

  const errorMessage1 = getErrorMessage(productExists);
  if (errorMessage1) {
    return res.status(404).send(createResponse(req.t(errorMessage1)));
  }

  // if image is provided, upload the image
  try {
    upload.single("image")(req, res, async (err) => {
      if (err) {
        logger.info(err);
        res.status(404).send(createResponse(req.t("imageUploadError")));
        return;
      }

      if (req.file) {
        req.body.image = req.file.path.split("public")[1];
      }

      if (req.file) {
        // console.log("REQ.FILE EXISTS");
        // console.log(productExists.image);
        // console.log(process.cwd());

        // Ensure the path doesn't start with a slash
        const imagePath = productExists.image.startsWith(path.sep)
          ? productExists.image.slice(1)
          : productExists.image;

        await deleteproductImage(
          path.resolve(process.cwd(), "public", imagePath)
        );
      }

      // validate the req.body object
      const result1 = validate_product.validate_update_object(
        req.body,
        joiErrors
      );

      //check if error exists
      if (result1.error) {
        logger.info({ message: result1.error.details[0].message });
        res.status(404).send({ message: result1.error.details[0].message });
        return;
      }

      // check if result is an empty object
      if (Object.keys(result1.value).length === 0) {
        res.status(404).send(createResponse(req.t("noDataProvided")));
        return;
      }

      const product = result1.value;

      // check the role of the product
      const result = await product_module.updateByID(
        result2.value.id,
        product
      );

      const errorMessage = getErrorMessage(result);
      if (errorMessage) {
        // Ensure the path doesn't start with a slash
        const imagePath = product.image.startsWith(path.sep)
          ? product.image.slice(1)
          : product.image;

        // console.log(imagePath);

        await deleteproductImage(
          path.resolve(process.cwd(), "public", imagePath)
        );
        return res.status(404).send(createResponse(req.t(errorMessage)));
      }

      logger.info(`updated product with id ${result.id}`);
      res.send(createResponse(req.t("updatedSuccessful"), result));
    });
  } catch (error) {
    logger.info(error);
    res.status(404).send(createResponse(req.t("imageUploadError")));
    return;
  }
};

exports.deleteByID = async (req, res) => {
  const id = req.params.id;

  const joiErrors = i18next.getResourceBundle(
    req.i18n.language,
    "translation"
  ).joiErrors;

  // validate if id is correct
  const { error, value } = validate_product.validate_id(id, joiErrors);

  if (error) {
    logger.info(createResponse(error.details[0].message));
    res.status(404).send(createResponse(error.details[0].message));
    return;
  }

  // check if product exists and has image to delete
  const productExists = await product_module.getById(value.id);

  if (!productExists) {
    return res.status(404).send(createResponse(req.t("noRecordFound")));
  }

  const errorMessage1 = getErrorMessage(productExists);
  if (errorMessage1) {
    return res.status(404).send(createResponse(req.t(errorMessage1)));
  }

  if (productExists.image) {
    // Ensure the path doesn't start with a slash
    const imagePath = productExists.image.startsWith(path.sep)
      ? productExists.image.slice(1)
      : productExists.image;

    await deleteproductImage(path.resolve(process.cwd(), "public", imagePath));
  }

  // delete the product inside the database
  const result = await product_module.deleteByID(value.id);

  const errorMessage = getErrorMessage(result);
  if (errorMessage) {
    return res.status(404).send(createResponse(req.t(errorMessage)));
  }

  logger.info(`deleted product with id ${result.id}`);
  res.send(createResponse(req.t("deletedSuccessful"), result));
};

exports.patchByID = async (req, res) => {
  const id = req.params.id;

  const joiErrors = i18next.getResourceBundle(
    req.i18n.language,
    "translation"
  ).joiErrors;

  // validate if id is correct
  const { error, value } = validate_product.validate_id(id, joiErrors);

  if (error) {
    logger.info(createResponse(error.details[0].message));
    res.status(404).send(createResponse(error.details[0].message));
    return;
  }

  // validate the req.body object
  const result1 = validate_product.validate_patch_object(req.body, joiErrors);

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

  const product = result1.value;
  let result = null;
  // patch the product inside the database based on transaction type
  if(product.transaction_type === "OUTPUT") {
    // decrease the quantity of the product
    result = await product_module.patchByID(value.id, { quantity: { decrement: product.quantity}});
  } else if(product.transaction_type === "INPUT") {
    // increase the quantity of the product
    result = await product_module.patchByID(value.id, { quantity: { increment: product.quantity}});
  }

  const errorMessage = getErrorMessage(result);
  if (errorMessage) {
    return res.status(404).send(createResponse(req.t(errorMessage)));
  }

  logger.info(`updated product with id ${result.id}`);
  res.send(createResponse(req.t("updatedSuccessful"), result));
};
