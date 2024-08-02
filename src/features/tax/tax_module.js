
const { prismaClient } = require("../../../prisma_client/prisma_client");
const { logger } = require("../../../config/pino.config");

const taxSelect = {
  id: true,
  rate: true,
  threshold: true,
  createdAt: true,
  updatedAt: true,
  isDeleted: false,
};

// Define a function to handle errors
function handleError(err) {
  logger.info(err);
  return { errorOccured: err };
}

async function getById(id) {
  return new Promise((resolve, reject) => {
    prismaClient.tax
      .findUnique({
        where: {
          id,
          isDeleted: false,
        },
        select: taxSelect,
      })
      .then((result) => resolve(result))
      .catch((err) => resolve(handleError(err)));
  });
}

// patchByID
async function patchByID(id, tax) {
  return new Promise((resolve, reject) => {
    prismaClient.tax
      .update({
        where: {
          id,
          isDeleted: false,
        },
        data: tax,
        select: taxSelect,
      })
      .then((result) => resolve(result))
      .catch((err) => resolve(handleError(err)));
  });
}

module.exports.getById = getById;
module.exports.patchByID = patchByID;
