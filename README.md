- **User Authentication & Authorization** - JWT-based authentication with role-based access control
- **Leave Request Management** - Create, read, update, and delete leave requests
- **Role-Based Access Control** - Admin and User roles with different permissions
- **Database Persistence** - MongoDB integration with Mongoose ODM
- **Data Validation** - Zod schema validation for robust data integrity

### Advanced Features

- **Leave Overlap Detection** - Prevents overlapping leave requests for the same employee
- **Employee Search** - Search leaves by employee name with case-insensitive partial matching
- **Date Validation** - Ensures leave dates are logical (fromDate ≤ toDate, future dates only)
- **Comprehensive Error Handling** - Detailed error messages and proper HTTP status codes
- **API Testing** - Jest test suite with coverage reporting

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Leave_management_system_Backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# Database Configuration
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/leave_management_clean

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here

# Server Configuration
PORT=5001
```

### 4. Start the Application

#### Development Mode (with auto-reload)

```bash
npm run dev
```

#### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

The server will start on `http://localhost:5001` (or the PORT specified in your .env file).

## Sample Credentials

### Admin User

- **Username:** `admin`
- **Password:** `admin123`
- **Role:** `admin`

### Regular User

- **Username:** `testuser`
- **Password:** `password123`
- **Role:** `user`

## API Documentation

### Base URL

```
http://localhost:5001/api
```

### Authentication

All leave-related endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

---

## Authentication Endpoints

### 1. User Registration

**POST** `/api/auth/register`

Register a new user account.

**Request Body:**

```json
{
  "name": "john_doe",
  "password": "securepassword123",
  "role": "user"
}
```

**Sample curl:**

```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "john_doe",
    "password": "securepassword123",
    "role": "user"
  }'
```

**Response:**

```json
{
  "message": "User john_doe registered successfully"
}
```

### 2. User Login

**POST** `/api/auth/login`

Authenticate user and receive JWT token.

**Request Body:**

```json
{
  "name": "admin",
  "password": "admin123"
}
```

**Sample cURL:**

```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "name": "admin",
    "password": "admin123"
  }'
```

**Response:**

```json
{
  "message": "Login successful",
  "name": "admin",
  "role": "admin",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## Leave Management Endpoints

### 1. Create Leave Request

**POST** `/api/leaves`

Create a new leave request (User role required).

**Headers:**

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "fromDate": "2025-12-01",
  "toDate": "2025-12-05",
  "reason": "Family vacation"
}
```

**Sample cURL:**

```bash
curl -X POST http://localhost:5001/api/leaves \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "fromDate": "2025-12-01",
    "toDate": "2025-12-05",
    "reason": "Family vacation"
  }'
```

**Response:**

```json
{
  "message": "Leave request submitted successfully",
  "leave": {
    "_id": "507f1f77bcf86cd799439011",
    "employee": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "john_doe",
      "role": "user"
    },
    "fromDate": "2025-12-01T00:00:00.000Z",
    "toDate": "2025-12-05T00:00:00.000Z",
    "reason": "Family vacation",
    "status": "Pending",
    "appliedAt": "2025-10-17T10:30:00.000Z",
    "createdAt": "2025-10-17T10:30:00.000Z",
    "updatedAt": "2025-10-17T10:30:00.000Z"
  }
}
```

### 2. Get All Leaves

**GET** `/api/leaves`

Retrieve all leave requests (Admin and User roles).

**Query Parameters:**

- `employee` (optional): Filter by employee name (case-insensitive partial match)

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Sample cURL:**

```bash
# Get all leaves
curl -X GET http://localhost:5001/api/leaves \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Filter by employee name
curl -X GET "http://localhost:5001/api/leaves?employee=john" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**

```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "employee": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "john_doe",
      "role": "user"
    },
    "fromDate": "2025-12-01T00:00:00.000Z",
    "toDate": "2025-12-05T00:00:00.000Z",
    "reason": "Family vacation",
    "status": "Pending",
    "appliedAt": "2025-10-17T10:30:00.000Z",
    "createdAt": "2025-10-17T10:30:00.000Z",
    "updatedAt": "2025-10-17T10:30:00.000Z"
  }
]
```

### 3. Get Leave by ID

**GET** `/api/leaves/:id`

Retrieve a specific leave request by ID.

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Sample cURL:**

```bash
curl -X GET http://localhost:5001/api/leaves/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**

```json
{
  "message": "Leave retrieved successfully",
  "leave": {
    "_id": "507f1f77bcf86cd799439011",
    "employee": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "john_doe",
      "role": "user"
    },
    "fromDate": "2025-12-01T00:00:00.000Z",
    "toDate": "2025-12-05T00:00:00.000Z",
    "reason": "Family vacation",
    "status": "Pending",
    "appliedAt": "2025-10-17T10:30:00.000Z",
    "createdAt": "2025-10-17T10:30:00.000Z",
    "updatedAt": "2025-10-17T10:30:00.000Z"
  }
}
```

### 4. Update Leave Request

**PUT** `/api/leaves/:id`

Update a leave request. Users can only edit their own pending leaves. Admins can approve/reject any leave.

**Headers:**

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**For Users (edit pending leave):**

```json
{
  "fromDate": "2025-12-02",
  "toDate": "2025-12-06",
  "reason": "Updated reason"
}
```

**For Admins (approve/reject):**

```json
{
  "status": "Approved",
  "reviewComments": "Leave approved for family vacation"
}
```

**Sample cURL:**

```bash
# User updating their leave
curl -X PUT http://localhost:5001/api/leaves/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "fromDate": "2025-12-02",
    "toDate": "2025-12-06",
    "reason": "Updated vacation dates"
  }'

# Admin approving leave
curl -X PUT http://localhost:5001/api/leaves/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "status": "Approved",
    "reviewComments": "Leave approved"
  }'
```

### 5. Delete Leave Request

**DELETE** `/api/leaves/:id`

Delete/cancel a leave request. Users can only delete their own pending leaves. Admins can delete any leave.

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Sample cURL:**

```bash
curl -X DELETE http://localhost:5001/api/leaves/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**

```json
{
  "message": "Leave request deleted successfully"
}
```

## Role-Based Access Control

### Admin Role

- Can view all leave requests
- Can approve/reject any leave request
- Can delete any leave request

### User Role

- Can view all leave requests (for transparency)
- Can create their own leave requests
- Can edit only their own pending leave requests
- Can delete only their own pending leave requests

---

## Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcryptjs for secure password storage
- **Role-Based Authorization** - Middleware-based access control
- **Input Validation** - Zod schema validation for all inputs
- **CORS Protection** - Configurable cross-origin resource sharing

---

## Database Schema

### User Model

```javascript
{
  name: String (required, unique, 2-50 chars),
  password: String (required, min 6 chars),
  role: String (required, enum: ['admin', 'user']),
  createdAt: Date,
  updatedAt: Date
}
```

### Leave Model

```javascript
{
  employee: String (required, user ID),
  fromDate: Date (required),
  toDate: Date (required),
  reason: String (required, max 500 chars),
  status: String (enum: ['Pending', 'Approved', 'Rejected']),
  reviewComments: String (optional),
  appliedAt: Date (default: now),
  createdAt: Date,
  updatedAt: Date
}
```

---

## Testing

The project includes comprehensive testing with Jest:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

Test coverage includes:

- Authentication controller tests
- Leave controller tests
- Authentication middleware tests
- Leave model tests

---
