import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 }, // Ramp-up to 50 users over 30s
    { duration: '1m', target: 50 },  // Stay at 50 users for 1m
    { duration: '10s', target: 0 },  // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1500', 'avg<500'], // P95 < 1.5s, Avg < 0.5s
    http_req_failed: ['rate<0.01'],               // Error rate < 1%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000/api/v1';

export default function () {
  const payload = JSON.stringify({
    username: 'admin',
    password: 'password', // Should be parameterized or use a test user
  });

  const params = {
    headers: { 'Content-Type': 'application/json' },
  };

  const res = http.post(`${BASE_URL}/auth/login`, payload, params);

  check(res, {
    'login successful': (r) => r.status === 201 || r.status === 200,
    'has token': (r) => r.json('accessToken') !== undefined,
  });

  sleep(1);
}
