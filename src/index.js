import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth.js';
import artworkRoutes from './routes/artwork.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import adminRoutes from './routes/admin.routes.js';
import userRoutes from './routes/user.routes.js';
import purchaseRoutes from './routes/purchase.routes.js';
import salesRoutes from './routes/sales.routes.js';
import commentRoutes from './routes/comment.routes.js';
import * as paymentController from './controllers/payment.controller.js';
import { errorHandler } from './middlewares/error.middleware.js';

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:3000"
];

app.use(cors({ 
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || origin.includes('arthub-client') || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }, 
  credentials: true 
}));
app.all(/^\/api\/auth(\/.*)?$/, async (req, res) => {
  try {
    await toNodeHandler(auth)(req, res);
  } catch (error) {
    console.error("Auth Error:", error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// Webhook needs raw body, must come before express.json()
app.post("/api/payments/webhook", express.raw({ type: "application/json" }), paymentController.webhook);

app.use(express.json());

// Ensure DB is connected before handling any request (critical on serverless)
let dbReady = connectDB();
app.use(async (req, res, next) => {
    try {
        await dbReady;
        next();
    } catch (err) {
        next(err);
    }
});

app.use("/api/artworks", artworkRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/comments", commentRoutes);

app.get("/", (req, res) => {
    res.status(200).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>ARTHUB API</title>
            <style>
                body {
                    margin: 0;
                    padding: 0;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    background-color: #0f172a;
                    color: #f8fafc;
                    font-family: 'Inter', sans-serif;
                }
                .container {
                    text-align: center;
                    padding: 3rem;
                    border-radius: 1rem;
                    background-color: #1e293b;
                    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
                    border: 1px solid #334155;
                }
                h1 {
                    font-size: 2.5rem;
                    margin-bottom: 1rem;
                    background: linear-gradient(to right, #38bdf8, #818cf8);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                p {
                    font-size: 1.125rem;
                    color: #94a3b8;
                }
                .status {
                    display: inline-flex;
                    align-items: center;
                    margin-top: 1.5rem;
                    padding: 0.5rem 1rem;
                    border-radius: 9999px;
                    background-color: #064e3b;
                    color: #34d399;
                    font-weight: 500;
                    font-size: 0.875rem;
                }
                .dot {
                    width: 8px;
                    height: 8px;
                    background-color: #10b981;
                    border-radius: 50%;
                    margin-right: 8px;
                    box-shadow: 0 0 8px #10b981;
                    animation: pulse 2s infinite;
                }
                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
                    70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>ARTHUB API</h1>
                <p>Welcome to the backend server</p>
                <div class="status">
                    <span class="dot"></span>
                    System Operational
                </div>
            </div>
        </body>
        </html>
    `);
});

app.use(errorHandler);

const PORT = process.env.PORT;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;