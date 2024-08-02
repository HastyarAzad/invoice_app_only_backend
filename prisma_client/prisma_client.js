
// prisma.js
const Prisma = require("@prisma/client");
const prismaClient = new Prisma.PrismaClient();

module.exports.prismaClient = prismaClient;
module.exports.Prisma = Prisma;
  