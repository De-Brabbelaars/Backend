import { Router } from "express";
import usersRouter from "./users.mjs";
import productsRouter from "./products.mjs";
import OrdersRouter from "./orders.mjs";
import bookingsRouter from "./bookings.mjs";
import categoriesRouter from "./categories.mjs";
import lockersRouter from "./lockers.mjs";
import orderdProductsRouter from "./orderd_products.mjs";
import receptenRouter from "./recepten.mjs";
import recipepartsRoute from "./recipe_parts.mjs"; 

const router = Router();

router.use(usersRouter);
router.use(productsRouter);
router.use(OrdersRouter);
router.use(bookingsRouter);
router.use(categoriesRouter);
router.use(lockersRouter);
router.use(orderdProductsRouter);
router.use(receptenRouter);
router.use(recipepartsRoute);

export default router;