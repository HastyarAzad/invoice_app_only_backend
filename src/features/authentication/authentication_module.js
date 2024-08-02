
const { prismaClient } = require("../../../prisma_client/prisma_client");
const { logger } = require("../../../config/pino.config");

const userSelect = {
  id: true,
  email: true,
  createdAt: true,
  updatedAt: true,
};

// Define a function to handle errors
function handleError(err) {
  logger.info(err);
  return { errorOccured: err };
}

// get all the user count
async function getusersCount() {
  return new Promise((resolve, reject) => {
    prismaClient.user
      .count()
      .then((result) => resolve(result))
      .catch((err) => resolve(handleError(err)));
  });
}

// get deleted user count
async function getDeletedusersCount() {
  return new Promise((resolve, reject) => {
    prismaClient.user
      .count()
      .then((result) => resolve(result))
      .catch((err) => resolve(handleError(err)));
  });
}

async function getAllWithDeleted(page, perPage) {
  return new Promise((resolve, reject) => {
    prismaClient.user
      .findMany({
        skip: (page - 1) * perPage,
        take: perPage,
        select: userSelect,
      })
      .then((result) => resolve(result))
      .catch((err) => resolve(handleError(err)));
  });
}

async function getById(id) {
  return new Promise((resolve, reject) => {
    prismaClient.user
      .findUnique({
        where: {
          id,
        },
        select: userSelect,
      })
      .then((result) => resolve(result))
      .catch((err) => resolve(handleError(err)));
  });
}

async function getByIdWithPassword(id) {
  return new Promise((resolve, reject) => {
    prismaClient.user
      .findUnique({
        where: {
          id,
        },
        select: {
          ...userSelect,
          password: true,
        },
      })
      .then((result) => resolve(result))
      .catch((err) => resolve(handleError(err)));
  });
}

// getByEmail
async function getByEmail(email) {
  return new Promise((resolve, reject) => {
    prismaClient.user
      .findMany({
        where: {
          email,
        },
        select: {
          ...userSelect,
          password: true,
        },
      })
      .then((result) => resolve(result))
      .catch((err) => resolve(handleError(err)));
  });
}

async function createOne(user) {
  return new Promise((resolve, reject) => {
    prismaClient.user
      .create({
        data: user,
        select: userSelect,
      })
      .then((result) => resolve(result))
      .catch((err) => resolve(handleError(err)));
  });
}

async function updateByID(id, user) {
  return new Promise((resolve, reject) => {
    prismaClient.user
      .update({
        where: {
          id,
        },
        data: user,
        select: userSelect,
      })
      .then((result) => resolve(result))
      .catch((err) => resolve(handleError(err)));
  });
}

async function deleteByID(id) {
  return new Promise((resolve, reject) => {
    prismaClient.user
      .delete({
        where: {
          id,
        },
        select: userSelect,
      })
      .then((result) => resolve(result))
      .catch((err) => resolve(handleError(err)));
  });
}

module.exports.getusersCount = getusersCount;
module.exports.getDeletedusersCount = getDeletedusersCount;
module.exports.getAllWithDeleted = getAllWithDeleted;
module.exports.getById = getById;
module.exports.getByIdWithPassword = getByIdWithPassword;
module.exports.getByEmail = getByEmail;
module.exports.createOne = createOne;
module.exports.updateByID = updateByID;
module.exports.deleteByID = deleteByID;
