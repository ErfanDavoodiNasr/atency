# Atency

## Project Overview

Atency is an employee attendance management system built with Spring Boot. Employees check in and check out on working
days (Saturday to Wednesday), while admins can view all attendance records. The system provides attendance history,
worked hours, and absent day summaries.

## Tech Stack

- Java 21
- Spring Boot, Spring Security, Spring Data JPA
- PostgreSQL
- JWT Authentication
- Lombok

## How to Run the Project

### Prerequisites

- Java 21
- Maven
- PostgreSQL

### Database Setup

Create a PostgreSQL database named `atency` and update credentials in `src/main/resources/application.properties` if
needed.

### Run

```
./mvnw spring-boot:run
```

## Sample Data

On startup, sample users are created (configurable via `app.seed.enabled` in `application.properties`):

- Admin: `admin / 12345`

## API Usage

### Authentication

- `POST /api/auth/register`
- `POST /api/auth/login`

### Attendance (Employee)

- `POST /api/attendance/check-in`
- `POST /api/attendance/check-out`
- `GET /api/attendance/my-records`
- `GET /api/attendance/my-summary`

### Admin

- `GET /api/admin/attendance/all`
- `GET /api/admin/attendance/{userId}`

### Authorization Header

Use the JWT from login/registration:

```
Authorization: Bearer <token>
```

## Request Tracing and Errors

- Every HTTP request has a `referenceId` for tracing.
- Clients may supply `X-Reference-Id`; otherwise a new UUID is generated.
- The `referenceId` is returned in the response header and response body.
- Logs include `referenceId` to correlate requests and errors.

### Error Response Format

```
{
  "referenceId": "uuid",
  "timestamp": "ISO-8601",
  "status": 400,
  "error": "BAD_REQUEST",
  "message": "Human-readable message",
  "path": "/api/auth/login",
  "errors": {
    "fieldName": "validation message"
  }
}
```

For validation failures, the `errors` object is returned with field-level messages.
