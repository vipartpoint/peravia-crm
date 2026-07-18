import http from 'k6/http';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000/api/v1';
const USERNAME = __ENV.TEST_USER || 'admin';
const PASSWORD = __ENV.TEST_PASS || 'password';

export function getAuthToken() {
  const payload = JSON.stringify({ username: USERNAME, password: PASSWORD });
  const params = { headers: { 'Content-Type': 'application/json' } };
  
  const res = http.post(`${BASE_URL}/auth/login`, payload, params);
  
  if (res.status === 200 || res.status === 201) {
    return res.json('accessToken');
  } else {
    throw new Error('Authentication failed');
  }
}
