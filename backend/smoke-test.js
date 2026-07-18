const http = require('http');

async function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1' + path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    if (token) options.headers['Cookie'] = `access_token=${token}`;

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json;
        try { json = JSON.parse(data); } catch (e) { json = data; }
        
        let token = null;
        if (res.headers['set-cookie']) {
          const cookieStr = res.headers['set-cookie'].find(c => c.startsWith('access_token='));
          if (cookieStr) token = cookieStr.split(';')[0].split('=')[1];
        }
        
        resolve({ status: res.statusCode, body: json, token });
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  try {
    console.log('1. Login as Admin');
    const adminLogin = await request('POST', '/auth/login', { username: 'admin', password: 'admin123' });
    if (adminLogin.status !== 201) throw new Error('Admin login failed: ' + JSON.stringify(adminLogin.body));
    const adminToken = adminLogin.token;

    const rep1Login = await request('POST', '/auth/login', { username: 'rep1', password: 'password123' });
    const rep1Token = rep1Login.token;
    const rep2Login = await request('POST', '/auth/login', { username: 'rep2', password: 'password123' });
    const rep2Token = rep2Login.token;
    const finLogin = await request('POST', '/auth/login', { username: 'finance1', password: 'password123' });
    const finToken = finLogin.token;

    console.log('4. Test Dashboard Date Filtering');
    const d1 = await request('GET', '/dashboard/overview?startDate=2024-01-01&endDate=2024-12-31', null, adminToken);
    if (d1.status !== 200) throw new Error('Dashboard valid date failed: ' + JSON.stringify(d1.body));
    console.log('  -> Success: Valid dates');

    const d2 = await request('GET', '/dashboard/overview?startDate=invalid', null, adminToken);
    if (d2.status !== 400) throw new Error('Dashboard invalid date should return 400. Got: ' + d2.status + ' Body: ' + JSON.stringify(d2.body));
    console.log('  -> Success: Invalid date returns 400');

    console.log('5. Test Resource Authorization (Lead)');
    const leadCreate = await request('POST', '/leads', { name: 'Rep1 Lead', phone: '09121111111', source: 'Manual', brandInterest: 'Pravia' }, rep1Token);
    if (leadCreate.status !== 201 && leadCreate.status !== 200) throw new Error('Lead creation failed: ' + JSON.stringify(leadCreate.body));
    const leadId = leadCreate.body.id;
    console.log('  -> rep1 created lead ' + leadId);

    const rep2Update = await request('PATCH', `/leads/${leadId}`, { status: 'Contacted' }, rep2Token);
    if (rep2Update.status !== 403) throw new Error('rep2 should get 403 when updating rep1 lead. Got: ' + rep2Update.status);
    console.log('  -> Success: rep2 cannot update rep1 lead');

    const adminUpdate = await request('PATCH', `/leads/${leadId}`, { status: 'Contacted' }, adminToken);
    if (adminUpdate.status !== 200) throw new Error('admin should be able to update any lead. Got: ' + adminUpdate.status);
    console.log('  -> Success: SystemAdmin full access');

    console.log('6. Test Resource Authorization (Customer)');
    // Find an existing customer
    const customersReq = await request('GET', '/customers', null, adminToken);
    const customerId = customersReq.body[0].id;

    const rep1UpdateCust = await request('PATCH', `/customers/${customerId}`, { loyaltyTier: 'Silver' }, rep1Token);
    if (rep1UpdateCust.status !== 403) throw new Error('rep1 should get 403 updating unrelated customer. Got: ' + rep1UpdateCust.status);
    console.log('  -> Success: rep1 cannot access unrelated customer');

    console.log('7. Test Financial Module Access');
    const finLeadsReq = await request('GET', '/leads', null, finToken);
    if (finLeadsReq.status !== 403) throw new Error('Finance should not access leads. Got: ' + finLeadsReq.status);
    console.log('  -> Success: Finance gets 403 on leads');

    console.log('ALL SMOKE TESTS PASSED!');
  } catch(e) {
    console.error('Smoke Test Error:', e);
    process.exit(1);
  }
}

run();
