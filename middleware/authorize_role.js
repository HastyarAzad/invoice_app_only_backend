
const jwt = require('jsonwebtoken');
const { createResponse } = require("../utilities/create_response");
const secret = "7c86eade4cf63795560952b6e35a2818378cb89bdce51a2a2bc71a3695d0e1fbbb2ab32fc0fd759d6422ec964d92e669c4bbc02cac56603be17915486d9815c7";
// token example
// Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTIsInJvbGUiOiJTVVBFUl9BRE1JTiIsImlhdCI6MTY5NDQyMjIxMX0.TC5QLEn8zCacwcLvm3whCCkphKGZPXbIYhYxlNyEcF8

function authenticateAndCheckRole(requiredRole) {
  return (req, res, next) => {
    const token = req.header('Authorization');

    if (!token) {
      return res.status(401).json({ message: 'Access denied - no token provided' });
    }

    jwt.verify(token.split(' ')[1], secret, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Invalid token' });
      }

      const Role = decoded.role;

      if (requiredRole.includes(Role)) {
        next(); // Role matches, allow the request to proceed
      } else {
        res.status(401).send(createResponse(`Unauthorized, you should be ${requiredRole} to access this route`)); // Role does not match
        return;
      }
    });
  };
}

module.exports = authenticateAndCheckRole;
