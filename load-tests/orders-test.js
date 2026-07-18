import http from 'k6/http';
import { check, sleep } from 'k6';
import { getAuthToken } from './common.js';

export const options = {
  stages: [
    { duration: '30s', target: 50 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1500', 'avg<500'],
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

  const res = http.get(`${BASE_URL}/orders`, params);
  check(res, { 'orders list status is 200': (r) => r.status === 200 });

  sleep(1);
}
