"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const index_1 = __importDefault(require("./index"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const express_validator_1 = require("express-validator");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
const port = 3000;
const JWT_SECRET = process.env["JWT_SECRET"];
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in the environment variables.");
}
app.use(express_1.default.json());
app.post("/api/register", [
    (0, express_validator_1.body)("email").isString().notEmpty(),
    (0, express_validator_1.body)("password").isString().isLength({ min: 6 }),
    (0, express_validator_1.body)("role")
        .isString()
        .notEmpty(), // Validar que rol sea un string y no esté vacío
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const { email, password, role } = req.body; // Asegurarse de recibir rol
    const hashedPassword = yield bcrypt_1.default.hash(password, 10);
    try {
        const user = yield index_1.default
            .insertInto("users")
            .values({ email, password: hashedPassword, role }) // Incluir rol en la inserción
            .returning(["id", "email", "role"]) // Devolver el rol en la respuesta
            .executeTakeFirst();
        res.status(201).json(user);
    }
    catch (error) {
        console.error("Error en el registro:", error);
        res.status(500).json({ error: "Error al registrar el usuario" });
    }
}));
app.post("/api/login", [(0, express_validator_1.body)("email").isString().notEmpty(), (0, express_validator_1.body)("password").isString().notEmpty()], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    const user = yield index_1.default
        .selectFrom("users")
        .select(["id", "email", "password", "role"])
        .where("email", "=", email)
        .executeTakeFirst();
    if (!user || !(yield bcrypt_1.default.compare(password, user.password))) {
        res.status(401).json({ error: "Usuario o contraseña incorrectos" });
        return; // Detener la ejecución después de enviar la respuesta
    }
    const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
        expiresIn: "1h",
    });
    res.json({ token, role: user.role, id: user.id }); // Enviar la respuesta aquí, no retornar res
}));
app.post("/api/products", [
    (0, express_validator_1.body)("reference_number").isNumeric(),
    (0, express_validator_1.body)("name").isString().notEmpty(),
    (0, express_validator_1.body)("description").isString().notEmpty(),
    (0, express_validator_1.body)("type")
        .isString()
        .notEmpty(), // Validar que el tipo sea un string y no esté vacío
    (0, express_validator_1.body)("stock").isNumeric(),
    (0, express_validator_1.body)("price").isFloat({ gt: 0 }), // Validar que el precio sea mayor a 0
    (0, express_validator_1.body)("on_sale").isBoolean(), // Validar que on_sale sea un booleano
    (0, express_validator_1.body)("image_url")
        .isString()
        .notEmpty(), // Validar que la URL de la imagen sea un string y no esté vacía
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const { reference_number, name, description, price, type, stock, image_url, on_sale } = req.body; // Incluir tipo en la solicitud
    try {
        const newProduct = yield index_1.default
            .insertInto("products")
            .values({
            reference_number,
            name,
            description,
            price,
            type,
            stock,
            image_url,
            on_sale,
        })
            .returningAll()
            .executeTakeFirst();
        res.status(201).json({ message: "Producto creado exitosamente", product: newProduct });
    }
    catch (error) {
        console.error("Error al insertar producto:", error);
        res.status(500).json({ error: "Error al crear el producto" });
    }
}));
app.get("/api/products", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Recupera todos los productos de la base de datos
        const products = yield index_1.default.selectFrom("products").selectAll().execute(); // Suponiendo que 'products' es el nombre de tu tabla
        // Responde con el estado 200 y los productos
        res.status(200).json({ products });
    }
    catch (error) {
        // Si hay un error en la base de datos, responde con el estado 500
        console.error("Error al obtener productos:", error);
        res.status(500).json({ error: "Error al obtener los productos" });
    }
}));
app.delete("/api/products/:referenceNumber", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const referenceNumber = Number(req.params["referenceNumber"]); // Convertir a número
    if (isNaN(referenceNumber)) {
        res.status(400).json({ error: "El número de referencia debe ser un número válido" });
        return;
    }
    try {
        const deletedProduct = yield index_1.default
            .deleteFrom("products")
            .where("reference_number", "=", referenceNumber) // Ahora es un número
            .executeTakeFirst();
        if (!deletedProduct) {
            res.status(404).json({ error: "Producto no encontrado" });
            return;
        }
        res.status(200).json({ message: "Producto eliminado exitosamente" });
    }
    catch (error) {
        console.error("Error al eliminar el producto:", error);
        res.status(500).json({ error: "Error al eliminar el producto" });
    }
}));
app.get("/api/products/:referenceNumber", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const referenceNumber = Number(req.params["referenceNumber"]); // Convertir a número
    try {
        const product = yield index_1.default
            .selectFrom("products")
            .selectAll()
            .where("reference_number", "=", referenceNumber) // Ahora es un número
            .executeTakeFirst();
        if (!product) {
            res.status(404).json({ error: "Producto no encontrado" });
            return;
        }
        res.status(200).json({ product });
    }
    catch (error) {
        console.error("Error al obtener el producto:", error);
        res.status(500).json({ error: "Error al obtener el producto" });
    }
}));
app.get("/api/carrito", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = Number(req.headers['userid']);
    console.log("🛒 Obteniendo carrito para el usuario:", userId);
    try {
        const cart = yield index_1.default
            .selectFrom("shopping_cart")
            .select(["id", "product_id", "quantity"])
            .where("user_id", "=", userId) // Filtramos solo por este usuario
            .execute();
        console.log(cart);
        res.status(200).json({ cart });
    }
    catch (error) {
        console.error("Error al obtener el carrito:", error);
        res.status(500).json({ error: "Error al obtener el carrito" });
    }
}));
app.post("/api/carrito/comprar", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { user_id, totalAmount } = req.body;
    try {
        // Obtener el carrito de compras del usuario
        const cart = yield index_1.default
            .selectFrom("shopping_cart")
            .selectAll()
            .where("user_id", "=", user_id)
            .execute();
        if (cart.length === 0) {
            res.status(400).json({ error: "El carrito está vacío" });
            return;
        }
        // Crear un registro de compra en la tabla 'shopping'
        const shopping = yield index_1.default
            .insertInto("shopping")
            .values({
            user_id: user_id,
            total_price: totalAmount,
            created_at: new Date(),
        })
            .returning("id")
            .execute();
        const shoppingId = (_a = shopping[0]) === null || _a === void 0 ? void 0 : _a.id;
        // Obtener los precios de los productos en el carrito
        const productIds = cart.map((item) => item.product_id);
        const products = yield index_1.default
            .selectFrom("products")
            .select(["reference_number", "price", "stock"])
            .where("reference_number", "in", productIds)
            .execute();
        if (shoppingId === undefined) {
            throw new Error("No se pudo obtener el ID del carrito de compras.");
        }
        // Mapear los items del carrito con su precio
        const shopping_items = cart.map((item) => {
            const product = products.find((p) => p.reference_number === item.product_id);
            if (!product) {
                throw new Error(`Producto con ID ${item.product_id} no encontrado`);
            }
            // Verificar stock disponible
            if (product.stock < item.quantity) {
                throw new Error(`Stock insuficiente para el producto con ID ${item.product_id}`);
            }
            return {
                shopping_id: shoppingId,
                product_id: item.product_id,
                quantity: item.quantity,
                price: product.price * item.quantity,
            };
        });
        // Iniciar una transacción para garantizar la integridad de los datos
        yield index_1.default.transaction().execute((trx) => __awaiter(void 0, void 0, void 0, function* () {
            // Insertar los productos en la tabla 'shopping_item'
            yield trx.insertInto("shopping_item").values(shopping_items).execute();
            // Actualizar el stock de los productos
            for (const item of cart) {
                yield trx
                    .updateTable("products")
                    .set((eb) => ({
                    stock: eb("stock", "-", item.quantity)
                }))
                    .where("reference_number", "=", item.product_id)
                    .execute();
            }
            // Eliminar los productos del carrito una vez realizada la compra
            yield trx.deleteFrom("shopping_cart").where("user_id", "=", user_id).execute();
        }));
        res.status(200).json({
            message: "Compra realizada con éxito",
            shopping_id: shoppingId
        });
    }
    catch (error) {
        console.error("Error al comprar:", error);
        // Proporcionar un mensaje de error más específico
        const errorMessage = error instanceof Error ? error.message : "Error al procesar la compra";
        res.status(500).json({ error: errorMessage });
    }
}));
function cleanupExpiredCartItems() {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000); // 10 minutos
    console.log("Items to delete before:", tenMinutesAgo); // Ver qué fecha se está utilizando
    index_1.default.deleteFrom("shopping_cart")
        .where("created_at", "<", tenMinutesAgo)
        .execute()
        .then((result) => {
    })
        .catch((error) => {
    });
}
setInterval(() => {
    cleanupExpiredCartItems();
}, 60 * 1000);
app.post("/api/carrito/:referenceNumber", [(0, express_validator_1.body)("quantity").isNumeric(), (0, express_validator_1.body)("user_id").isNumeric()], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user_id } = req.body;
    const referenceNumber = Number(req.params["referenceNumber"]);
    try {
        const productCart = yield index_1.default
            .insertInto("shopping_cart")
            .values({
            product_id: referenceNumber,
            quantity: 1,
            user_id: user_id,
            created_at: new Date(), // Add current timestamp
        })
            .returningAll()
            .executeTakeFirst();
        res.status(201).json({ message: "Producto agregado al carrito", productCart });
    }
    catch (error) {
        console.error("Error al agregar producto al carrito:", error);
        res.status(500).json({ error: "Error al agregar producto al carrito" });
    }
}));
app.delete("/api/carrito/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = Number(req.params["id"]);
    try {
        const deletedProduct = yield index_1.default
            .deleteFrom("shopping_cart")
            .where("id", "=", id)
            .executeTakeFirst();
        if (!deletedProduct) {
            res.status(404).json({ error: "Producto no encontrado en el carrito" });
            return;
        }
        res.status(200).json({ message: "Producto eliminado del carrito" });
    }
    catch (error) {
        console.error("Error al eliminar producto del carrito:", error);
        res.status(500).json({ error: "Error al eliminar producto del carrito" });
    }
}));
app.patch("/api/carrito/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const cartItemId = Number(req.params["id"]);
    const { userId, product_id, quantity } = req.body;
    if (!cartItemId || !userId || !product_id || quantity < 1) {
        res.status(400).json({ error: "Datos inválidos" });
        return;
    }
    console.log("📌 Actualizando cantidad:", { cartItemId, userId, product_id, quantity });
    try {
        const updatedCartItem = yield index_1.default
            .updateTable("shopping_cart")
            .set({ quantity })
            .where("id", "=", cartItemId)
            .where("user_id", "=", userId)
            .where("product_id", "=", product_id)
            .executeTakeFirst();
        if (!updatedCartItem) {
            res.status(404).json({ error: "Producto no encontrado en el carrito" });
            return;
        }
        res.status(200).json({ message: "Cantidad actualizada correctamente" });
    }
    catch (error) {
        console.error("❌ Error al actualizar la cantidad:", error);
        res.status(500).json({ error: "Error al actualizar la cantidad" });
    }
}));
app.get("/api/compras", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = Number(req.headers['userid']);
    console.log("🛍 Obteniendo compras para el usuario:", userId);
    try {
        const purchases = yield index_1.default
            .selectFrom("shopping")
            .selectAll()
            .where("user_id", "=", userId)
            .execute();
        res.status(200).json({ purchases });
    }
    catch (error) {
        console.error("Error al obtener compras:", error);
        res.status(500).json({ error: "Error al obtener las compras" });
    }
}));
app.get("/api/compras/:id/items", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = Number(req.headers["userid"]);
    const shoppingId = Number(req.params["id"]);
    try {
        // Primero verificamos que la compra pertenezca al usuario
        const purchase = yield index_1.default
            .selectFrom("shopping")
            .selectAll()
            .where("id", "=", shoppingId)
            .where("user_id", "=", userId)
            .executeTakeFirst();
        if (!purchase) {
            res.status(404).json({ error: "Compra no encontrada" });
            return;
        }
        // Obtenemos los items de la compra
        const items = yield index_1.default.selectFrom("shopping_item").selectAll().where("shopping_id", "=", shoppingId).execute();
        res.status(200).json({ items });
    }
    catch (error) {
        console.error("Error al obtener items de la compra:", error);
        res.status(500).json({ error: "Error al obtener los items de la compra" });
    }
}));
// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor Express corriendo en http://localhost:${port}`);
});
