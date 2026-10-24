const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const apiRoutes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Mount API Routes
app.use('/api', apiRoutes);

// 404 Handler for undefined API routes (prevent falling through to HTML index.html)
app.all('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint API không tồn tại (404 Not Found)!' });
});

// Global Error Handler Middleware
app.use(errorHandler);

// Enterprise SPA Client-Side Catch-All Route (Supports all page routes including /404 & /403)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`================================================`);
  console.log(`🚀 FSOFT Employee Management Server (MVC + Postgres)`);
  console.log(`👉 Access URL: http://localhost:${PORT}`);
  console.log(`================================================`);
});
