const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const client = require('prom-client');

const app = express();
const PORT = process.env.PORT || 3000;

// Prometheus metrics setup
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ 
  prefix: 'book_api_',
  timeout: 5000 
});

// Custom metrics
const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'book_api_http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [50, 100, 200, 500, 1000, 2000, 5000]
});

const httpRequestsTotal = new client.Counter({
  name: 'book_api_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const booksCounter = new client.Counter({
  name: 'book_api_books_requested_total',
  help: 'Total number of books requested',
  labelNames: ['endpoint']
});

const recommendationsCounter = new client.Counter({
  name: 'book_api_recommendations_total',
  help: 'Total number of recommendations generated',
  labelNames: ['genre_count']
});

const recommendationDuration = new client.Histogram({
  name: 'book_api_recommendation_duration_ms',
  help: 'Duration of recommendation generation in ms',
  buckets: [10, 50, 100, 200, 500]
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(rateLimit({ 
  windowMs: 15 * 60 * 1000, 
  max: 100,
  message: {
    success: false,
    error: 'Too many requests',
    message: 'Rate limit exceeded. Please try again later.'
  }
}));
app.use(express.json({
  verify: (req, res, buf) => { req.rawBody = buf.toString(); }
}));

const log = (level, msg, data = {}) => 
  console.log(JSON.stringify({ level, msg, ...data, time: new Date().toISOString() }));

// Données
const books = [
  { id: 1, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', genre: 'classic', pages: 180, rating: 4.5 },
  { id: 2, title: 'Dune', author: 'Frank Herbert', genre: 'sci-fi', pages: 412, rating: 4.7 },
  { id: 3, title: 'Harry Potter and the Sorcerer\'s Stone', author: 'J.K. Rowling', genre: 'fantasy', pages: 320, rating: 4.8 },
  { id: 4, title: 'To Kill a Mockingbird', author: 'Harper Lee', genre: 'classic', pages: 281, rating: 4.7 },
  { id: 5, title: 'Foundation', author: 'Isaac Asimov', genre: 'sci-fi', pages: 255, rating: 4.6 },
  { id: 6, title: 'The Hobbit', author: 'J.R.R. Tolkien', genre: 'fantasy', pages: 310, rating: 4.9 },
  { id: 7, title: '1984', author: 'George Orwell', genre: 'dystopian', pages: 328, rating: 4.6 },
  { id: 8, title: 'Pride and Prejudice', author: 'Jane Austen', genre: 'romance', pages: 432, rating: 4.5 },
  { id: 9, title: 'The Martian', author: 'Andy Weir', genre: 'sci-fi', pages: 369, rating: 4.4 },
  { id: 10, title: 'The Name of the Wind', author: 'Patrick Rothfuss', genre: 'fantasy', pages: 662, rating: 4.8 }
];

// Legacy metrics for backward compatibility
const metrics = { count: 0, start: Date.now(), times: [] };

// Enhanced request logging with metrics
app.use((req, res, next) => {
  req.traceId = uuidv4();
  const start = Date.now();
  
  log('info', 'Request started', { 
    traceId: req.traceId, 
    method: req.method, 
    url: req.url,
    userAgent: req.get('User-Agent')
  });
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Track legacy metrics
    metrics.times.push(duration);
    metrics.count++;
    
    // Track Prometheus metrics
    const route = req.route?.path || req.path;
    httpRequestDurationMicroseconds
      .labels(req.method, route, res.statusCode)
      .observe(duration);
    
    httpRequestsTotal
      .labels(req.method, route, res.statusCode)
      .inc();
    
    log('info', 'Request completed', { 
      traceId: req.traceId, 
      method: req.method, 
      url: req.url, 
      status: res.statusCode, 
      duration 
    });
  });
  
  next();
});

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    log('error', 'Invalid JSON in request body', { 
      traceId: req.traceId, 
      error: err.message,
      rawBody: req.rawBody?.substring(0, 200) // Log first 200 chars for debugging
    });
    return res.status(400).json({
      success: false,
      error: 'Invalid JSON in request body',
      message: 'The request contains malformed JSON',
      traceId: req.traceId
    });
  }
  next(err);
});

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Book Recommendation API</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; background: #f5f5f5; }
        h1 { color: #333; }
        .endpoint { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #007bff; }
        .method { display: inline-block; padding: 3px 8px; border-radius: 3px; font-weight: bold; color: white; }
        .get { background: #28a745; }
        .post { background: #007bff; }
        code { background: #e9ecef; padding: 2px 6px; border-radius: 3px; }
        .stats { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .observability { background: #d1ecf1; padding: 15px; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <h1>📚 Book Recommendation API</h1>
      <div class="stats">
        <strong>Statut:</strong> ✅ Opérationnel<br>
        <strong>Total de livres:</strong> ${books.length}<br>
        <strong>Port:</strong> ${PORT}<br>
        <strong>Requêtes totales:</strong> ${metrics.count}
      </div>
      
      <div class="observability">
        <h3>🔍 Observability</h3>
        <strong>Prometheus Metrics:</strong> <a href="/metrics">/metrics</a><br>
        <strong>Health Check:</strong> <a href="/health">/health</a><br>
        <strong>OpenTelemetry:</strong> Active avec tracing distribué
      </div>
      
      <h2>Endpoints disponibles</h2>
      <div class="endpoint">
        <span class="method get">GET</span> <code>/health</code>
        <p>Vérifier l'état de santé de l'API</p>
      </div>
      <div class="endpoint">
        <span class="method get">GET</span> <code>/metrics</code>
        <p>Obtenir les métriques Prometheus</p>
      </div>
      <div class="endpoint">
        <span class="method get">GET</span> <code>/books</code>
        <p>Obtenir tous les livres</p>
      </div>
      <div class="endpoint">
        <span class="method get">GET</span> <code>/books/:id</code>
        <p>Obtenir un livre par son ID</p>
      </div>
      <div class="endpoint">
        <span class="method post">POST</span> <code>/recommendations</code>
        <p>Obtenir des recommandations personnalisées</p>
        <p><strong>Body exemple:</strong></p>
        <pre>{ 
  "preferredGenres": ["sci-fi", "fantasy"],
  "maxPages": 400,
  "minRating": 4.5
}</pre>
      </div>
    </body>
    </html>
  `);
});

app.get('/health', (req, res) => {
  const healthCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0'
  };
  
  res.json(healthCheck);
});

// Enhanced metrics endpoint with both legacy and Prometheus metrics
app.get('/metrics', async (req, res) => {
  try {
    // Return Prometheus metrics format
    res.set('Content-Type', client.register.contentType);
    const metrics = await client.register.metrics();
    res.end(metrics);
  } catch (error) {
    log('error', 'Failed to collect metrics', { error: error.message });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to collect metrics',
      traceId: req.traceId 
    });
  }
});

// Legacy metrics endpoint for backward compatibility
app.get('/legacy-metrics', (req, res) => {
  const avg = metrics.times.length ? metrics.times.reduce((a, b) => a + b, 0) / metrics.times.length : 0;
  res.json({
    requests: { 
      total: metrics.count, 
      avgResponseTime: avg.toFixed(2),
      uptime: Math.floor(process.uptime())
    },
    books: { total: books.length },
    memory: process.memoryUsage()
  });
});

app.get('/books', (req, res) => {
  booksCounter.labels('all_books').inc();
  
  log('info', 'Books list requested', { 
    traceId: req.traceId,
    bookCount: books.length
  });
  
  res.json({ 
    success: true, 
    data: books, 
    count: books.length,
    traceId: req.traceId 
  });
});

app.get('/books/:id', (req, res) => {
  const bookId = parseInt(req.params.id);
  booksCounter.labels('single_book').inc();
  
  const book = books.find(b => b.id === bookId);
  
  if (!book) {
    log('warn', 'Book not found', { 
      traceId: req.traceId,
      bookId: bookId
    });
    return res.status(404).json({ 
      success: false, 
      error: 'Book not found',
      traceId: req.traceId 
    });
  }
  
  log('info', 'Book found', { 
    traceId: req.traceId,
    bookId: bookId,
    title: book.title
  });
  
  res.json({ 
    success: true, 
    data: book,
    traceId: req.traceId 
  });
});

app.post('/recommendations', (req, res) => {
  const startTime = Date.now();
  const { preferredGenres = [], maxPages = 500, minRating = 4.0 } = req.body;
  
  log('info', 'Recommendations requested', {
    traceId: req.traceId,
    preferredGenres,
    maxPages,
    minRating
  });
  
  // Validate input
  if (!Array.isArray(preferredGenres)) {
    return res.status(400).json({
      success: false,
      error: 'preferredGenres must be an array',
      traceId: req.traceId
    });
  }
  
  if (typeof maxPages !== 'number' || maxPages <= 0) {
    return res.status(400).json({
      success: false,
      error: 'maxPages must be a positive number',
      traceId: req.traceId
    });
  }
  
  if (typeof minRating !== 'number' || minRating < 0 || minRating > 5) {
    return res.status(400).json({
      success: false,
      error: 'minRating must be a number between 0 and 5',
      traceId: req.traceId
    });
  }
  
  try {
    let results = books.filter(b => b.rating >= minRating && b.pages <= maxPages);
    
    if (preferredGenres.length > 0) {
      results = results.filter(b => 
        preferredGenres.some(g => 
          b.genre.toLowerCase().includes(g.toLowerCase())
        )
      );
    }
    
    results.sort((a, b) => b.rating - a.rating);
    const finalResults = results.slice(0, 5);
    
    const duration = Date.now() - startTime;
    
    // Track metrics
    recommendationsCounter.labels(preferredGenres.length.toString()).inc();
    recommendationDuration.observe(duration);
    
    log('info', 'Recommendations generated', { 
      traceId: req.traceId, 
      count: finalResults.length,
      duration,
      filters: { preferredGenres, maxPages, minRating }
    });
    
    res.json({ 
      success: true, 
      data: finalResults, 
      count: finalResults.length,
      filters: { preferredGenres, maxPages, minRating },
      traceId: req.traceId 
    });
    
  } catch (error) {
    log('error', 'Error generating recommendations', {
      traceId: req.traceId,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      error: 'Internal server error while generating recommendations',
      traceId: req.traceId
    });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  log('error', 'Unhandled error', { 
    traceId: req.traceId,
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });
  
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error', 
    traceId: req.traceId 
  });
});

// 404 handler
app.use('*', (req, res) => {
  log('warn', 'Endpoint not found', {
    traceId: req.traceId,
    method: req.method,
    url: req.originalUrl
  });
  
  res.status(404).json({ 
    success: false, 
    error: 'Endpoint not found', 
    traceId: req.traceId 
  });
});

module.exports = app;

if (require.main === module) {
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
      
      // Close any other connections or cleanup here
      process.exit(0);
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
      log('error', 'Forced shutdown after timeout');
      console.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}