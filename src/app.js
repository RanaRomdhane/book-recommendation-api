// src/app.js
'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const { Registry, collectDefaultMetrics, Counter, Histogram } = require('prom-client');

const app = express();
app.use(bodyParser.json());

// ---------- Example data ----------
const books = [
  { id: 1, title: 'Dune', genre: 'sci-fi', pages: 412, rating: 4.8 },
  { id: 2, title: 'Foundation', genre: 'sci-fi', pages: 255, rating: 4.6 },
  { id: 3, title: 'The Hobbit', genre: 'fantasy', pages: 310, rating: 4.7 },
];

// ---------- Prometheus metrics setup ----------
const register = new Registry();

// collect default Node.js / process metrics
collectDefaultMetrics({ register });

// Custom HTTP metrics
const httpRequestsTotal = new Counter({
  name: 'app_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'statusCode'],
  registers: [register],
});

const httpRequestDuration = new Histogram({
  name: 'app_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'statusCode'],
  buckets: [0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

// Middleware to capture metrics per request
app.use((req, res, next) => {
  const start = process.hrtime();

  // After response is finished record metrics
  res.on('finish', () => {
    const delta = process.hrtime(start);
    const seconds = delta[0] + delta[1] / 1e9;
    const routeLabel = req.route && req.route.path ? req.route.path : req.path;
    httpRequestsTotal.labels(req.method, routeLabel, String(res.statusCode)).inc();
    httpRequestDuration.labels(req.method, routeLabel, String(res.statusCode)).observe(seconds);
  });

  next();
});

// ---------- Endpoints ----------
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/books', (req, res) => {
  res.json(books);
});

app.post('/recommendations', (req, res) => {
  const { preferredGenres = [], maxPages = Number.MAX_SAFE_INTEGER, minRating = 0 } = req.body || {};
  const genres = Array.isArray(preferredGenres) ? preferredGenres : [preferredGenres];

  const filtered = books.filter((b) =>
    (genres.length === 0 || genres.includes(b.genre)) &&
    b.pages <= maxPages &&
    b.rating >= minRating
  );

  res.json({ recommendations: filtered });
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType || 'text/plain; version=0.0.4');
    const metrics = await register.metrics();
    res.send(metrics);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = app;
