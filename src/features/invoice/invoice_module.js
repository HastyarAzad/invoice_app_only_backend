const { prismaClient } = require("../../../prisma_client/prisma_client");
const { logger } = require("../../../config/pino.config");
const { productSelect } = require("../product/product_module");

const invoiceSelect = {
  id: true,
  customer_id: true,
  unique_id: true,
  date: true,
  sub_total: true,
  tax: true,
  total: true,
  createdAt: true,
  updatedAt: true,
  isDeleted: false,
  invoice_line: {
    select: {
      id: true,
      product_id: true,
      quantity: true,
      line_price: true,
      createdAt: true,
      updatedAt: true,
      product: {
        select: productSelect,
      },
    },
  },
};

// Define a function to handle errors
function handleError(err) {
  console.log(err);
  return { errorOccured: err };
}

// get all the invoice count
async function getinvoicesCount() {
  return new Promise((resolve, reject) => {
    prismaClient.invoice
      .count({
        where: {
          isDeleted: false,
        },
      })
      .then((result) => resolve(result))
      .catch((err) => resolve(handleError(err)));
  });
}

// getCurrentYearCount
async function getCurrentYearCount() {
  const currentYear = new Date().getFullYear();

  return new Promise((resolve, reject) => {
    prismaClient.invoice
      .count({
        where: {
          date: {
            gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
            lt: new Date(`${currentYear + 1}-01-01T00:00:00.000Z`),
          },
        },
      })
      .then((result) => resolve(result))
      .catch((err) => resolve(handleError(err)));
  });
}

// get deleted invoice count
async function getDeletedinvoicesCount() {
  return new Promise((resolve, reject) => {
    prismaClient.invoice
      .count({
        where: {
          isDeleted: true,
        },
      })
      .then((result) => resolve(result))
      .catch((err) => resolve(handleError(err)));
  });
}

async function getAllWithDeleted(page, perPage) {
  return new Promise((resolve, reject) => {
    prismaClient.invoice
      .findMany({
        where: {
          isDeleted: false,
        },
        skip: (page - 1) * perPage,
        take: perPage,
        select: invoiceSelect,
      })
      .then((result) => resolve(result))
      .catch((err) => resolve(handleError(err)));
  });
}

async function getById(id) {
  return new Promise((resolve, reject) => {
    prismaClient.invoice
      .findUnique({
        where: {
          id,
          isDeleted: false,
        },
        select: invoiceSelect,
      })
      .then((result) => resolve(result))
      .catch((err) => resolve(handleError(err)));
  });
}

async function createOne(invoice) {
  try {
    const result = await prismaClient.$transaction(async (prismaClient) => {
      // Update the customer's balance
      await prismaClient.customer.update({
        where: {
          id: invoice.customer_id,
        },
        data: {
          balance: {
            decrement: invoice.total,
          },
        },
      });

      // Update the quantity for all the products in the invoice
      await Promise.all(
        invoice.invoice_line.map((invoiceLine) =>
          prismaClient.product.update({
            where: {
              id: invoiceLine.product_id,
            },
            data: {
              quantity: {
                decrement: invoiceLine.quantity,
              },
            },
          })
        )
      );

      // Create the invoice
      return prismaClient.invoice.create({
        data: {
          customer_id: invoice.customer_id,
          unique_id: invoice.unique_id,
          date: invoice.date,
          sub_total: invoice.sub_total,
          tax: invoice.tax,
          total: invoice.total,
          invoice_line: {
            createMany: {
              data: invoice.invoice_line,
            },
          },
        },
        select: invoiceSelect,
      });
    });

    return result;
  } catch (err) {
    return handleError(err);
  }
}

async function updateByID(id, invoice, products, customer) {
  try {
    const result = await prismaClient.$transaction(async (prismaClient) => {
      // Update the customer's balance
      await prismaClient.customer.update({
        where: {
          id: customer.id,
        },
        data: customer,
      });

      // Update the quantity for all the products in the invoice
      await Promise.all(
        products.map((product) =>
          prismaClient.product.update({
            where: {
              id: product.id,
            },
            data: product,
          })
        )
      );

      // Update the invoice
      return prismaClient.invoice.update({
        where: {
          id,
          isDeleted: false,
        },
        data: {
          sub_total: invoice.sub_total,
          tax: invoice.tax,
          total: invoice.total,
          invoice_line: {
            deleteMany: {}, // Delete all existing invoice lines
            create: invoice.invoice_line.map((line) => ({
              product_id: line.product_id,
              quantity: line.quantity,
              line_price: line.line_price,
            })),
          },
        },
        select: invoiceSelect,
      });
    });

    return result;
  } catch (err) {
    return handleError(err);
  }
}

async function deleteByID(id) {
  return new Promise((resolve, reject) => {
    prismaClient.invoice
      .update({
        where: {
          id,
          isDeleted: false,
        },
        data: {
          isDeleted: true,
        },
        select: invoiceSelect,
      })
      .then((result) => resolve(result))
      .catch((err) => resolve(handleError(err)));
  });
}

module.exports.getinvoicesCount = getinvoicesCount;
module.exports.getCurrentYearCount = getCurrentYearCount;
module.exports.getDeletedinvoicesCount = getDeletedinvoicesCount;
module.exports.getAllWithDeleted = getAllWithDeleted;
module.exports.getById = getById;
module.exports.createOne = createOne;
module.exports.updateByID = updateByID;
module.exports.deleteByID = deleteByID;
module.exports.invoiceSelect = invoiceSelect;
