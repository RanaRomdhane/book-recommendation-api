const request = require('supertest');

// Import the app without starting the server
const app = require('../src/app');

describe('Book Recommendation API', () => {
  it('should return health status', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('OK');
  });

  it('should return all books', async () => {
    const res = await request(app).get('/books');
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toEqual(true);
    expect(res.body.data).toHaveLength(10);
  });

  it('should return book recommendations for sci-fi', async () => {
    const res = await request(app)
      .post('/recommendations')
      .send({ preferredGenres: ['sci-fi'], minRating: 4.5 });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toEqual(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].genre).toEqual('sci-fi');
  });

  it('should return metrics', async () => {
    const res = await request(app).get('/metrics');
    expect(res.statusCode).toEqual(200);
    // Check it returns Prometheus format
    expect(res.headers['content-type']).toContain('text/plain');
    expect(res.text).toBeDefined();
  });

  it('should return specific book by ID', async () => {
    const res = await request(app).get('/books/1');
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.title).toEqual('The Great Gatsby');
  });

  it('should return 404 for non-existent book', async () => {
    const res = await request(app).get('/books/999');
    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toEqual(false);
  });

  it('should handle invalid JSON in request body', async () => {
    const res = await request(app)
      .post('/recommendations')
      .set('Content-Type', 'application/json')
      .send('invalid json');
    
    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toEqual(false);
    expect(res.body.error).toContain('Invalid JSON');
  });

  it('should handle empty JSON object', async () => {
    const res = await request(app)
      .post('/recommendations')
      .set('Content-Type', 'application/json')
      .send('{}');
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toEqual(true);
  });

  it('should handle unknown endpoints', async () => {
    const res = await request(app).get('/unknown-endpoint');
    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toEqual(false);
  });
});