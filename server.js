
const express = require("express");
const cors = require("cors");
const app = express();
const path = require("path");

// const crypto = require('crypto');
// // this is my application-only secret key
// const hash = crypto.createHash('sha512');
// hash.update('the most secure secret key in the world for "your application name" application');
// console.log(hash.digest('hex'));
// copy the output of the console.log and paste it inside the .env file as the value of the JWT_SECRET

// importing the authenticate language
const authenticateLanguage = require("./middleware/authenticate_language");

// using cors
app.use(cors());

// using json
app.use(express.json());

// use i18next middleware
app.use(authenticateLanguage);

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, "public")));

// initializing the tax settings
const { initializetax } = require("./src/features/tax/tax_initializer");

// initializing the tax settings when the server starts inorder to have a default tax settings
initializetax();

// importing all the routers
const authentication_router = require("./src/features/authentication/authentication_router");
const customer_router = require("./src/features/customer/customer_router");
const product_router = require("./src/features/product/product_router");
const supplier_router = require("./src/features/supplier/supplier_router");
const invoice_router = require("./src/features/invoice/invoice_router");
const tax_router = require("./src/features/tax/tax_router");

// using the routers
app.use("/api", authentication_router);
app.use("/api", customer_router);
app.use("/api", product_router);
app.use("/api", supplier_router);
app.use("/api", invoice_router);
app.use("/api", tax_router);

// Catch-all handler for your SPA
app.get('*', (req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public/index.html'));
});

// using the port
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));
