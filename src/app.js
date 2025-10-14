const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(express.json({
  verify: (req, res, buf) => { req.rawBody = buf.toString(); }
}));

// Logger simplifié
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

const metrics = { count: 0, start: Date.now(), times: [] };

// Middleware de traçage
app.use((req, res, next) => {
  req.traceId = uuidv4();
  const start = Date.now();
  log('info', 'Request', { traceId: req.traceId, method: req.method, url: req.url });
  res.on('finish', () => {
    const duration = Date.now() - start;
    metrics.times.push(duration);
    log('info', 'Response', { traceId: req.traceId, status: res.statusCode, duration });
  });
  next();
});

// Gestionnaire d'erreur JSON invalide
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    log('error', 'Invalid JSON in request body', { traceId: req.traceId, error: err.message });
    return res.status(400).json({
      success: false,
      error: 'Invalid JSON in request body',
      message: 'The request contains malformed JSON'
    });
  }
  next(err);
});

// Page d'accueil
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
      </style>
    </head>
    <body>
      <h1>📚 Book Recommendation API</h1>
      <div class="stats">
        <strong>Statut:</strong> ✅ Opérationnel<br>
        <strong>Total de livres:</strong> ${books.length}<br>
        <strong>Port:</strong> ${PORT}
      </div>
      
      <h2>Endpoints disponibles</h2>
      
      <div class="endpoint">
        <span class="method get">GET</span> <code>/health</code>
        <p>Vérifier l'état de santé de l'API</p>
      </div>
      
      <div class="endpoint">
        <span class="method get">GET</span> <code>/metrics</code>
        <p>Obtenir les métriques de performance</p>
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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

// Metrics
app.get('/metrics', (req, res) => {
  const avg = metrics.times.length ? metrics.times.reduce((a, b) => a + b, 0) / metrics.times.length : 0;
  res.json({
    requests: { total: metrics.count, avgResponseTime: avg.toFixed(2) },
    books: { total: books.length }
  });
});

// Get all books
app.get('/books', (req, res) => {
  metrics.count++;
  res.json({ success: true, data: books, count: books.length });
});

// Get book by ID
app.get('/books/:id', (req, res) => {
  metrics.count++;
  const book = books.find(b => b.id === parseInt(req.params.id));
  if (!book) return res.status(404).json({ success: false, error: 'Book not found' });
  res.json({ success: true, data: book });
});

// Recommendations
app.post('/recommendations', (req, res) => {
  metrics.count++;
  const { preferredGenres = [], maxPages = 500, minRating = 4.0 } = req.body;
  
  let results = books.filter(b => b.rating >= minRating && b.pages <= maxPages);
  
  if (preferredGenres.length > 0) {
    results = results.filter(b => preferredGenres.some(g => b.genre.toLowerCase().includes(g.toLowerCase())));
  }
  
  results.sort((a, b) => b.rating - a.rating);
  
  log('info', 'Recommendations', { traceId: req.traceId, count: results.length });
  res.json({ success: true, data: results.slice(0, 5), filters: { preferredGenres, maxPages, minRating } });
});

// Error handlers
app.use((err, req, res, next) => {
  log('error', 'Error', { error: err.message });
  res.status(500).json({ success: false, error: 'Internal server error', traceId: req.traceId });
});

app.use('*', (req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found', traceId: req.traceId });
});

// Export
module.exports = app;

// Start server
if (require.main === module) {
  const server = app.listen(PORT, () => {
    log('info', `📚 API running on http://localhost:${PORT}`);
    console.log(`📚 Book Recommendation API running on http://localhost:${PORT}`);
  });
  
  process.on('SIGTERM', () => {
    console.log('Shutting down gracefully');
    server.close(() => console.log('Process terminated'));
  });
}