import request from 'supertest';
import app from '../app';

describe('App Endpoints', () => {
    describe('GET /health', () => {
        it('should return 200 and a status of ok', async () => {
            const response = await request(app).get('/health');
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('status', 'ok');
            expect(response.body).toHaveProperty('timestamp');
        });
    });

    describe('GET /api-docs', () => {
        it('should return API documentation', async () => {
            const response = await request(app).get('/api-docs');
            expect(response.status).toBe(301).or(200); // Because redirect might happen
        });
    });

    describe('404 Handler', () => {
        it('should return 404 for unknown routes', async () => {
            const response = await request(app).get('/non-existent-route');
            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('error');
        });
    });
});
