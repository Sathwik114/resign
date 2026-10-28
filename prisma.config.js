require('dotenv').config();
const { defineConfig } = require('prisma/config');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set to run Prisma commands.');
}

module.exports = defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
