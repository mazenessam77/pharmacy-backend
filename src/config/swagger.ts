import { env } from './env';

export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'PharmaLink API',
    version: '1.0.0',
    description: 'Pharmacy Medicine Request Platform — Backend API for medicine ordering, pharmacy management, prescription OCR, real-time chat, and more.',
  },
  servers: [
    { url: `http://localhost:5001`, description: 'Development (Docker)' },
    { url: `http://localhost:${env.PORT}`, description: 'Local' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http' as const, scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              code: { type: 'string' },
            },
          },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          limit: { type: 'integer' },
          total: { type: 'integer' },
          pages: { type: 'integer' },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  tags: [
    { name: 'Auth', description: 'Authentication & registration' },
    { name: 'Users', description: 'User profile management' },
    { name: 'Orders', description: 'Medicine order management' },
    { name: 'Order Responses', description: 'Pharmacy offers for orders' },
    { name: 'Prescriptions', description: 'Prescription upload & OCR' },
    { name: 'Medicines', description: 'Medicine catalog' },
    { name: 'Pharmacies', description: 'Pharmacy lookup & status' },
    { name: 'Inventory', description: 'Pharmacy inventory management' },
    { name: 'Messages', description: 'In-order chat' },
    { name: 'Reviews', description: 'Pharmacy reviews & ratings' },
    { name: 'Notifications', description: 'User notifications' },
    { name: 'Admin', description: 'Admin operations' },
  ],
  paths: {
    // ───── Auth ─────
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password', 'role'],
                properties: {
                  name: { type: 'string', example: 'John Doe' },
                  email: { type: 'string', format: 'email', example: 'john@example.com' },
                  password: { type: 'string', minLength: 6, example: 'password123' },
                  phone: { type: 'string', example: '+201234567890' },
                  role: { type: 'string', enum: ['patient', 'pharmacy'] },
                  pharmacyName: { type: 'string', description: 'Required if role=pharmacy' },
                  license: { type: 'string', description: 'Required if role=pharmacy' },
                  location: {
                    type: 'object',
                    properties: {
                      lat: { type: 'number', example: 30.0444 },
                      lng: { type: 'number', example: 31.2357 },
                    },
                    description: 'Required if role=pharmacy',
                  },
                  address: { type: 'string' },
                  workingHours: {
                    type: 'object',
                    properties: { open: { type: 'string', example: '09:00' }, close: { type: 'string', example: '23:00' } },
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'User registered successfully. Returns accessToken, refreshToken, user.' },
          '409': { description: 'Email already registered' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Returns accessToken, refreshToken, user' },
          '401': { description: 'Invalid credentials' },
        },
      },
    },
    '/api/auth/logout': {
      post: { tags: ['Auth'], summary: 'Logout (invalidate refresh token)', responses: { '200': { description: 'Logged out' } } },
    },
    '/api/auth/refresh-token': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh access token',
        security: [],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { refreshToken: { type: 'string' } }, required: ['refreshToken'] } } },
        },
        responses: { '200': { description: 'New accessToken and refreshToken' } },
      },
    },
    '/api/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Send password reset email',
        security: [],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { email: { type: 'string', format: 'email' } }, required: ['email'] } } },
        },
        responses: { '200': { description: 'Reset link sent if email exists' } },
      },
    },
    '/api/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Reset password with token',
        security: [],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { token: { type: 'string' }, password: { type: 'string', minLength: 6 } }, required: ['token', 'password'] } } },
        },
        responses: { '200': { description: 'Password reset successful' } },
      },
    },
    '/api/auth/me': {
      get: { tags: ['Auth'], summary: 'Get current user profile', responses: { '200': { description: 'User profile with pharmacy info if applicable' } } },
    },
    '/api/auth/google': {
      post: {
        tags: ['Auth'],
        summary: 'Google OAuth login/register',
        security: [],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { idToken: { type: 'string' } }, required: ['idToken'] } } },
        },
        responses: { '200': { description: 'Returns accessToken, refreshToken, user' } },
      },
    },

    // ───── Users ─────
    '/api/users/profile': {
      get: { tags: ['Users'], summary: 'Get my full profile', responses: { '200': { description: 'User profile' } } },
      put: {
        tags: ['Users'],
        summary: 'Update profile (name, phone, avatar, address)',
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: { name: { type: 'string' }, phone: { type: 'string' }, address: { type: 'string' }, avatar: { type: 'string', format: 'binary' } },
              },
            },
          },
        },
        responses: { '200': { description: 'Updated user' } },
      },
    },
    '/api/users/location': {
      put: {
        tags: ['Users'],
        summary: 'Update my location',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { lat: { type: 'number' }, lng: { type: 'number' } }, required: ['lat', 'lng'] } } } },
        responses: { '200': { description: 'Updated user' } },
      },
    },
    '/api/users/search-radius': {
      put: {
        tags: ['Users'],
        summary: 'Update search radius (1-10 km)',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { radius: { type: 'number', minimum: 1, maximum: 10 } }, required: ['radius'] } } } },
        responses: { '200': { description: 'Updated' } },
      },
    },
    '/api/users/fcm-token': {
      put: {
        tags: ['Users'],
        summary: 'Update FCM push notification token',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { fcmToken: { type: 'string' } }, required: ['fcmToken'] } } } },
        responses: { '200': { description: 'Token updated' } },
      },
    },

    // ───── Orders ─────
    '/api/orders': {
      post: {
        tags: ['Orders'],
        summary: 'Create new order (patient only)',
        description: 'Creates order, finds nearby pharmacies, and notifies them via Socket.io + push.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['medicines', 'location'],
                properties: {
                  medicines: {
                    type: 'array',
                    items: { type: 'object', properties: { name: { type: 'string' }, quantity: { type: 'integer', default: 1 }, medicineId: { type: 'string' } }, required: ['name'] },
                  },
                  prescriptionId: { type: 'string' },
                  location: { type: 'object', properties: { lat: { type: 'number' }, lng: { type: 'number' } }, required: ['lat', 'lng'] },
                  deliveryType: { type: 'string', enum: ['delivery', 'pickup'], default: 'delivery' },
                  notes: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Order created, returns order + nearbyPharmaciesCount' } },
      },
      get: {
        tags: ['Orders'],
        summary: 'List orders (patient: my orders; pharmacy: nearby pending/offered)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'offered', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'] } },
        ],
        responses: { '200': { description: 'Paginated order list' } },
      },
    },
    '/api/orders/{id}': {
      get: {
        tags: ['Orders'],
        summary: 'Order details',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Order with populated pharmacy, responses, prescription' } },
      },
    },
    '/api/orders/{id}/cancel': {
      put: {
        tags: ['Orders'],
        summary: 'Cancel order (patient only)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { cancelReason: { type: 'string' } } } } } },
        responses: { '200': { description: 'Cancelled order' } },
      },
    },
    '/api/orders/{id}/status': {
      put: {
        tags: ['Orders'],
        summary: 'Update order status (pharmacy only)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', enum: ['preparing', 'out_for_delivery', 'delivered'] } }, required: ['status'] } } } },
        responses: { '200': { description: 'Updated order' } },
      },
    },
    '/api/orders/{id}/reorder': {
      post: {
        tags: ['Orders'],
        summary: 'Reorder with same medicines (patient only)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '201': { description: 'New order created' } },
      },
    },

    // ───── Order Responses ─────
    '/api/orders/{orderId}/responses': {
      post: {
        tags: ['Order Responses'],
        summary: 'Submit offer (pharmacy only)',
        parameters: [{ name: 'orderId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['availableMeds', 'totalPrice'],
                properties: {
                  availableMeds: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, price: { type: 'number' }, inStock: { type: 'boolean' } } } },
                  alternatives: { type: 'array', items: { type: 'object', properties: { originalName: { type: 'string' }, alternativeName: { type: 'string' }, alternativePrice: { type: 'number' } } } },
                  totalPrice: { type: 'number' },
                  deliveryFee: { type: 'number', default: 0 },
                  estimatedTime: { type: 'string', example: '30 min' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Offer submitted' } },
      },
      get: {
        tags: ['Order Responses'],
        summary: 'List offers for order (patient only)',
        parameters: [
          { name: 'orderId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { '200': { description: 'Paginated offers' } },
      },
    },
    '/api/orders/{orderId}/responses/{responseId}/accept': {
      put: {
        tags: ['Order Responses'],
        summary: 'Accept offer (patient only)',
        parameters: [
          { name: 'orderId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'responseId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Order confirmed, other offers rejected, pharmacy notified' } },
      },
    },

    // ───── Prescriptions ─────
    '/api/prescriptions/upload': {
      post: {
        tags: ['Prescriptions'],
        summary: 'Upload prescription image',
        requestBody: { required: true, content: { 'multipart/form-data': { schema: { type: 'object', properties: { image: { type: 'string', format: 'binary' } } } } } },
        responses: { '201': { description: 'Returns imageUrl' } },
      },
    },
    '/api/prescriptions/scan': {
      post: {
        tags: ['Prescriptions'],
        summary: 'OCR scan prescription (upload or URL)',
        description: 'Preprocesses image with Sharp.js, runs Tesseract OCR, matches medicines against catalog with confidence scores.',
        requestBody: {
          content: {
            'multipart/form-data': { schema: { type: 'object', properties: { image: { type: 'string', format: 'binary' } } } },
            'application/json': { schema: { type: 'object', properties: { imageUrl: { type: 'string', format: 'uri' } } } },
          },
        },
        responses: { '201': { description: 'Prescription with extractedText and extractedMeds[{name, confidence}]' } },
      },
    },
    '/api/prescriptions': {
      get: { tags: ['Prescriptions'], summary: 'List my prescriptions (patient only)', responses: { '200': { description: 'Paginated prescriptions' } } },
    },
    '/api/prescriptions/{id}': {
      get: {
        tags: ['Prescriptions'],
        summary: 'Prescription details',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Prescription' } },
      },
    },
    '/api/prescriptions/{id}/verify': {
      put: {
        tags: ['Prescriptions'],
        summary: 'Mark prescription as verified (patient confirms meds)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Verified prescription' } },
      },
    },

    // ───── Medicines ─────
    '/api/medicines': {
      get: {
        tags: ['Medicines'],
        summary: 'List/search medicines',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Text search' },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { '200': { description: 'Paginated medicines' } },
      },
    },
    '/api/medicines/autocomplete': {
      get: {
        tags: ['Medicines'],
        summary: 'Autocomplete search (top 10 matches)',
        parameters: [{ name: 'q', in: 'query', required: true, schema: { type: 'string', minLength: 2 }, description: 'Search query (min 2 chars)' }],
        responses: { '200': { description: 'Array of matching medicines' } },
      },
    },
    '/api/medicines/{id}': {
      get: {
        tags: ['Medicines'],
        summary: 'Medicine details with alternatives',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Medicine' } },
      },
    },

    // ───── Pharmacies ─────
    '/api/pharmacies/nearby': {
      get: {
        tags: ['Pharmacies'],
        summary: 'Find nearby pharmacies',
        parameters: [
          { name: 'lat', in: 'query', required: true, schema: { type: 'number' } },
          { name: 'lng', in: 'query', required: true, schema: { type: 'number' } },
          { name: 'radius', in: 'query', schema: { type: 'number', default: 5 }, description: 'Radius in km' },
        ],
        responses: { '200': { description: 'Array of nearby pharmacies with distance' } },
      },
    },
    '/api/pharmacies/status': {
      put: { tags: ['Pharmacies'], summary: 'Toggle online/offline (pharmacy only)', responses: { '200': { description: 'New isOpen status' } } },
    },
    '/api/pharmacies/{id}': {
      get: {
        tags: ['Pharmacies'],
        summary: 'Pharmacy public profile',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Pharmacy profile' } },
      },
    },

    // ───── Inventory ─────
    '/api/inventory': {
      get: {
        tags: ['Inventory'],
        summary: 'My inventory (pharmacy only, paginated + search)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Paginated inventory' } },
      },
      post: {
        tags: ['Inventory'],
        summary: 'Add medicine to inventory',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['medicineName', 'price'], properties: { medicineName: { type: 'string' }, genericName: { type: 'string' }, price: { type: 'number' }, quantity: { type: 'integer' }, medicineId: { type: 'string' } } } } },
        },
        responses: { '201': { description: 'Inventory item created' } },
      },
    },
    '/api/inventory/{id}': {
      put: {
        tags: ['Inventory'],
        summary: 'Update inventory item',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { price: { type: 'number' }, quantity: { type: 'integer' }, isAvailable: { type: 'boolean' } } } } } },
        responses: { '200': { description: 'Updated item' } },
      },
      delete: {
        tags: ['Inventory'],
        summary: 'Remove from inventory',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Removed' } },
      },
    },
    '/api/inventory/bulk-import': {
      post: {
        tags: ['Inventory'],
        summary: 'Import inventory from CSV',
        description: 'CSV must have "name" and "price" columns. Optional: "quantity", "genericname".',
        requestBody: { required: true, content: { 'multipart/form-data': { schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } } } },
        responses: { '200': { description: '{ imported, errors }' } },
      },
    },

    // ───── Messages ─────
    '/api/messages/{orderId}/{recipientId}': {
      get: {
        tags: ['Messages'],
        summary: 'Chat history (paginated, newest first)',
        parameters: [
          { name: 'orderId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'recipientId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { '200': { description: 'Messages array' } },
      },
    },
    '/api/messages': {
      post: {
        tags: ['Messages'],
        summary: 'Send message (REST fallback)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['orderId', 'receiverId'],
                properties: {
                  orderId: { type: 'string' },
                  receiverId: { type: 'string' },
                  content: { type: 'string' },
                  messageType: { type: 'string', enum: ['text', 'image', 'alternative'], default: 'text' },
                  imageUrl: { type: 'string' },
                  alternativeData: { type: 'object', properties: { originalMedicine: { type: 'string' }, suggestedMedicine: { type: 'string' }, suggestedPrice: { type: 'number' } } },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Message sent' } },
      },
    },
    '/api/messages/{id}/read': {
      put: {
        tags: ['Messages'],
        summary: 'Mark message as read',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Updated message' } },
      },
    },
    '/api/messages/read-all/{orderId}': {
      put: {
        tags: ['Messages'],
        summary: 'Mark all messages in order as read',
        parameters: [{ name: 'orderId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'All marked as read' } },
      },
    },

    // ───── Reviews ─────
    '/api/reviews': {
      post: {
        tags: ['Reviews'],
        summary: 'Submit review (patient only, order must be delivered)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['pharmacyId', 'orderId', 'rating'],
                properties: { pharmacyId: { type: 'string' }, orderId: { type: 'string' }, rating: { type: 'integer', minimum: 1, maximum: 5 }, comment: { type: 'string' } },
              },
            },
          },
        },
        responses: { '201': { description: 'Review created, pharmacy rating recalculated' } },
      },
    },
    '/api/reviews/pharmacy/{id}': {
      get: {
        tags: ['Reviews'],
        summary: 'Reviews for a pharmacy (paginated)',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { '200': { description: 'Paginated reviews' } },
      },
    },

    // ───── Notifications ─────
    '/api/notifications': {
      get: {
        tags: ['Notifications'],
        summary: 'My notifications (paginated)',
        parameters: [{ name: 'page', in: 'query', schema: { type: 'integer' } }, { name: 'limit', in: 'query', schema: { type: 'integer' } }],
        responses: { '200': { description: 'Notifications + unreadCount' } },
      },
    },
    '/api/notifications/{id}/read': {
      put: {
        tags: ['Notifications'],
        summary: 'Mark notification as read',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Updated notification' } },
      },
    },
    '/api/notifications/read-all': {
      put: { tags: ['Notifications'], summary: 'Mark all as read', responses: { '200': { description: 'All marked as read' } } },
    },
    '/api/notifications/{id}': {
      delete: {
        tags: ['Notifications'],
        summary: 'Delete notification',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Deleted' } },
      },
    },

    // ───── Admin ─────
    '/api/admin/stats': {
      get: { tags: ['Admin'], summary: 'System-wide statistics', responses: { '200': { description: 'Stats object' } } },
    },
    '/api/admin/pharmacies/pending': {
      get: { tags: ['Admin'], summary: 'Pending pharmacy verifications', responses: { '200': { description: 'Paginated pending pharmacies' } } },
    },
    '/api/admin/pharmacies/{id}/verify': {
      put: {
        tags: ['Admin'],
        summary: 'Approve or reject pharmacy',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['action'], properties: { action: { type: 'string', enum: ['approve', 'reject'] }, reason: { type: 'string' } } } } },
        },
        responses: { '200': { description: 'Updated pharmacy' } },
      },
    },
    '/api/admin/users': {
      get: {
        tags: ['Admin'],
        summary: 'All users (paginated, search, filter)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'role', in: 'query', schema: { type: 'string', enum: ['patient', 'pharmacy', 'admin'] } },
        ],
        responses: { '200': { description: 'Paginated users' } },
      },
    },
    '/api/admin/users/{id}/ban': {
      put: {
        tags: ['Admin'],
        summary: 'Ban/unban user (toggles)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: '{ userId, isBanned }' } },
      },
    },
    '/api/admin/orders': {
      get: {
        tags: ['Admin'],
        summary: 'All orders (paginated, filters)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Paginated orders' } },
      },
    },
    '/api/admin/orders/{id}': {
      get: {
        tags: ['Admin'],
        summary: 'Order details with chat history',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Order + messages' } },
      },
    },
    '/api/admin/medicines': {
      post: {
        tags: ['Admin'],
        summary: 'Create medicine',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['name'], properties: { name: { type: 'string' }, genericName: { type: 'string' }, category: { type: 'string' }, requiresPrescription: { type: 'boolean' }, description: { type: 'string' } } } } },
        },
        responses: { '201': { description: 'Medicine created' } },
      },
    },
    '/api/admin/medicines/{id}': {
      put: {
        tags: ['Admin'],
        summary: 'Update medicine',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Updated medicine' } },
      },
      delete: {
        tags: ['Admin'],
        summary: 'Deactivate medicine',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Medicine deactivated' } },
      },
    },
  },
};
