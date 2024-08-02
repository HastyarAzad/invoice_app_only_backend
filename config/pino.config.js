
const pino = require('pino');
const path = require('path');
const destination = path.join(__dirname, '../logs/system.log');

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      // destination: destination,
    }
  },
});

exports.logger = logger;
  