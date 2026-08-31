# Usage
Base URL = `http://localhost:3000`

Default User = `testuser@vortexsolutions.tech`  
Default Password = `Password123!` (for User 1 and 2)

## User

### Login User
* **Method:** `POST`
* **Endpoint:** `/api/v1/users/login`
* **Access:** Public
* **Headers:** `Content-Type: application/json`
* **Request Body:**

```json
{
  "email": "testuser@vortexsolutions.tech",
  "password": "Password123!"
}
```

### Register User
* **Method:** `POST`
* **Endpoint:** `/api/v1/users/register`
* **Access:** Public
* **Headers:** `Content-Type: application/json`
* **Request Body:**

```json
{
  "name": "Alex Mercer",
  "email": "alex.mercer@example.com",
  "password": "SecurePassword123!",
  "company_id": 1
}
```

### Get User
* **Method:** `GET`
* **Endpoint:** `/api/v1/users`
* **Access:** Private (Admin only)
* **Headers:** `Authorization: Bearer <admin_jwt_token>`

### Get User by ID
* **Method:** `GET`
* **Endpoint:** `/api/v1/users/:id`
* **Access:** Private
* **Headers:** `Authorization: Bearer <jwt_token>`

### Update User Details
* **Method:** `PATCH`
* **Endpoint:** `/api/v1/users/edit/:id`
* **Access:** Private (Role updating requires Admin role)
* **Headers:**
  * `Authorization: Bearer <jwt_token>`
  * `Content-Type: application/json`

* **Request Body (Comprehensive Example):**
```json
{
  "name": "Alex Mercer Updated",
  "email": "alex.updated@example.com",
  "password": "NewPassword456!",
  "company_id": 2,
  "position": {
    "title": "Senior Software Engineer",
    "department": "Engineering",
    "start_date": "2026-06-01"
  },
  "salary": {
    "amount": "95000.00",
    "currency": "NPR",
    "effective_date": "2026-06-01"
  }
}
```

### Salary
* Can be updated partially or fully via the main `/api/v1/users/edit/:id` endpoint using the `salary` nested object (`amount`, `currency`, `effective_date`). If currency or effective date is omitted, it defaults to `NPR` and the current date.

### Job Positions
* Can be updated partially or fully via the main `/api/v1/users/edit/:id` endpoint using the `position` nested object (`title`, `department`, `start_date`). If the start date is omitted, it defaults to the current date.

## Delete User
* **Method:** `DELETE`
* **Endpoint:** `/api/v1/users/:id`
* **Access:** Private (Admin only)
* **Headers:** `Authorization: Bearer <admin_jwt_token>`

## Company

### List Companies:
* **Method:** `GET`
* **Endpoint:** `/api/v1/companies`
* **Access:** Private
* **Headers:** `Authorization: Bearer <jwt_token>`

### Create Company:
* **Method:** `POST`
* **Endpoint:** `/api/v1/companies`
* **Access:** Private (Admin only)
* **Headers:**
  * `Authorization: Bearer <admin_jwt_token>`
  * `Content-Type: application/json`
* **Request Body:**
```json
{
  "name": "Vertex Solutions",
  "address": "Kathmandu"
}
```

### Update Company:
* **Method:** `PATCH`
* **Endpoint:** `/api/v1/companies/edit/:id`
* **Access:** Private (Admin only)
* **Headers:**
  * `Authorization: Bearer <admin_jwt_token>`
  * `Content-Type: application/json`
* **Request Body:**
```json
{
  "name": "Vertex Solutions Updated",
  "address": "Boudha, Kathmandu"
}
```
