const { prismaClient } = require("../../../prisma_client/prisma_client");
const { logger } = require("../../../config/pino.config");

const productSelect = {
  id: true,
  supplier_id: true,
  name: true,
  barcode: true,
  quantity: true,
  price: true,
  image: true,
  createdAt: true,
  updatedAt: true,
  isDeleted: false,
};

// Define a function to handle errors
function handleError(err) {
  logger.info(err);
  return { errorOccured: err };
}

// get all the product count
async function getproductsCount() {
  return new Promise((resolve, reject) => {
    prismaClient.product
      .count({
        where: {
          isDeleted: false,
        },
      })
      .then((result) => resolve(result))
      .catch((err) => resolve(handleError(err)));
  });
}

// get deleted product count
async function getDeletedproductsCount() {
  return new Promise((resolve, reject) => {
    prismaClient.product
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
    prismaClient.product
      .findMany({
        where: {
          isDeleted: false,
        },
        skip: (page - 1) * perPage,
        take: perPage,
        select: productSelect,
      })
      .then((result) => resolve(result))
      .catch((err) => resolve(handleError(err)));
  });
}

async function getById(id) {
  return new Promise((resolve, reject) => {
    prismaClient.product
      .findUnique({
        where: {
          id,
          isDeleted: false,
        },
        select: productSelect,
      })
      .then((result) => resolve(result))
      .catch((err) => resolve(handleError(err)));
  });
}

// getByIds
async function getByIds(ids) {
  return new Promise((resolve, reject) => {
    prismaClient.product
      .findMany({
        where: {
          id: {
            in: ids,
          },
          isDeleted: false,
        },
        select: productSelect,
      })
      .then((result) => resolve(result))
      .catch((err) => resolve(handleError(err)));
  });
}

async function createOne(product) {
  return new Promise((resolve, reject) => {
    prismaClient.product
      .create({
        data: product,
        select: productSelect,
      })
      .then((result) => resolve(result))
      .catch((err) => resolve(handleError(err)));
  });
}

async function updateByID(id, product) {
  return new Promise((resolve, reject) => {
    prismaClient.product
      .update({
        where: {
          id,
          isDeleted: false,
        },
        data: product,
        select: productSelect,
      })
      .then((result) => resolve(result))
      .catch((err) => resolve(handleError(err)));
  });
}

async function deleteByID(id) {
  return new Promise((resolve, reject) => {
    prismaClient.product
      .update({
        where: {
          id,
          isDeleted: false,
        },
        data: {
          isDeleted: true,
        },
        select: productSelect,
      })
      .then((result) => resolve(result))
      .catch((err) => resolve(handleError(err)));
  });
}

// patchByID
async function patchByID(id, product) {
  return new Promise((resolve, reject) => {
    prismaClient.product
      .update({
        where: {
          id,
          isDeleted: false,
        },
        data: product,
        select: productSelect,
      })
      .then((result) => resolve(result))
      .catch((err) => resolve(handleError(err)));
  });
}

module.exports.getproductsCount = getproductsCount;
module.exports.getDeletedproductsCount = getDeletedproductsCount;
module.exports.getAllWithDeleted = getAllWithDeleted;
module.exports.getById = getById;
module.exports.getByIds = getByIds;
module.exports.createOne = createOne;
module.exports.updateByID = updateByID;
module.exports.deleteByID = deleteByID;
module.exports.patchByID = patchByID;
module.exports.productSelect = productSelect;
