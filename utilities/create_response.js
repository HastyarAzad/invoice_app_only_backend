
function createResponse(message, data, page_meta) {
  return {
    message,
    page_meta,
    data,
  };
}

module.exports = { createResponse };
  