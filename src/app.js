const express = require("express");
const cors = require("cors");

const authRoutes = require("./modules/auth/auth.routes");

const categoryRoutes = require("./modules/categories/category.routes");

const bookRoutes = require("./modules/books/books.routes");

const userRoutes = require("./modules/users/user.routes");

const aiRoutes = require("./modules/ai/ai.routes");

const app = express();

app.use(cors());

app.use(express.json());

// Simple liveness check for uptime monitors / load balancers.

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok"
    });
});

app.use(
    "/api/auth", 
    authRoutes
);

app.use(
    "/api/categories", 
    categoryRoutes
);

app.use(
    "/api/books", 
    bookRoutes
);

app.use(
    "/api/users",
    userRoutes
);

app.use(
    "/api",
    aiRoutes
);

module.exports = app;