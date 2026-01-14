const app = require('./app');

const PORT = process.env.PORT || 3000;

const log = (level, msg, data = {}) => 
  console.log(JSON.stringify({ level, msg, ...data, time: new Date().toISOString() }));

const server = app.listen(PORT, () => {
  log('info', `📚 Book Recommendation API running on http://localhost:${PORT}`);
  log('info', `🔍 Prometheus metrics available at http://localhost:${PORT}/metrics`);
  log('info', `❤️  Health check available at http://localhost:${PORT}/health`);
  console.log(`📚 Book Recommendation API running on http://localhost:${PORT}`);
  console.log(`🔍 Prometheus metrics available at http://localhost:${PORT}/metrics`);
  console.log(`❤️  Health check available at http://localhost:${PORT}/health`);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received, shutting down gracefully`);
  log('info', 'Shutdown signal received', { signal });
  
  server.close(() => {
    log('info', 'HTTP server closed');
    console.log('HTTP server closed');
    process.exit(0);
  });
  
  setTimeout(() => {
    log('error', 'Forced shutdown after timeout');
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = server;