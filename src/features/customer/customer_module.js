const { prismaClient } = require("../../../prisma_client/prisma_client");
const { logger } = require("../../../config/pino.config");
const { invoiceSelect } = require("../invoice/invoice_module");

const customerSelect = {
  id: true,
  first_name: true,
  last_name: true,
  address: true,
  phone: true,
  balance: true,
  createdAt: true,
  updatedAt: true,
  isDeleted: false,
  invoice: {
    select: invoiceSelect,
    where: {
      isDeleted: false,
    },
  }
};

// Define a function to handle errors
function handleError(err) {
  logger.info(err);
  return { errorOccured: err };
}

// get all the customer count
async function getcustomersCount() {
  return new Promise((resolve, reject) => {
    prismaClient.customer
      .count({
        where: {
          isDeleted: false,
        },
      })
      .then((result) => resolve(result))
      .catch((err) => resolve(handleError(err)));
  });
}

// get deleted customer count
async function getDeletedcustomersCount() {
  return new Promise((resolve, reject) => {
    prismaClient.customer
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
    prismaClient.customer
      .findMany({
        where: {
          isDeleted: false,
        },
        skip: (page - 1) * perPage,
        take: perPage,
        select: customerSelect,
      })
      .then((result) => resolve(result))
      .catch((err) => resolve(handleError(err)));
  });
}

async function getById(id) {
  return new Promise((resolve, reject) => {
    prismaClient.customer
      .findUnique({
        where: {
          id,
          isDeleted: false,
        },
        select: customerSelect,
      })
      .then((result) => resolve(result))
      .catch((err) => resolve(handleError(err)));
  });
}

async function createOne(customer) {
  return new Promise((resolve, reject) => {
    prismaClient.customer
      .create({
        data: customer,
        select: customerSelect,
      })
      .then((result) => resolve(result))
      .catch((err) => resolve(handleError(err)));
  });
}

async function updateByID(id, customer) {
  return new Promise((resolve, reject) => {
    prismaClient.customer
      .update({
        where: {
          id,
          isDeleted: false,
        },
        data: customer,
        select: customerSelect,
      })
      .then((result) => resolve(result))
      .catch((err) => resolve(handleError(err)));
  });
}

async function deleteByID(id) {
  return new Promise((resolve, reject) => {
    prismaClient.customer
      .update({
        where: {
          id,
          isDeleted: false,
        },
        data: {
          isDeleted: true,
        },
        select: customerSelect,
      })
      .then((result) => resolve(result))
      .catch((err) => resolve(handleError(err)));
  });
}

// patchByID
async function patchByID(id, customer) {
  return new Promise((resolve, reject) => {
    prismaClient.customer
      .update({
        where: {
          id,
          isDeleted: false,
        },
        data: customer,
        select: customerSelect,
      })
      .then((result) => resolve(result))
      .catch((err) => resolve(handleError(err)));
  });
}

module.exports.getcustomersCount = getcustomersCount;
module.exports.getDeletedcustomersCount = getDeletedcustomersCount;
module.exports.getAllWithDeleted = getAllWithDeleted;
module.exports.getById = getById;
module.exports.createOne = createOne;
module.exports.updateByID = updateByID;
module.exports.deleteByID = deleteByID;
module.exports.patchByID = patchByID;
