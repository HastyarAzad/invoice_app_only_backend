const validate_invoice = require("./invoice_validation");
const invoice_module = require("./invoice_module");
const product_module = require("../product/product_module");
const customer_module = require("../customer/customer_module");
const tax_module = require("../tax/tax_module");
const moment = require("moment-timezone");

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

// get all invoice api
exports.getAll = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const perPage = parseInt(req.query.perPage) || 30;

  const result = await invoice_module.getAllWithDeleted(page, perPage);
  const count = await invoice_module.getinvoicesCount();
  const deletedCount = await invoice_module.getDeletedinvoicesCount();

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
  logger.info(`returned ${result.length} invoices out of ${count} invoices`);
  res.send(createResponse(req.t("returnedAllValues"), result, page_meta));
};

// get a invoice by id api
exports.getById = async (req, res) => {
  const id = req.params.id;

  const joiErrors = i18next.getResourceBundle(
    req.i18n.language,
    "translation"
  ).joiErrors;

  // validate if id is correct
  const { error, value } = validate_invoice.validate_id(id, joiErrors);

  if (error) {
    logger.info({ message: error.details[0].message });
    res.status(400).send({ message: error.details[0].message });
    return;
  }

  const result = await invoice_module.getById(value.id);

  // logger.info("result of getById: ", result);
  // if result is empty return 404 error no invoice found, else return the invoice
  if (!result) {
    res.status(404).send(createResponse(req.t("noRecordFound")));
    return;
  }

  const errorMessage = getErrorMessage(result);
  if (errorMessage) {
    return res.status(500).send(createResponse(req.t(errorMessage)));
  }

  logger.info(`returned invoice with id ${value.id}`);
  res.send(createResponse(req.t("returnedSingleValue"), result));
};

// insert an invoice into the database
exports.createOne = async (req, res) => {
  const joiErrors = i18next.getResourceBundle(
    req.i18n.language,
    "translation"
  ).joiErrors;

  // validate the req.body object
  const { error, value } = validate_invoice.validate_create_object(
    req.body,
    joiErrors
  );

  // check if error exists
  if (error) {
    logger.info({ message: error.details[0].message });
    return res.status(400).send({ message: error.details[0].message });
  }

  // check if result is an empty object
  if (Object.keys(value).length === 0) {
    return res.status(400).send(createResponse(req.t("noDataProvided")));
  }

  const invoice = value;

  try {
    // check if the products are found
    const products = await validateInvoiceProducts(invoice, req);

    // check if the customer is found
    const customer = await validateCustomer(invoice.customer_id, req);

    // add the line_price to the invoice_lines
    invoice.invoice_line = invoice.invoice_line.map((invoice_line) => {
      const product = products.find(
        (product) => product.id === invoice_line.product_id
      );
      invoice_line.line_price = product.price * invoice_line.quantity;
      return invoice_line;
    });

    // calculate the total of the invoice
    invoice.sub_total = invoice.invoice_line.reduce((total, invoice_line) => {
      return total + invoice_line.line_price;
    }, 0);

    // generate the uniqueID for the invoice
    invoice.unique_id = await generateUniqueId();

    // add the invoice date
    invoice.date = moment().tz("Asia/Baghdad").format();

    // add the tax to the invoice
    invoice.tax = await getTax(invoice.sub_total);

    // add the total to the invoice
    invoice.total = invoice.sub_total + invoice.tax;

    console.log(invoice);
    // console.log(customer.balance);
    // console.log(products);

    // check if the customer has enough balance
    if (customer.balance < invoice.total) {
      return res
        .status(400)
        .send(createResponse(req.t("customerNotEnoughBalance")));
    }

    // open a transaction to do these things
    // reduce the customer balance by the invoice total
    // update the quantity for the products
    // insert the invoice into the database

    const result = await invoice_module.createOne(invoice);

    // if result.errorOccured is true, return the error
    const errorMessage = getErrorMessage(result);
    if (errorMessage) {
      return res.status(400).send(createResponse(req.t(errorMessage)));
    }

    logger.info(`created invoice with id ${result.id}`);
    res.send(createResponse(req.t("createdSuccessful"), result));
  } catch (error) {
    logger.info(error);
    res.status(400).send(createResponse(req.t(error.message)));
  }
};

async function validateInvoiceProducts(invoice, req) {
  const ids = invoice.invoice_line.map(
    (invoice_line) => invoice_line.product_id
  );
  const products = await product_module.getByIds(ids);

  const errorMessage = getErrorMessage(products);
  if (errorMessage) {
    throw new Error(req.t(errorMessage));
  }

  // check if all the products are found
  if (products.length !== invoice.invoice_line.length) {
    const notFoundProduct = invoice.invoice_line.filter(
      (invoice_line) =>
        !products.some((product) => product.id === invoice_line.product_id)
    );
    throw new Error(
      req.t("productNotFound", {
        ids: notFoundProduct.map((product) => product.product_id),
      })
    );
  }

  // check if the products are in stock
  const productsInStock = products.filter(
    (product) =>
      product.quantity >=
      invoice.invoice_line.find(
        (invoice_line) => invoice_line.product_id === product.id
      ).quantity
  );

  // check if all the products are in stock
  if (productsInStock.length !== invoice.invoice_line.length) {
    const notInStockProduct = invoice.invoice_line.filter(
      (invoice_line) =>
        !productsInStock.some(
          (product) => product.id === invoice_line.product_id
        )
    );
    throw new Error(
      req.t("productNotInStock", {
        ids: notInStockProduct.map((product) => product.product_id),
      })
    );
  }

  return products;
}

async function validateCustomer(customer_id, req) {
  const customer = await customer_module.getById(customer_id);

  if (!customer) {
    throw new Error(req.t("customerNotFound"));
  }

  const errorMessage = getErrorMessage(customer);
  if (errorMessage) {
    throw new Error(req.t(errorMessage));
  }

  return customer;
}

async function generateUniqueId() {
  const currentYear = new Date().getFullYear();
  const count = await invoice_module.getCurrentYearCount();
  const uniqueId = `${currentYear}-${String(count + 1).padStart(4, "0")}`;
  return uniqueId;
}

async function getTax(sub_total) {
  // Fetch the tax rate and threshold from the database
  const tax = await tax_module.getById(1);

  // Check if the tax rate and threshold are defined
  if (!tax || !tax.rate || !tax.threshold) {
    throw new Error("TaxRateOrThresholdNotFound");
  }

  // Apply tax if sub_total is equal to or greater than the threshold
  if (sub_total >= tax.threshold) {
    const taxAmount = sub_total * (tax.rate / 100);
    return taxAmount;
  }

  return 0;
}

// update a invoice based on it's id
exports.updateByID = async (req, res) => {
  const id = req.params.id;

  const joiErrors = i18next.getResourceBundle(
    req.i18n.language,
    "translation"
  ).joiErrors;

  // validate the req.body object
  const result1 = validate_invoice.validate_update_object(req.body, joiErrors);

  // validate if id is correct
  const result2 = validate_invoice.validate_id(req.params.id, joiErrors);

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

  const invoice = result1.value;

  // check if the invoice is found
  const invoiceFound = await invoice_module.getById(result2.value.id);

  if (!invoiceFound) {
    return res.status(404).send(createResponse(req.t("noRecordFound")));
  }

  // calculate the difference between the two invoices in terms of quantity and line_price
  let difference = invoiceFound.invoice_line.map((invoice_line) => {
    const newInvoiceLine = invoice.invoice_line.find(
      (newInvoiceLine) => newInvoiceLine.product_id === invoice_line.product_id
    );

    if (!newInvoiceLine) {
      return {
        product_id: invoice_line.product_id,
        quantity: -invoice_line.quantity,
        product: invoice_line.product,
      };
    }

    // check if the quantity is different
    if (newInvoiceLine.quantity === invoice_line.quantity) {
      // skip the product
      return null;
    }

    return {
      product_id: invoice_line.product_id,
      quantity: newInvoiceLine.quantity - invoice_line.quantity,
      product: invoice_line.product,
    };
  });

  // remove the null values from the difference array
  difference = difference.filter((diff) => diff !== null);

  // check if the difference is empty
  if (difference.length === 0) {
    return res.send(createResponse(req.t("noDifferenceFound")));
  }

  // console.log(difference);

  // get the customer
  const customer = await customer_module.getById(invoiceFound.customer_id);

  if (!customer) {
    return res.status(404).send(createResponse(req.t("customerNotFound")));
  }

  let products = [];

  for (let i = 0; i < difference.length; i++) {
    const diff = difference[i];
    const product = await product_module.getById(diff.product_id);

    if (!product) {
      return res.status(404).send(createResponse(req.t("productNotFound")));
    }

    if (diff.quantity < 0) {
      // update the product quantity
      product.quantity += Math.abs(diff.quantity);
      products.push(product);

      // update the customer balance
      customer.balance += Math.abs(diff.quantity) * product.price;
    } else if (diff.quantity > 0) {
      // check if the customer has enough balance
      if (customer.balance < diff.quantity * product.price) {
        return res
          .status(400)
          .send(createResponse(req.t("customerNotEnoughBalance")));
      }

      // check if the products are in stock
      if (product.quantity < diff.quantity) {
        return res.status(400).send(createResponse(req.t("productNotInStock")));
      }

      // update the product quantity
      product.quantity -= diff.quantity;
      products.push(product);

      customer.balance -= diff.quantity * product.price;
    }
  }

  // if date is provided, update the date
  if (invoice.date) {
    invoiceFound.date = invoice.date;
  }

  // update invoiceFound.invoiceLine.quantities and line_prices
  invoiceFound.invoice_line = invoice.invoice_line.map((invoice_line) => {
    const product = products.find(
      (product) => product.id === invoice_line.product_id
    );

    invoice_line.line_price = product.price * invoice_line.quantity;
    return invoice_line;
  });

  // calculate the sub_total of the invoice
  invoiceFound.sub_total = invoiceFound.invoice_line.reduce(
    (total, invoice_line) => {
      return total + invoice_line.line_price;
    },
    0
  );

  // calculate the tax of the invoice
  invoiceFound.tax = await getTax(invoiceFound.sub_total);

  // calculate the total of the invoice
  invoiceFound.total = invoiceFound.sub_total + invoiceFound.tax;

  const invoice_update_object = {
    sub_total: invoiceFound.sub_total,
    tax: invoiceFound.tax,
    total: invoiceFound.total,
    invoice_line: invoiceFound.invoice_line,
  };

  // get only required fields from customer
  const customer_update_object = {
    id: customer.id,
    balance: customer.balance,
  };

  // console.log(invoice);
  // console.log("invoice line found: ", invoiceFound);
  // console.log(difference);
  // console.log("products: ", products);
  // console.log("customer: ", customer);

  // console.log(invoice_update_object);

  // return res.send(createResponse("done"));

  // check the role of the invoice
  const result = await invoice_module.updateByID(
    result2.value.id,
    invoice_update_object,
    products,
    customer_update_object
  );

  const errorMessage = getErrorMessage(result);
  if (errorMessage) {
    return res.status(500).send(createResponse(req.t(errorMessage)));
  }

  logger.info(`updated invoice with id ${result.id}`);
  res.send(createResponse(req.t("updatedSuccessful"), result));
};

exports.deleteByID = async (req, res) => {
  const id = req.params.id;

  const joiErrors = i18next.getResourceBundle(
    req.i18n.language,
    "translation"
  ).joiErrors;

  // validate if id is correct
  const { error, value } = validate_invoice.validate_id(id, joiErrors);

  if (error) {
    logger.info(createResponse(error.details[0].message));
    res.status(404).send(createResponse(error.details[0].message));
    return;
  }

  // delete the invoice inside the database
  const result = await invoice_module.deleteByID(value.id);

  const errorMessage = getErrorMessage(result);
  if (errorMessage) {
    return res.status(500).send(createResponse(req.t(errorMessage)));
  }

  logger.info(`deleted invoice with id ${result.id}`);
  res.send(createResponse(req.t("deletedSuccessful"), result));
};
