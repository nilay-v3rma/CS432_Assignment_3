# GateGuard API - Complete CRUD Endpoints Documentation

## Overview

This document provides comprehensive documentation for all CRUD API endpoints implemented in the GateGuard system.

**Base URL:** `http://localhost:3000/api`

**Authentication:** All endpoints (except `/login`) require a JWT token in the `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

---

## Table of Contents

1. [Authentication](#authentication)
2. [Users Management](#users-management)
3. [Members Management](#members-management)
4. [Guards Management](#guards-management)
5. [Guest Requests](#guest-requests)
6. [Guests Management](#guests-management)
7. [Blacklist Management](#blacklist-management)
8. [Gates Management](#gates-management)
9. [Access Logs](#access-logs)
10. [Response Format](#response-format)
11. [QR Code Management](#-qr-code-management)

---

## Authentication

### Login

**Endpoint:** `POST /login`

**Access:** Public (No authentication required)

**Description:** Authenticate user and receive JWT token

**Request Body:**
```json
{
  "username": "string (required)",
  "password": "string (required)"
}
```

**Response (200 - Success):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin",
    "email": "admin@gateguard.local"
  }
}
```

**Response (401 - Authentication Failed):**
```json
{
  "success": false,
  "message": "Invalid username or password"
}
```

---

### Validate Token

**Endpoint:** `GET /isAuth`

**Access:** Public (Token validation)

**Description:** Validate JWT token and retrieve user information

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200 - Valid Token):**
```json
{
  "authenticated": true,
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin"
  }
}
```

**Response (403 - Invalid Token):**
```json
{
  "authenticated": false,
  "message": "Invalid token"
}
```

---

## Users Management

**Access Control:** Admin only

### List All Users

**Endpoint:** `GET /api/users`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response (200):**
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": [
    {
      "id": 1,
      "username": "admin",
      "role": "admin",
      "email": "admin@gateguard.local",
      "created_at": "2026-03-19T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 2,
    "totalPages": 1
  }
}
```

### Get User by ID

**Endpoint:** `GET /api/users/:id`

**Response (200):**
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "id": 1,
    "username": "admin",
    "role": "admin",
    "email": "admin@gateguard.local",
    "created_at": "2026-03-19T00:00:00.000Z"
  }
}
```

### Create New User

**Endpoint:** `POST /api/users`

**Request Body:**
```json
{
  "username": "string (required, unique)",
  "password": "string (required, min 6 chars)",
  "email": "string (optional)",
  "role": "admin|user (default: user)"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": 3,
    "username": "newuser",
    "email": "newuser@example.com",
    "role": "user"
  }
}
```

### Update User

**Endpoint:** `PUT /api/users/:id`

**Request Body (all optional):**
```json
{
  "email": "string",
  "role": "admin|user",
  "password": "string (new password)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": 1,
    "email": "newemail@example.com",
    "role": "admin"
  }
}
```

### Delete User

**Endpoint:** `DELETE /api/users/:id`

**Response (200):**
```json
{
  "success": true,
  "message": "User deleted successfully",
  "data": {
    "id": 3
  }
}
```

---

## Members Management

**Access Control:** READ - Authenticated users | CREATE/UPDATE/DELETE - Admin only

### List All Members

**Endpoint:** `GET /api/members`

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response (200):**
```json
{
  "success": true,
  "message": "Members retrieved successfully",
  "data": [
    {
      "member_id": "IITGN_01",
      "person_id": 1,
      "name": "Rahul Sharma",
      "image": "img_rahul.jpg",
      "age": 20,
      "email": "rahul.s@iitgn.ac.in",
      "contact": "9876543210"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 10,
    "totalPages": 1
  }
}
```

### Get Member by ID

**Endpoint:** `GET /api/members/:id`

**URL Parameter:** `id` - member_id (e.g., IITGN_01)

**Response (200):**
```json
{
  "success": true,
  "message": "Member retrieved successfully",
  "data": {
    "member_id": "IITGN_01",
    "person_id": 1,
    "name": "Rahul Sharma",
    "image": "img_rahul.jpg",
    "age": 20,
    "email": "rahul.s@iitgn.ac.in",
    "contact": "9876543210"
  }
}
```

### Create New Member

**Endpoint:** `POST /api/members`

**Request Body:**
```json
{
  "member_id": "string (required, unique, e.g., IITGN_01)",
  "name": "string (required)",
  "email": "string (required, unique)",
  "contact": "string (required, unique)",
  "image": "string (optional)",
  "age": "number (optional, 16-100)"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Member created successfully",
  "data": {
    "member_id": "IITGN_11",
    "person_id": 11,
    "name": "New Member",
    "email": "newmember@iitgn.ac.in",
    "contact": "9999999999",
    "age": 21,
    "image": null
  }
}
```

### Update Member

**Endpoint:** `PUT /api/members/:id`

**Request Body (all optional):**
```json
{
  "name": "string",
  "email": "string",
  "contact": "string",
  "image": "string",
  "age": "number"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Member updated successfully",
  "data": {
    "member_id": "IITGN_01",
    "name": "Updated Name",
    "email": "updated@iitgn.ac.in",
    "age": 21
  }
}
```

### Delete Member

**Endpoint:** `DELETE /api/members/:id`

**Response (200):**
```json
{
  "success": true,
  "message": "Member deleted successfully",
  "data": {
    "member_id": "IITGN_01"
  }
}
```

---

## Guards Management

**Access Control:** Admin only

### List All Guards

**Endpoint:** `GET /api/guards`

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response (200):**
```json
{
  "success": true,
  "message": "Guards retrieved successfully",
  "data": [
    {
      "guard_id": 1,
      "name": "Rajesh Singh",
      "image": "guard1.jpg",
      "age": 45,
      "email": "rajesh@security.com",
      "contact": "9000000001",
      "shift": "morning",
      "status": "active",
      "gate_id": 1
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 3,
    "totalPages": 1
  }
}
```

### Get Guard by ID

**Endpoint:** `GET /api/guards/:id`

**Response (200):**
```json
{
  "success": true,
  "message": "Guard retrieved successfully",
  "data": {
    "guard_id": 1,
    "name": "Rajesh Singh",
    "image": "guard1.jpg",
    "age": 45,
    "email": "rajesh@security.com",
    "contact": "9000000001",
    "shift": "morning",
    "status": "active",
    "gate_id": 1
  }
}
```

### Create New Guard

**Endpoint:** `POST /api/guards`

**Request Body:**
```json
{
  "name": "string (required)",
  "email": "string (optional)",
  "contact": "string (optional)",
  "age": "number (optional)",
  "image": "string (optional)",
  "shift": "morning|night (required)",
  "gate_id": "number (required)",
  "status": "active|inactive (default: active)"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Guard created successfully",
  "data": {
    "guard_id": 4,
    "name": "New Guard",
    "email": "newguard@security.com",
    "contact": "9000000004",
    "age": 40,
    "image": null,
    "shift": "night",
    "status": "active",
    "gate_id": 2
  }
}
```

### Update Guard

**Endpoint:** `PUT /api/guards/:id`

**Request Body (all optional):**
```json
{
  "name": "string",
  "email": "string",
  "contact": "string",
  "age": "number",
  "image": "string",
  "shift": "morning|night",
  "status": "active|inactive",
  "gate_id": "number"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Guard updated successfully",
  "data": {
    "guard_id": 1,
    "shift": "afternoon",
    "status": "inactive"
  }
}
```

### Delete Guard

**Endpoint:** `DELETE /api/guards/:id`

**Response (200):**
```json
{
  "success": true,
  "message": "Guard deleted successfully",
  "data": {
    "guard_id": 4
  }
}
```

---

## Guest Requests

**Access Control:** READ - Authenticated users | APPROVE/REJECT - Admin only

### List All Guest Requests

**Endpoint:** `GET /api/guest-requests`

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `status` (optional): Filter by status (pending|approved|rejected)

**Response (200):**
```json
{
  "success": true,
  "message": "Guest requests retrieved successfully",
  "data": [
    {
      "guest_request_id": 1,
      "member_id": "IITGN_01",
      "name": "Rohan Das",
      "contact": "9988776655",
      "image": "img_rohan.jpg",
      "age": 20,
      "email": "rohan@xyz.com",
      "reason": "Project Work",
      "status": "pending",
      "exit_date": "2026-02-20",
      "vehicle_number": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

### Get Guest Request by ID

**Endpoint:** `GET /api/guest-requests/:id`

**Response (200):**
```json
{
  "success": true,
  "message": "Guest request retrieved successfully",
  "data": {
    "guest_request_id": 1,
    "member_id": "IITGN_01",
    "name": "Rohan Das",
    "contact": "9988776655",
    "image": "img_rohan.jpg",
    "age": 20,
    "email": "rohan@xyz.com",
    "reason": "Project Work",
    "status": "pending",
    "exit_date": "2026-02-20",
    "vehicle_number": null
  }
}
```

### Create New Guest Request

**Endpoint:** `POST /api/guest-requests`

**Request Body:**
```json
{
  "member_id": "string (required)",
  "name": "string (required)",
  "contact": "string (required)",
  "email": "string (optional)",
  "age": "number (optional, 0-120)",
  "image": "string (optional)",
  "reason": "string (required)",
  "exit_date": "YYYY-MM-DD (required)",
  "vehicle_number": "string (optional)"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Guest request created successfully",
  "data": {
    "guest_request_id": 2,
    "member_id": "IITGN_02",
    "name": "New Guest",
    "contact": "9999999999",
    "email": "guest@example.com",
    "age": 25,
    "image": null,
    "reason": "Meeting",
    "status": "pending",
    "exit_date": "2026-03-25",
    "vehicle_number": null
  }
}
```

### Update Guest Request

**Endpoint:** `PUT /api/guest-requests/:id`

**Request Body (all optional, status cannot be updated here):**
```json
{
  "name": "string",
  "contact": "string",
  "email": "string",
  "age": "number",
  "image": "string",
  "reason": "string",
  "exit_date": "YYYY-MM-DD",
  "vehicle_number": "string"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Guest request updated successfully",
  "data": {
    "guest_request_id": 1,
    "name": "Updated Name",
    "exit_date": "2026-02-25"
  }
}
```

### Delete Guest Request

**Endpoint:** `DELETE /api/guest-requests/:id`

**Access:** Admin only

**Response (200):**
```json
{
  "success": true,
  "message": "Guest request deleted successfully",
  "data": {
    "guest_request_id": 2
  }
}
```

### Approve Guest Request

**Endpoint:** `PATCH /api/guest-requests/:id/approve`

**Access:** Admin only

**Request Body:** Empty

**Response (200):**
```json
{
  "success": true,
  "message": "Guest request approved successfully",
  "data": {
    "guest_request_id": 1,
    "status": "approved"
  }
}
```

### Reject Guest Request

**Endpoint:** `PATCH /api/guest-requests/:id/reject`

**Access:** Admin only

**Request Body:** Empty

**Response (200):**
```json
{
  "success": true,
  "message": "Guest request rejected successfully",
  "data": {
    "guest_request_id": 1,
    "status": "rejected"
  }
}
```

---

## Guests Management

**Access Control:** CREATE/DELETE - Admin only | READ - Authenticated users

### List All Guests

**Endpoint:** `GET /api/guests`

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response (200):**
```json
{
  "success": true,
  "message": "Guests retrieved successfully",
  "data": [
    {
      "guest_id": "GUEST_01",
      "person_id": 11,
      "room_number": "101",
      "vehicle_id": null,
      "guest_request_id": 1,
      "name": "Rohan Das",
      "email": "rohan@xyz.com",
      "contact": "9988776655"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

### Get Guest by ID

**Endpoint:** `GET /api/guests/:id`

**Response (200):**
```json
{
  "success": true,
  "message": "Guest retrieved successfully",
  "data": {
    "guest_id": "GUEST_01",
    "person_id": 11,
    "room_number": "101",
    "vehicle_id": null,
    "guest_request_id": 1,
    "name": "Rohan Das",
    "email": "rohan@xyz.com",
    "contact": "9988776655",
    "reason": "Project Work",
    "exit_date": "2026-02-20"
  }
}
```

### Create New Guest

**Endpoint:** `POST /api/guests`

**Access:** Admin only

**Request Body:**
```json
{
  "guest_request_id": "number (required, must be approved)",
  "room_number": "string (required)",
  "vehicle_id": "number (optional)"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Guest created successfully",
  "data": {
    "guest_id": "GUEST_02",
    "person_id": 12,
    "room_number": "102",
    "vehicle_id": null,
    "guest_request_id": 2,
    "name": "New Guest",
    "email": "guest@example.com",
    "contact": "9999999999"
  }
}
```

### Delete Guest

**Endpoint:** `DELETE /api/guests/:id`

**Access:** Admin only

**Response (200):**
```json
{
  "success": true,
  "message": "Guest deleted successfully",
  "data": {
    "guest_id": "GUEST_01"
  }
}
```

---

## Blacklist Management

**Access Control:** Admin only

### List All Blacklisted Persons

**Endpoint:** `GET /api/blacklist`

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response (200):**
```json
{
  "success": true,
  "message": "Blacklist retrieved successfully",
  "data": [
    {
      "blacklist_id": 1,
      "person_id": 5,
      "name": "Neha Patel",
      "contact": "7766554433",
      "image": "img_neha.jpg",
      "expiry": "2026-06-01"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

### Get Blacklist Entry by ID

**Endpoint:** `GET /api/blacklist/:id`

**Response (200):**
```json
{
  "success": true,
  "message": "Blacklist entry retrieved successfully",
  "data": {
    "blacklist_id": 1,
    "person_id": 5,
    "name": "Neha Patel",
    "contact": "7766554433",
    "image": "img_neha.jpg",
    "expiry": "2026-06-01"
  }
}
```

### Add Person to Blacklist

**Endpoint:** `POST /api/blacklist`

**Request Body:**
```json
{
  "person_id": "number (optional)",
  "name": "string (required)",
  "contact": "string (optional)",
  "image": "string (optional)",
  "expiry": "YYYY-MM-DD (required)"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Person added to blacklist successfully",
  "data": {
    "blacklist_id": 2,
    "person_id": null,
    "name": "Suspicious Person",
    "contact": "8888888888",
    "image": null,
    "expiry": "2026-12-31"
  }
}
```

### Update Blacklist Entry

**Endpoint:** `PUT /api/blacklist/:id`

**Request Body (all optional):**
```json
{
  "name": "string",
  "contact": "string",
  "image": "string",
  "expiry": "YYYY-MM-DD"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Blacklist entry updated successfully",
  "data": {
    "blacklist_id": 1,
    "name": "Updated Name",
    "expiry": "2026-09-01"
  }
}
```

### Remove From Blacklist

**Endpoint:** `DELETE /api/blacklist/:id`

**Response (200):**
```json
{
  "success": true,
  "message": "Person removed from blacklist successfully",
  "data": {
    "blacklist_id": 2
  }
}
```

---

## Gates Management

**Access Control:** Admin only

### List All Gates

**Endpoint:** `GET /api/gates`

**Response (200):**
```json
{
  "success": true,
  "message": "Gates retrieved successfully",
  "data": [
    {
      "gate_id": 1,
      "status": "open",
      "opening_time": "00:00:00",
      "closing_time": "23:59:59"
    },
    {
      "gate_id": 2,
      "status": "open",
      "opening_time": "06:00:00",
      "closing_time": "22:00:00"
    }
  ],
  "count": 3
}
```

### Get Gate by ID

**Endpoint:** `GET /api/gates/:id`

**Response (200):**
```json
{
  "success": true,
  "message": "Gate retrieved successfully",
  "data": {
    "gate_id": 1,
    "status": "open",
    "opening_time": "00:00:00",
    "closing_time": "23:59:59"
  }
}
```

### Update Gate

**Endpoint:** `PUT /api/gates/:id`

**Request Body (all optional):**
```json
{
  "opening_time": "HH:MM:SS",
  "closing_time": "HH:MM:SS",
  "status": "open|closed"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Gate updated successfully",
  "data": {
    "gate_id": 1,
    "opening_time": "06:00:00",
    "closing_time": "20:00:00",
    "status": "open"
  }
}
```

### Open Gate

**Endpoint:** `PATCH /api/gates/:id/open`

**Request Body:** Empty

**Response (200):**
```json
{
  "success": true,
  "message": "Gate opened successfully",
  "data": {
    "gate_id": 1,
    "status": "open",
    "timestamp": "2026-03-20T10:30:45.123Z"
  }
}
```

### Close Gate

**Endpoint:** `PATCH /api/gates/:id/close`

**Request Body:** Empty

**Response (200):**
```json
{
  "success": true,
  "message": "Gate closed successfully",
  "data": {
    "gate_id": 1,
    "status": "closed",
    "timestamp": "2026-03-20T17:45:30.456Z"
  }
}
```

---

## Access Logs

**Access Control:** Authenticated users

### Get All Access Logs

**Endpoint:** `GET /api/logs/people`

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page (default: 20)
- `gate_id` (optional): Filter by gate
- `person_id` (optional): Filter by person
- `startDate` (optional): Filter by start date (YYYY-MM-DD)
- `endDate` (optional): Filter by end date (YYYY-MM-DD)

**Response (200):**
```json
{
  "success": true,
  "message": "Access logs retrieved successfully",
  "data": [
    {
      "log_id": 1,
      "gate_id": 1,
      "person_id": 1,
      "vehicle_id": null,
      "entry_time": "2026-03-20T08:30:00.000Z",
      "exit_time": "2026-03-20T17:30:00.000Z",
      "gate_status": "open"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

### Get Person Access Logs

**Endpoint:** `GET /api/logs/people/:personId`

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `gate_id` (optional): Filter by gate
- `startDate` (optional): Filter by start date (YYYY-MM-DD)
- `endDate` (optional): Filter by end date (YYYY-MM-DD)

**Response (200):**
```json
{
  "success": true,
  "message": "Person access logs retrieved successfully",
  "data": [
    {
      "log_id": 1,
      "gate_id": 1,
      "person_id": 1,
      "vehicle_id": null,
      "entry_time": "2026-03-20T08:30:00.000Z",
      "exit_time": "2026-03-20T17:30:00.000Z",
      "gate_status": "open"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

### Log Entry

**Endpoint:** `POST /api/logs/entry`

**Request Body:**
```json
{
  "gate_id": "number (required)",
  "person_id": "number (required)",
  "vehicle_id": "number (optional)"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Entry logged successfully",
  "data": {
    "log_id": 6,
    "gate_id": 1,
    "person_id": 1,
    "vehicle_id": null,
    "entry_time": "2026-03-20T10:00:00.000Z"
  }
}
```

### Log Exit

**Endpoint:** `POST /api/logs/exit`

**Request Body:**
```json
{
  "log_id": "number (required - the entry log ID)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Exit logged successfully",
  "data": {
    "log_id": 6,
    "exit_time": "2026-03-20T17:00:00.000Z"
  }
}
```

---

## Response Format

All API responses follow a standard format:

### Success Response
```json
{
  "success": true,
  "message": "Operation description",
  "data": { /* response data */ },
  "pagination": { /* optional pagination info */ }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (in development mode)"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Duplicate resource |
| 500 | Internal Server Error |

---

## Error Examples

### Missing Authentication Token
```json
{
  "success": false,
  "message": "Authorization token missing"
}
```

### Insufficient Permissions
```json
{
  "success": false,
  "message": "Access denied: insufficient permissions",
  "requiredRole": ["admin"],
  "userRole": "user"
}
```

### Validation Error
```json
{
  "success": false,
  "message": "name, shift, and gate_id are required"
}
```

---

## Example Usage

### Login and Get Token
```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "password"
  }'
```

### Create a Member (with token)
```bash
curl -X POST http://localhost:3000/api/members \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -d '{
    "member_id": "IITGN_11",
    "name": "John Doe",
    "email": "john@iitgn.ac.in",
    "contact": "9999999999",
    "age": 20
  }'
```

### List Guards
```bash
curl -X GET "http://localhost:3000/api/guards?page=1&limit=10" \
  -H "Authorization: Bearer <jwt_token>"
```

---

## Default Credentials

For testing purposes:

```
Username: admin
Password: (check database hash)

Username: user
Password: (check database hash)
```

---

## Notes

- All timestamps are in ISO 8601 format
- Date format is YYYY-MM-DD
- Time format is HH:MM:SS
- Authentication tokens expire in 7 days
- Pagination is available for most list endpoints
- All requests should include proper error handling

---

## 📱 QR Code Management

**Access Control:** Authenticated users

### Generate Secure QR Code

**Endpoint:** `GET /api/qr/generate`

Generates a short-lived dynamically signed QR token used for access scanning.

**Response (200):**
```json
{
  "qrString": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---
