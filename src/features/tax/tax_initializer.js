const { prismaClient } = require("../../../prisma_client/prisma_client");


async function initializetax() {
  const existingSettings = await prismaClient.tax.findFirst();
  if (!existingSettings) {
    await prismaClient.tax.create({
      data: {
        rate: 5.0,
        threshold: 50.0,
      },
    });
  }
}

module.exports = { initializetax };
