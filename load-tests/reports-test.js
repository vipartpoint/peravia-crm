import http from 'k6/http';
import { check, sleep } from 'k6';
import { getAuthToken } from './common.js';

export const options = {
  stages: [
    { duration: '20s', target: 20 },
    { duration: '1m', target: 20 },
    { duration: '20s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000', 'avg<800'], // Reports can be heavier
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000/api/v1';

export function setup() {
  return { token: getAuthToken() };
}

export default function (data) {
  const params = {
    headers: { Authorization: `Bearer ${data.token}` },
  };

  // Assuming CEO/SystemAdmin has reports access
  const res = http.get(`${BASE_URL}/reports/sales`, params);
  check(res, { 'sales report status is 200 or 403': (r) => r.status === 200 || r.status === 403 });

  sleep(2);
}
