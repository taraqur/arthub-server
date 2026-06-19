require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');

const app = express();
app.use(express.json());

connectDB();
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/artworks", require("./routes/artwork.routes"));
app.use("/api/payments", require("./routes/payment.routes"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
