'use strict';

// Initialize tracing before loading the app (auto-instrumentations)
require('./tracing');

const app = require('./app');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Book Recommendation API listening on port ${PORT}`);
});

// Graceful shutdown
function gracefulShutdown() {
  console.log('Shutting down HTTP server...');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });

  // Force exit after 5s
  setTimeout(() => {
    console.error('Forcing shutdown');
    process.exit(1);
  }, 5000);
}

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
