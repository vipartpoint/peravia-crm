import axios from 'axios';
import * as jwt from 'jsonwebtoken';

async function run() {
  const token = jwt.sign({ id: 'some-admin-id', role: 'ADMIN' }, 'super-secret-jwt-key-replace-in-production', { expiresIn: '1h' });
  const api = axios.create({
    baseURL: 'http://localhost:3000/api/v1',
    headers: { Authorization: `Bearer ${token}` }
  });

  const endpoints = [
    '/catalogs/lost-reasons',
    '/catalogs/reopen-reasons',
    '/catalogs/competitors',
    '/catalogs/invalid-type'
  ];

  for (const ep of endpoints) {
    try {
      console.log(`\n--- GET ${ep} ---`);
      const res = await api.get(ep);
      console.log(`Status: ${res.status}`);
      console.log(JSON.stringify(res.data, null, 2));
    } catch (e: any) {
      console.log(`Status: ${e.response?.status}`);
      console.log(JSON.stringify(e.response?.data, null, 2));
    }
  }
}

run();
