import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app';
import { prisma } from '../config/prisma';

describe('Mini ERP + CRM API Integration Tests', () => {
  let adminToken: string;
  let salesToken: string;
  let warehouseToken: string;
  let testCustomerId: string;
  let testProductAId: string;
  let testProductBId: string;

  beforeAll(async () => {
    // Clean and re-seed database before starting
    // We already seeded it, but let's log in to get tokens
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'Admin@123' });
    adminToken = adminRes.body.token;

    const salesRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'sales@example.com', password: 'Sales@123' });
    salesToken = salesRes.body.token;

    const warehouseRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'warehouse@example.com', password: 'Warehouse@123' });
    warehouseToken = warehouseRes.body.token;

    // Create temporary products and customer for transaction tests
    const customer = await prisma.customer.create({
      data: {
        customerName: 'Test Customer LLC',
        businessName: 'Test Biz',
        mobile: '1234567890',
        customerType: 'WHOLESALE',
        status: 'ACTIVE',
        address: 'Test Address',
      },
    });
    testCustomerId = customer.id;

    const prodA = await prisma.product.create({
      data: {
        productName: 'Test Product Alpha',
        sku: 'TEST-PROD-ALPHA',
        category: 'Test',
        unitPrice: 100,
        currentStock: 10,
        minimumStock: 2,
        warehouseLocation: 'Test Location',
      },
    });
    testProductAId = prodA.id;

    const prodB = await prisma.product.create({
      data: {
        productName: 'Test Product Beta',
        sku: 'TEST-PROD-BETA',
        category: 'Test',
        unitPrice: 200,
        currentStock: 5,
        minimumStock: 1,
        warehouseLocation: 'Test Location',
      },
    });
    testProductBId = prodB.id;
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.salesChallanItem.deleteMany({
      where: {
        productId: { in: [testProductAId, testProductBId] },
      },
    });
    await prisma.salesChallan.deleteMany({
      where: {
        customerId: testCustomerId,
      },
    });
    await prisma.stockMovement.deleteMany({
      where: {
        productId: { in: [testProductAId, testProductBId] },
      },
    });
    await prisma.product.deleteMany({
      where: {
        id: { in: [testProductAId, testProductBId] },
      },
    });
    await prisma.customer.deleteMany({
      where: {
        id: testCustomerId,
      },
    });
  });

  describe('Authentication and RBAC Authorization', () => {
    it('should successfully log in with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@example.com', password: 'Admin@123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.role).toBe('ADMIN');
    });

    it('should reject login with incorrect credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@example.com', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should block unauthorized roles from managing users', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${salesToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should allow Admin to list users', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });
  });

  describe('Inventory Management', () => {
    it('should allow Warehouse user to add stock (Stock IN)', async () => {
      const initialStock = (await prisma.product.findUnique({ where: { id: testProductAId } }))?.currentStock || 0;

      const res = await request(app)
        .post('/api/inventory/movements')
        .set('Authorization', `Bearer ${warehouseToken}`)
        .send({
          productId: testProductAId,
          quantity: 5,
          movementType: 'IN',
          reason: 'Inbound purchase delivery',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      const finalProduct = await prisma.product.findUnique({ where: { id: testProductAId } });
      expect(finalProduct?.currentStock).toBe(initialStock + 5);
    });

    it('should prevent stock from becoming negative (Stock OUT > currentStock)', async () => {
      const res = await request(app)
        .post('/api/inventory/movements')
        .set('Authorization', `Bearer ${warehouseToken}`)
        .send({
          productId: testProductBId,
          quantity: 100, // exceeds available stock (5)
          movementType: 'OUT',
          reason: 'Manual adjustment check',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Insufficient stock');
    });
  });

  describe('Atomic Sales Challan Confirmation & Transaction Rollback', () => {
    it('should create a challan in DRAFT status and NOT reduce inventory stock', async () => {
      const stockA = (await prisma.product.findUnique({ where: { id: testProductAId } }))?.currentStock || 0;
      const stockB = (await prisma.product.findUnique({ where: { id: testProductBId } }))?.currentStock || 0;

      const res = await request(app)
        .post('/api/challans')
        .set('Authorization', `Bearer ${salesToken}`)
        .send({
          customerId: testCustomerId,
          items: [
            { productId: testProductAId, quantity: 2 },
            { productId: testProductBId, quantity: 2 },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('DRAFT');

      // Stock should remain unchanged
      const currentStockA = (await prisma.product.findUnique({ where: { id: testProductAId } }))?.currentStock;
      const currentStockB = (await prisma.product.findUnique({ where: { id: testProductBId } }))?.currentStock;
      expect(currentStockA).toBe(stockA);
      expect(currentStockB).toBe(stockB);
    });

    it('should confirm draft challan and successfully reduce inventory stock', async () => {
      // 1. Create a draft challan
      const draftRes = await request(app)
        .post('/api/challans')
        .set('Authorization', `Bearer ${salesToken}`)
        .send({
          customerId: testCustomerId,
          items: [
            { productId: testProductAId, quantity: 3 },
          ],
        });
      const challanId = draftRes.body.data.id;

      const initialStockA = (await prisma.product.findUnique({ where: { id: testProductAId } }))?.currentStock || 0;

      // 2. Confirm the challan
      const confirmRes = await request(app)
        .post(`/api/challans/${challanId}/confirm`)
        .set('Authorization', `Bearer ${salesToken}`);

      expect(confirmRes.status).toBe(200);
      expect(confirmRes.body.success).toBe(true);
      expect(confirmRes.body.data.status).toBe('CONFIRMED');

      // 3. Verify stock is reduced
      const finalStockA = (await prisma.product.findUnique({ where: { id: testProductAId } }))?.currentStock;
      expect(finalStockA).toBe(initialStockA - 3);
    });

    it('should fail confirmation and roll back the entire transaction if ANY product has insufficient stock', async () => {
      // Stock levels: Product A has plenty, Product B has 5.
      const initialStockA = (await prisma.product.findUnique({ where: { id: testProductAId } }))?.currentStock || 0;
      const initialStockB = (await prisma.product.findUnique({ where: { id: testProductBId } }))?.currentStock || 0;

      // 1. Create draft challan requesting:
      // Product A: 2 (Available: e.g. 12)
      // Product B: 10 (Available: 5)
      const draftRes = await request(app)
        .post('/api/challans')
        .set('Authorization', `Bearer ${salesToken}`)
        .send({
          customerId: testCustomerId,
          items: [
            { productId: testProductAId, quantity: 2 },
            { productId: testProductBId, quantity: 10 }, // This exceeds B's stock
          ],
        });
      const challanId = draftRes.body.data.id;

      // 2. Confirm the challan - should fail due to product B stock shortage
      const confirmRes = await request(app)
        .post(`/api/challans/${challanId}/confirm`)
        .set('Authorization', `Bearer ${salesToken}`);

      expect(confirmRes.status).toBe(400);
      expect(confirmRes.body.success).toBe(false);
      expect(confirmRes.body.message).toContain('Insufficient stock');

      // 3. Verify rollback: Stock of Product A must NOT be reduced even though it had sufficient quantity!
      const finalStockA = (await prisma.product.findUnique({ where: { id: testProductAId } }))?.currentStock;
      const finalStockB = (await prisma.product.findUnique({ where: { id: testProductBId } }))?.currentStock;

      expect(finalStockA).toBe(initialStockA);
      expect(finalStockB).toBe(initialStockB);
    });
  });
});
