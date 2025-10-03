const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const { v4: uuidv4 } = require('uuid');
const app = express();
const PORT = process.env.PORT || 3000;
app.use(helmet());
app.use(cors());
app.use(express.json());
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});
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
const metrics = {
  requestCount: 0,
  requestStartTime: Date.now(),
  responseTimes: []
};
app.use((req, res, next) => {
  const traceId = uuidv4();
  req.traceId = traceId;
  const start = Date.now();
  logger.info({
    message: 'Incoming request',
    traceId: traceId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  res.on('finish', () => {
    const duration = Date.now() - start;
    metrics.responseTimes.push(duration);
    logger.info({
      message: 'Request completed',
      traceId: traceId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: duration,
      timestamp: new Date().toISOString()
    });
  });

  next();
});
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
app.get('/metrics', (req, res) => {
  const uptime = Date.now() - metrics.requestStartTime;
  const avgResponseTime = metrics.responseTimes.length > 0 
    ? metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length 
    : 0;
  res.json({
    requests: {
      total: metrics.requestCount,
      averageResponseTime: avgResponseTime.toFixed(2),
      uptime: `${(uptime / 1000).toFixed(2)}s`
    },
    books: {
      total: books.length
    }
  });
});
app.get('/books', (req, res) => {
  metrics.requestCount++;
  try {
    res.json({
      success: true,
      data: books,
      count: books.length
    });
  } catch (error) {
    logger.error({
      message: 'Error fetching books',
      traceId: req.traceId,
      error: error.message
    });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});
app.post('/recommendations', (req, res) => {
  metrics.requestCount++;
  const { preferredGenres = [], maxPages = 500, minRating = 4.0 } = req.body;
  try {
    let recommendations = books.filter(book => 
      book.rating >= minRating && 
      book.pages <= maxPages
    );
    if (preferredGenres.length > 0) {
      recommendations = recommendations.filter(book =>
        preferredGenres.some(genre => 
          book.genre.toLowerCase().includes(genre.toLowerCase())
        )
      );
    }
    recommendations.sort((a, b) => b.rating - a.rating);
    logger.info({
      message: 'Recommendations generated',
      traceId: req.traceId,
      preferredGenres: preferredGenres,
      recommendationsCount: recommendations.length
    });
    res.json({
      success: true,
      data: recommendations.slice(0, 5),
      filters: { preferredGenres, maxPages, minRating }
    });
  } catch (error) {
    logger.error({
      message: 'Error generating recommendations',
      traceId: req.traceId,
      error: error.message
    });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});
app.get('/books/:id', (req, res) => {
  metrics.requestCount++;
  const bookId = parseInt(req.params.id);
  const book = books.find(b => b.id === bookId);
  if (!book) {
    logger.warn({
      message: 'Book not found',
      traceId: req.traceId,
      bookId: bookId
    });
    return res.status(404).json({ success: false, error: 'Book not found' });
  }
  
  res.json({ success: true, data: book });
});
app.use((err, req, res, next) => {
  logger.error({
    message: 'Unhandled error',
    traceId: req.traceId,
    error: err.message,
    stack: err.stack
  });
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error',
    traceId: req.traceId
  });
});
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Endpoint not found',
    traceId: req.traceId
  });
});

app.listen(PORT, () => {
  logger.info(`Book Recommendation API running on port ${PORT}`);
  console.log(`📚 Book Recommendation API running on http://localhost:${PORT}`);
});
module.exports = app;