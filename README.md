# Invoice App Only Backend

## Description

A project that creates invoices for customers.

## Requirements

node.js https://nodejs.org/en
Prisma https://www.prisma.io/

## Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/yourusername/invoice_app_only_backend.git
   ```
2. Navigate to the project directory:
   ```sh
   cd invoice_app_only_backend
   ```
3. Install the dependencies:
   ```sh
   npm install
   ```
4. change the .env file, update

```sh
DATABASE_URL="mysql://{{username}}:{{password}}@localhost:3306/invoic_app_only_backend?connection_limit=5&pool_timeout=2"
```

5. add these keys to the .env file, feel free to get your own
   ```sh JWT_SECRET="ea55c069f2ee7004a5f3678f12fb52d145cdfa433c8447762ddcf9139b85d50064da05e198725d6827caa7794d13eaf7ad39f68d09fde3ac348e994f7b61ea51"
   JWT_SECRET_REFRESH="78e81219abf6b0bcf0e333862ee28332bb00eb552cb9aeb1cc012df129494bc1debacc235451bb0bf6007a316c191f1e1e735dd81b291addf12c45645c9ce702"
   ```
6. deploy the database using
   ```sh
   npx prisma db push
   ```
7. finally you should start the application by running this command in the terminal
   ```sh
   node ./server.js
   ```
8. download rest client extention in vscode to test the requests in the rest_client folder. simply chose the local environment using ctrl + alt + e or cmd + alt + e on mac
