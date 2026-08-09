import { PrismaClient, Role, CustomerType, CustomerStatus, ChallanStatus, MovementType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean database
  await prisma.salesChallanItem.deleteMany({});
  await prisma.salesChallan.deleteMany({});
  await prisma.stockMovement.deleteMany({});
  await prisma.customerFollowUp.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.user.deleteMany({});

  // 1. Create Users
  const passwordHashAdmin = await bcrypt.hash('Admin@123', 10);
  const passwordHashSales = await bcrypt.hash('Sales@123', 10);
  const passwordHashWarehouse = await bcrypt.hash('Warehouse@123', 10);
  const passwordHashAccounts = await bcrypt.hash('Accounts@123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Aayush Pal (Admin)',
      email: 'admin@example.com',
      passwordHash: passwordHashAdmin,
      role: Role.ADMIN,
      isActive: true,
    },
  });

  const sales = await prisma.user.create({
    data: {
      name: 'Rajesh Kumar (Sales)',
      email: 'sales@example.com',
      passwordHash: passwordHashSales,
      role: Role.SALES,
      isActive: true,
    },
  });

  const warehouse = await prisma.user.create({
    data: {
      name: 'Vikram Singh (Warehouse)',
      email: 'warehouse@example.com',
      passwordHash: passwordHashWarehouse,
      role: Role.WAREHOUSE,
      isActive: true,
    },
  });

  const accounts = await prisma.user.create({
    data: {
      name: 'Sanjay Mehta (Accounts)',
      email: 'accounts@example.com',
      passwordHash: passwordHashAccounts,
      role: Role.ACCOUNTS,
      isActive: true,
    },
  });

  console.log('Users seeded successfully!');

  // 2. Create Customers
  const customersData = [
    { customerName: 'Ramesh Sharma', businessName: 'Sharma Distributors', mobile: '9876543210', email: 'sharma.dist@gmail.com', gstNumber: '07AAAAA1111A1Z1', customerType: CustomerType.DISTRIBUTOR, status: CustomerStatus.ACTIVE, address: 'Plot 45, Okhla Industrial Area Phase 3, New Delhi, Delhi 110020' },
    { customerName: 'Amit Gupta', businessName: 'Gupta Enterprises', mobile: '9988776655', email: 'gupta.ent@gmail.com', gstNumber: '27AAPCS1034E1Z3', customerType: CustomerType.WHOLESALE, status: CustomerStatus.ACTIVE, address: 'Shop 12, Crawford Market, Mumbai, Maharashtra 400001' },
    { customerName: 'Vijay Patel', businessName: 'Krishna Wholesale', mobile: '8877665544', email: 'krishna.wholesale@yahoo.com', gstNumber: '24AAAAC1234A1Z9', customerType: CustomerType.WHOLESALE, status: CustomerStatus.ACTIVE, address: 'A-201, GIDC Electronic Estate, Gandhinagar, Gujarat 382016' },
    { customerName: 'Sanjay Jain', businessName: 'ABC Traders', mobile: '7766554433', email: 'abc.traders@outlook.com', gstNumber: '08AABCA1234E1Z4', customerType: CustomerType.RETAIL, status: CustomerStatus.ACTIVE, address: '124, Johari Bazar, Jaipur, Rajasthan 302003' },
    { customerName: 'Harpreet Singh', businessName: 'Khalsa Logistics', mobile: '9012345678', email: 'khalsa.log@gmail.com', gstNumber: '03AAACK1010A1Z5', customerType: CustomerType.DISTRIBUTOR, status: CustomerStatus.ACTIVE, address: '34, Transport Nagar, Ludhiana, Punjab 141003' },
    { customerName: 'Karthik Rao', businessName: 'Dakshin Electricals', mobile: '9845012345', email: 'dakshin.elec@gmail.com', gstNumber: '29AAAAD1020A1Z2', customerType: CustomerType.WHOLESALE, status: CustomerStatus.ACTIVE, address: '56, Chickpet Road, Bengaluru, Karnataka 560053' },
    { customerName: 'Naveen Reddy', businessName: 'Balaji Polymers', mobile: '9900112233', email: 'balaji.poly@gmail.com', gstNumber: '36AAAAB2020A1Z0', customerType: CustomerType.RETAIL, status: CustomerStatus.LEAD, address: '7-2, Industrial Development Area, Uppal, Hyderabad, Telangana 500039' },
    { customerName: 'Manoj Bose', businessName: 'Bengal Goods Syndicate', mobile: '9830012345', email: 'bengal.goods@gmail.com', gstNumber: '19AAAAF3030A1Z8', customerType: CustomerType.DISTRIBUTOR, status: CustomerStatus.ACTIVE, address: '10, Canning Street, Kolkata, West Bengal 700001' },
    { customerName: 'Rajesh Pillai', businessName: 'Pillai & Sons', mobile: '9447012345', email: 'pillai.sons@gmail.com', gstNumber: '32AAAAP4040A1Z6', customerType: CustomerType.RETAIL, status: CustomerStatus.INACTIVE, address: '22/450, M.G. Road, Ernakulam, Kochi, Kerala 682011' },
    { customerName: 'Deepak Verma', businessName: 'Verma Stationery House', mobile: '9811054321', email: 'verma.stationery@gmail.com', gstNumber: '09AAADV5050A1Z7', customerType: CustomerType.RETAIL, status: CustomerStatus.ACTIVE, address: 'B-14, Sector 18, Noida, Uttar Pradesh 201301' },
  ];

  const seededCustomers = [];
  for (const c of customersData) {
    const customer = await prisma.customer.create({
      data: {
        ...c,
        followUpDate: c.status === CustomerStatus.LEAD ? new Date(Date.now() + 86400000 * 2) : null, // 2 days later for leads
        notes: `Initial registration notes for ${c.businessName}.`,
      },
    });
    seededCustomers.push(customer);
  }

  console.log('Customers seeded successfully!');

  // 3. Create Products
  const productsData = [
    { productName: 'Standard Wire Bundle 10m', sku: 'ELEC-WIR-001', category: 'Electricals', unitPrice: 450.00, currentStock: 120, minimumStock: 20, warehouseLocation: 'Aisle A-Shelf 3' },
    { productName: 'Heavy Duty Extension Board 5-plug', sku: 'ELEC-EXT-002', category: 'Electricals', unitPrice: 850.00, currentStock: 45, minimumStock: 10, warehouseLocation: 'Aisle A-Shelf 4' },
    { productName: 'LED Bulb 9W (Pack of 10)', sku: 'ELEC-LED-003', category: 'Lighting', unitPrice: 799.00, currentStock: 250, minimumStock: 30, warehouseLocation: 'Aisle B-Shelf 1' },
    { productName: 'PVC Conduit Pipe 1 inch', sku: 'PLUM-PIP-001', category: 'Plumbing', unitPrice: 120.00, currentStock: 300, minimumStock: 50, warehouseLocation: 'Aisle C-Shelf 1' },
    { productName: 'Brass Ball Valve 1 inch', sku: 'PLUM-VAL-002', category: 'Plumbing', unitPrice: 320.00, currentStock: 80, minimumStock: 15, warehouseLocation: 'Aisle C-Shelf 2' },
    { productName: 'Teflon Thread Seal Tape', sku: 'PLUM-TAP-003', category: 'Plumbing', unitPrice: 25.00, currentStock: 10, minimumStock: 30, warehouseLocation: 'Aisle C-Shelf 3' }, // Low stock item
    { productName: 'Industrial Steel Screw Box', sku: 'HARD-SCR-001', category: 'Hardware', unitPrice: 650.00, currentStock: 0, minimumStock: 10, warehouseLocation: 'Aisle D-Shelf 1' }, // Out of stock
    { productName: 'Nylon Anchor Fasteners (100pcs)', sku: 'HARD-ANC-002', category: 'Hardware', unitPrice: 400.00, currentStock: 50, minimumStock: 15, warehouseLocation: 'Aisle D-Shelf 2' },
    { productName: 'Matte Interior Wall Paint White 20L', sku: 'PAIN-WHT-001', category: 'Paints', unitPrice: 3800.00, currentStock: 15, minimumStock: 5, warehouseLocation: 'Aisle E-Shelf 1' },
    { productName: 'Metal Primer Paint Red Oxide 5L', sku: 'PAIN-RED-002', category: 'Paints', unitPrice: 950.00, currentStock: 3, minimumStock: 5, warehouseLocation: 'Aisle E-Shelf 2' }, // Low stock
    { productName: 'Synthetic Paint Brush 3 inch', sku: 'PAIN-BRU-003', category: 'Paints', unitPrice: 85.00, currentStock: 150, minimumStock: 25, warehouseLocation: 'Aisle E-Shelf 3' },
    { productName: 'Stainless Steel Hinge 4 inch', sku: 'HARD-HIN-003', category: 'Hardware', unitPrice: 150.00, currentStock: 110, minimumStock: 20, warehouseLocation: 'Aisle D-Shelf 3' },
    { productName: 'Copper Strip Grounding 2m', sku: 'ELEC-COP-004', category: 'Electricals', unitPrice: 1250.00, currentStock: 22, minimumStock: 5, warehouseLocation: 'Aisle A-Shelf 1' },
    { productName: 'PVC Elbow Joint 90 deg 1 inch', sku: 'PLUM-ELB-004', category: 'Plumbing', unitPrice: 45.00, currentStock: 450, minimumStock: 50, warehouseLocation: 'Aisle C-Shelf 4' },
    { productName: 'Multipurpose Lubricant Spray 400ml', sku: 'HARD-LUB-004', category: 'Hardware', unitPrice: 350.00, currentStock: 75, minimumStock: 10, warehouseLocation: 'Aisle D-Shelf 4' },
  ];

  const seededProducts = [];
  for (const p of productsData) {
    const product = await prisma.product.create({
      data: p,
    });
    seededProducts.push(product);
  }

  console.log('Products seeded successfully!');

  // 4. Create Stock Movements
  // We'll create IN movements for all seeded products to represent initial stocks
  for (const product of seededProducts) {
    if (product.currentStock > 0) {
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          quantity: product.currentStock,
          movementType: MovementType.IN,
          reason: 'Initial stock intake on store initialization',
          createdBy: admin.id,
        },
      });
    }
  }

  // Create a couple of additional movements
  const activeProduct = seededProducts.find((p) => p.sku === 'ELEC-WIR-001');
  if (activeProduct) {
    await prisma.stockMovement.create({
      data: {
        productId: activeProduct.id,
        quantity: 20,
        movementType: MovementType.OUT,
        reason: 'Sample checkout for vendor review',
        createdBy: warehouse.id,
      },
    });
  }

  console.log('Stock Movements seeded successfully!');

  // 5. Create Customer Follow-ups
  const leadCustomer = seededCustomers.find((c) => c.status === CustomerStatus.LEAD);
  if (leadCustomer) {
    await prisma.customerFollowUp.create({
      data: {
        customerId: leadCustomer.id,
        note: 'Customer interested in buying copper wires in bulk. Requested discount details.',
        followUpDate: new Date(Date.now() + 86400000 * 2),
        createdBy: sales.id,
      },
    });

    await prisma.customerFollowUp.create({
      data: {
        customerId: leadCustomer.id,
        note: 'Emailed quotation sheet. Customer promised to revert by Tuesday.',
        followUpDate: new Date(Date.now() + 86400000 * 5),
        createdBy: sales.id,
      },
    });
  }

  const activeCustomer = seededCustomers.find((c) => c.status === CustomerStatus.ACTIVE);
  if (activeCustomer) {
    await prisma.customerFollowUp.create({
      data: {
        customerId: activeCustomer.id,
        note: 'Routine check-in call. Customer is satisfied with recent orders.',
        followUpDate: new Date(Date.now() + 86400000 * 30),
        createdBy: sales.id,
      },
    });
  }

  console.log('Follow-ups seeded successfully!');

  // 6. Create Sales Challans (at least 5)
  // Challan 1: DRAFT (ABC Traders)
  const customer1 = seededCustomers.find((c) => c.businessName === 'ABC Traders');
  const prod1 = seededProducts.find((p) => p.sku === 'ELEC-WIR-001');
  const prod2 = seededProducts.find((p) => p.sku === 'ELEC-EXT-002');

  if (customer1 && prod1 && prod2) {
    await prisma.salesChallan.create({
      data: {
        challanNumber: 'CH-20260809-0001',
        customerId: customer1.id,
        totalQuantity: 5,
        status: ChallanStatus.DRAFT,
        createdBy: sales.id,
        items: {
          create: [
            {
              productId: prod1.id,
              productNameSnapshot: prod1.productName,
              skuSnapshot: prod1.sku,
              unitPriceSnapshot: prod1.unitPrice,
              quantity: 3,
              totalPrice: prod1.unitPrice * 3,
            },
            {
              productId: prod2.id,
              productNameSnapshot: prod2.productName,
              skuSnapshot: prod2.sku,
              unitPriceSnapshot: prod2.unitPrice,
              quantity: 2,
              totalPrice: prod2.unitPrice * 2,
            },
          ],
        },
      },
    });
  }

  // Challan 2: CONFIRMED (Sharma Distributors) - should have reduced stock
  const customer2 = seededCustomers.find((c) => c.businessName === 'Sharma Distributors');
  const prod3 = seededProducts.find((p) => p.sku === 'ELEC-LED-003');

  if (customer2 && prod3) {
    // We confirm this seed challan, so we reduce stock of prod3 in DB
    const orderQty = 10;
    await prisma.product.update({
      where: { id: prod3.id },
      data: { currentStock: prod3.currentStock - orderQty },
    });

    await prisma.stockMovement.create({
      data: {
        productId: prod3.id,
        quantity: orderQty,
        movementType: MovementType.OUT,
        reason: 'Sales Challan Confirmation: CH-20260809-0002',
        createdBy: sales.id,
      },
    });

    await prisma.salesChallan.create({
      data: {
        challanNumber: 'CH-20260809-0002',
        customerId: customer2.id,
        totalQuantity: orderQty,
        status: ChallanStatus.CONFIRMED,
        createdBy: sales.id,
        items: {
          create: [
            {
              productId: prod3.id,
              productNameSnapshot: prod3.productName,
              skuSnapshot: prod3.sku,
              unitPriceSnapshot: prod3.unitPrice,
              quantity: orderQty,
              totalPrice: prod3.unitPrice * orderQty,
            },
          ],
        },
      },
    });
  }

  // Challan 3: CANCELLED (Gupta Enterprises)
  const customer3 = seededCustomers.find((c) => c.businessName === 'Gupta Enterprises');
  const prod4 = seededProducts.find((p) => p.sku === 'PLUM-PIP-001');

  if (customer3 && prod4) {
    await prisma.salesChallan.create({
      data: {
        challanNumber: 'CH-20260809-0003',
        customerId: customer3.id,
        totalQuantity: 20,
        status: ChallanStatus.CANCELLED,
        createdBy: sales.id,
        items: {
          create: [
            {
              productId: prod4.id,
              productNameSnapshot: prod4.productName,
              skuSnapshot: prod4.sku,
              unitPriceSnapshot: prod4.unitPrice,
              quantity: 20,
              totalPrice: prod4.unitPrice * 20,
            },
          ],
        },
      },
    });
  }

  // Challan 4: CONFIRMED (Krishna Wholesale)
  const customer4 = seededCustomers.find((c) => c.businessName === 'Krishna Wholesale');
  const prod5 = seededProducts.find((p) => p.sku === 'PLUM-VAL-002');

  if (customer4 && prod5) {
    const orderQty = 5;
    await prisma.product.update({
      where: { id: prod5.id },
      data: { currentStock: prod5.currentStock - orderQty },
    });

    await prisma.stockMovement.create({
      data: {
        productId: prod5.id,
        quantity: orderQty,
        movementType: MovementType.OUT,
        reason: 'Sales Challan Confirmation: CH-20260809-0004',
        createdBy: sales.id,
      },
    });

    await prisma.salesChallan.create({
      data: {
        challanNumber: 'CH-20260809-0004',
        customerId: customer4.id,
        totalQuantity: orderQty,
        status: ChallanStatus.CONFIRMED,
        createdBy: sales.id,
        items: {
          create: [
            {
              productId: prod5.id,
              productNameSnapshot: prod5.productName,
              skuSnapshot: prod5.sku,
              unitPriceSnapshot: prod5.unitPrice,
              quantity: orderQty,
              totalPrice: prod5.unitPrice * orderQty,
            },
          ],
        },
      },
    });
  }

  // Challan 5: DRAFT (Khalsa Logistics)
  const customer5 = seededCustomers.find((c) => c.businessName === 'Khalsa Logistics');
  const prod6 = seededProducts.find((p) => p.sku === 'PAIN-WHT-001');

  if (customer5 && prod6) {
    await prisma.salesChallan.create({
      data: {
        challanNumber: 'CH-20260809-0005',
        customerId: customer5.id,
        totalQuantity: 2,
        status: ChallanStatus.DRAFT,
        createdBy: sales.id,
        items: {
          create: [
            {
              productId: prod6.id,
              productNameSnapshot: prod6.productName,
              skuSnapshot: prod6.sku,
              unitPriceSnapshot: prod6.unitPrice,
              quantity: 2,
              totalPrice: prod6.unitPrice * 2,
            },
          ],
        },
      },
    });
  }

  console.log('Sales Challans seeded successfully!');
  console.log('Database seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
