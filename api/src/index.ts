import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

interface Database {
  products: {
    reference_number: number;
    name: string;
    description: string;
    price: number;
    type: string;
    image_url: string;
    stock: number;
    on_sale: boolean;
  };
  shopping_cart: {
    id?: number;
    user_id: number;
    product_id: number;
    quantity: number;
    created_at: Date;
  };
  users: {
    id?: number;
    email: string;
    password: string;
    role: string;
  };
  shopping: {
    id?: number;
    user_id: number;
    total_price: number;
    created_at: Date;
  };
  shopping_item: {
    id?: number;
    shopping_id: number;
    product_id: number;
    quantity: number;
    price: number;
  };
}

// Usar las variables de entorno con acceso explícito
const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: new Pool({
      user: process.env['DB_USER'], 
      host: process.env['DB_HOST'],  
      database: process.env['DB_NAME'], 
      password: process.env['DB_PASSWORD'], 
      port: Number(process.env['DB_PORT']),
    }),
  }),
});

export default db;
