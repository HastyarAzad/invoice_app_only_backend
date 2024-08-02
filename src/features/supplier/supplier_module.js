
const { prismaClient } = require("../../../prisma_client/prisma_client");
const { logger } = require("../../../config/pino.config");
const { productSelect } = require("../product/product_module");

const supplierSelect = {
  id: true,
  name:true,
  phone: true,
  createdAt: true,
  updatedAt: true,
  isDeleted: false,
  product: {
    select: productSelect,
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

// get all the supplier count
async function getsuppliersCount() {
  return new Promise((resolve, reject) => {
    prismaClient.supplier
      .count({
        where: {
          isDeleted: false,
        },
      })
      .then((result) => resolve(result))
      .catch((err) => resolve(handleError(err)));
  });
}

// get deleted supplier count
async function getDeletedsuppliersCount() {
  return new Promise((resolve, reject) => {
    prismaClient.supplier
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
    prismaClient.supplier
      .findMany({
        where: {
          isDeleted: false,
        },
        skip: (page - 1) * perPage,
        take: perPage,
        select: supplierSelect,
      })
      .then((result) => resolve(result))
      .catch((err) => resolve(handleError(err)));
  });
}

async function getById(id) {
  return new Promise((resolve, reject) => {
    prismaClient.supplier
      .findUnique({
        where: {
          id,
          isDeleted: false,
        },
        select: supplierSelect,
      })
      .then((result) => resolve(result))
      .catch((err) => resolve(handleError(err)));
  });
}

async function createOne(supplier) {
  return new Promise((resolve, reject) => {
    prismaClient.supplier
      .create({
        data: supplier,
        select: supplierSelect,
      })
      .then((result) => resolve(result))
      .catch((err) => resolve(handleError(err)));
  });
}

async function updateByID(id, supplier) {
  return new Promise((resolve, reject) => {
    prismaClient.supplier
      .update({
        where: {
          id,
          isDeleted: false,
        },
        data: supplier,
        select: supplierSelect,
      })
      .then((result) => resolve(result))
      .catch((err) => resolve(handleError(err)));
  });
}

async function deleteByID(id) {
  return new Promise((resolve, reject) => {
    prismaClient.supplier
      .update({
        where: {
          id,
          isDeleted: false,
        },
        data: {
          isDeleted: true,
        },
        select: supplierSelect,
      })
      .then((result) => resolve(result))
      .catch((err) => resolve(handleError(err)));
  });
}

module.exports.getsuppliersCount = getsuppliersCount;
module.exports.getDeletedsuppliersCount = getDeletedsuppliersCount;
module.exports.getAllWithDeleted = getAllWithDeleted;
module.exports.getById = getById;
module.exports.createOne = createOne;
module.exports.updateByID = updateByID;
module.exports.deleteByID = deleteByID;
