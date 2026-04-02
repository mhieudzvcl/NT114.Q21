const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const dbName = 'project_db';

const products = [
  { sku: 'LSTYLE-001', name: 'Giày Thể Thao HyperX', description: 'Đệm khí phản hồi thế hệ mới.', price: 120, stock: 50, status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date() },
  { sku: 'LSTYLE-002', name: 'Túi Đeo Chéo Urban', description: 'Chống nước 100%, phong cách tối giản.', price: 45, stock: 120, status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date() },
  { sku: 'LSTYLE-003', name: 'Áo Khoác Gió Nano', description: 'Siêu nhẹ, cản gió cực tốt.', price: 85, stock: 80, status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date() },
  { sku: 'LSTYLE-004', name: 'Kính Râm phân cực', description: 'Chống tia UV400, gọng titanium.', price: 60, stock: 200, status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date() },
  { sku: 'LSTYLE-005', name: 'Balo Công Sở Pro', description: 'Vừa vặn mọi Laptop 15.6 inch.', price: 95, stock: 40, status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date() },
  { sku: 'LSTYLE-006', name: 'Đồng Hồ Minimalist', description: 'Mặt tinh thể sapphire chống trầy.', price: 210, stock: 25, status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date() },
  { sku: 'LSTYLE-007', name: 'Tai Nghe TrueWireless', description: 'Chống ồn chủ động ANC tiên tiến.', price: 150, stock: 150, status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date() },
  { sku: 'LSTYLE-008', name: 'Bình Giữ Nhiệt Lõi Đồng', description: 'Giữ nhiệt 24h không toát mồ hôi.', price: 35, stock: 300, status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date() }
];

async function seed() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('✅ Đã kết nối tới MongoDB của Microservices');

    const db = client.db(dbName);
    const collection = db.collection('products');

    // Xoá dữ liệu cũ
    await collection.deleteMany({});
    
    // Thêm 8 sản phẩm
    const result = await collection.insertMany(products);
    console.log(`🎉 Thành công! Đã thêm ${result.insertedCount} siêu phẩm vào CSDL.`);
    console.log('🔄 Rảo bước sang localhost:3000 để chiêm ngưỡng giao diện đi nào!');
  } catch (error) {
    if (error.name === 'MongoServerSelectionError') {
      console.log('⚠️ Lỗi: Không tìm thấy MongoDB. Hãy chắc chắn Docker đang mở và Container mongo đang chạy!');
    } else {
      console.error(error);
    }
  } finally {
    await client.close();
  }
}

seed();
