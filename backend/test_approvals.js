const axios = require('axios');

const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  validateStatus: () => true
});

let systemAdminCookie = '';
let salesRepCookie = '';
let warehouseManagerCookie = '';

async function loginUser(username, role) {
  const existing = await api.post('/auth/login', { phone: username, password: 'password123' });
  if (existing.status === 200) {
    return existing.headers['set-cookie'][0].split(';')[0];
  }
  
  await api.post('/auth/register', {
    username,
    phone: username,
    password: 'password123',
    roleId: role,
    territoryId: '123e4567-e89b-12d3-a456-426614174000',
    firstName: username,
    lastName: 'Test'
  });
  const loginRes = await api.post('/auth/login', { phone: username, password: 'password123' });
  return loginRes.headers['set-cookie'][0].split(';')[0];
}

async function runTests() {
  console.log('--- STARTING APPROVAL CENTER TESTS ---');

  const rolesRes = await api.get('/roles');
  const rolesArray = rolesRes.data.data || rolesRes.data;
  const systemAdminRole = rolesArray.find(r => r.name === 'SystemAdmin')?.id;
  const salesRepRole = rolesArray.find(r => r.name === 'SalesRep')?.id;
  const warehouseManagerRole = rolesArray.find(r => r.name === 'WarehouseManager')?.id;

  systemAdminCookie = await loginUser('09120000019', systemAdminRole);
  salesRepCookie = await loginUser('09120000029', salesRepRole);
  warehouseManagerCookie = await loginUser('09120000039', warehouseManagerRole);

  const getHeaders = (cookie) => ({ headers: { 'Cookie': cookie } });

  console.log('1. Testing Warehouse Transfer creates ApprovalRequest');
  
  const pRes = await api.post('/products', { name: 'P1', sku: 'SKU' + Date.now(), categoryId: null, brand: 'B1', basePrice: 1000 }, getHeaders(systemAdminCookie));
  const wRes1 = await api.post('/warehouses', { code: 'W1' + Date.now(), name: 'W1', type: 'Main', address: 'A', managerId: null }, getHeaders(systemAdminCookie));
  const wRes2 = await api.post('/warehouses', { code: 'W2' + Date.now(), name: 'W2', type: 'Main', address: 'A', managerId: null }, getHeaders(systemAdminCookie));
  
  const tRes = await api.post('/warehouses/transfers', {
    sourceWarehouseId: wRes1.data?.id || 'w1',
    destWarehouseId: wRes2.data?.id || 'w2',
    productId: pRes.data?.id || 'p1',
    quantity: 5,
    notes: 'Test'
  }, getHeaders(warehouseManagerCookie));
  
  if (tRes.status !== 201) {
    console.log('Setup failed: could not create transfer request.', tRes.data);
  } else {
    console.log('Created StockTransferRequest:', tRes.data.id);
    const subRes = await api.post(`/warehouses/transfers/${tRes.data.id}/submit`, {}, getHeaders(warehouseManagerCookie));
    
    const appRes = await api.get('/approvals', getHeaders(systemAdminCookie));
    const createdApproval = appRes.data.data.find(a => a.entityId === tRes.data.id);
    if (createdApproval) {
      console.log('PASS: Warehouse Transfer creates ApprovalRequest');
    } else {
      console.log('FAIL: Warehouse Transfer did not create ApprovalRequest');
    }

    if (createdApproval) {
      console.log('2. Test RBAC: SalesRep cannot approve');
      const rejectRep = await api.patch(`/approvals/${createdApproval.id}/approve`, { comments: 'ok' }, getHeaders(salesRepCookie));
      if (rejectRep.status === 403) console.log('PASS: SalesRep blocked from approving');
      else console.log('FAIL: SalesRep was not blocked', rejectRep.status);

      console.log('3. Reject without comment fails');
      const rejectNoComment = await api.patch(`/approvals/${createdApproval.id}/reject`, {}, getHeaders(systemAdminCookie));
      if (rejectNoComment.status === 400) console.log('PASS: Reject without comment failed');
      else console.log('FAIL: Reject without comment did not fail');

      console.log('4. Approve action works & updates source entity');
      const approveRes = await api.patch(`/approvals/${createdApproval.id}/approve`, { comments: 'Approved by test' }, getHeaders(systemAdminCookie));
      if (approveRes.status === 200) console.log('PASS: Approve works');
      else console.log('FAIL: Approve failed', approveRes.data);

      const tResFinal = await api.get(`/warehouses/transfers`, getHeaders(systemAdminCookie));
      const myT = tResFinal.data.find(t => t.id === tRes.data.id);
      if (myT?.status === 'Approved') console.log('PASS: Source entity updated after approval');
      else console.log('FAIL: Source entity not updated, status is', myT?.status);
      
      console.log('5. Activity created on approval');
      const actRes = await api.get(`/activities?entityId=${createdApproval.id}`, getHeaders(systemAdminCookie));
      if (actRes.data.data && actRes.data.data.some(a => a.activityType === 'ApprovalApproved')) console.log('PASS: Activity ApprovalApproved created');
      else console.log('FAIL: Activity not found');
    }
  }

  // Dashboard Metrics
  const dashRes = await api.get('/approvals/dashboard', getHeaders(systemAdminCookie));
  if (dashRes.status === 200 && typeof dashRes.data.totalPending === 'number') {
    console.log('PASS: Dashboard metrics works', dashRes.data);
  } else {
    console.log('FAIL: Dashboard metrics failed');
  }

  console.log('--- ALL TESTS COMPLETED ---');
}

runTests();
