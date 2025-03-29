"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const kysely_1 = require("kysely");
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Usar las variables de entorno con acceso explícito
const db = new kysely_1.Kysely({
    dialect: new kysely_1.PostgresDialect({
        pool: new pg_1.Pool({
            user: process.env['DB_USER'],
            host: process.env['DB_HOST'],
            database: process.env['DB_NAME'],
            password: process.env['DB_PASSWORD'],
            port: Number(process.env['DB_PORT']),
        }),
    }),
});
exports.default = db;
