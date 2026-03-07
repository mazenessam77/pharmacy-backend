// Create the application database and user
db = db.getSiblingDB('pharma_db');

// Create application-level user (not root)
db.createUser({
  user: 'pharma_app',
  pwd: 'pharma_app_password',
  roles: [
    { role: 'readWrite', db: 'pharma_db' }
  ]
});

// Create collections with schema validation hints
db.createCollection('users');
db.createCollection('pharmacies');
db.createCollection('orders');
db.createCollection('orderresponses');
db.createCollection('prescriptions');
db.createCollection('messages');
db.createCollection('medicines');
db.createCollection('inventories');
db.createCollection('reviews');
db.createCollection('notifications');

// Create critical indexes

// Users - geospatial index
db.users.createIndex({ "location": "2dsphere" });
db.users.createIndex({ "email": 1 }, { unique: true });

// Pharmacies - geospatial + compound
db.pharmacies.createIndex({ "location": "2dsphere" });
db.pharmacies.createIndex({ "isVerified": 1, "isOpen": 1 });

// Orders
db.orders.createIndex({ "patientId": 1, "createdAt": -1 });
db.orders.createIndex({ "status": 1 });
db.orders.createIndex({ "patientLocation": "2dsphere" });

// Order Responses - unique constraint
db.orderresponses.createIndex({ "orderId": 1, "pharmacyId": 1 }, { unique: true });

// Messages
db.messages.createIndex({ "orderId": 1, "createdAt": 1 });
db.messages.createIndex({ "receiverId": 1, "isRead": 1 });

// Medicines - text search
db.medicines.createIndex({ "name": "text", "genericName": "text" });

// Inventory
db.inventories.createIndex({ "pharmacyId": 1, "medicineName": 1 }, { unique: true });

// Notifications
db.notifications.createIndex({ "userId": 1, "createdAt": -1 });

// Prescriptions
db.prescriptions.createIndex({ "patientId": 1, "createdAt": -1 });

// Reviews
db.reviews.createIndex({ "pharmacyId": 1, "createdAt": -1 });

print('Database initialized with collections and indexes');
