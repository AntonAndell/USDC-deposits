const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Proxy endpoint configuration
app.use('/api/v3', createProxyMiddleware({
  target: 'https://wallet.icon.foundation', // Target server
  changeOrigin: true, // Change the origin of the host header to the target URL
}));

// Start the server
const PORT = 3001; // Proxy server will run on this port
app.listen(PORT, () => {
  console.log(`Proxy server is running at http://localhost:${PORT}`);
});
