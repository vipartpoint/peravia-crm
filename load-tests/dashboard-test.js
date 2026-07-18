import http from 'k6/http';
import { check, sleep } from 'k6';
import { getAuthToken } from './common.js';

export const options = {
  stages: [
    { duration: '30s', target: 100 },
    { duration: '2m', target: 100 },
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
    headers: {
      Authorization: `Bearer ${data.token}`,
    },
  };

  const res1 = http.get(`${BASE_URL}/dashboard/overview`, params);
  check(res1, { 'overview status is 200': (r) => r.status === 200 });

  const res2 = http.get(`${BASE_URL}/dashboard/sales`, params);
  check(res2, { 'sales status is 200': (r) => r.status === 200 });

  sleep(1);
}
