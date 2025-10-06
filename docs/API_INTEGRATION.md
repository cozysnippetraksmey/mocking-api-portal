# Mocking Service API Integration Documentation

This document provides detailed information about how the Mocking API Portal integrates with the mocking_service backend.

## Overview

The Mocking API Portal is designed to interact with a Spring Boot-based mocking service that provides user management functionality. The integration is built using Angular's HttpClient with comprehensive error handling and retry logic.

## API Configuration

### Base URL
```typescript
const baseUrl = 'http://localhost:9090/api/v1.0.0';
```

### API Version
The service uses version `v1.0.0` as defined in the mocking service configuration.

## Endpoints

### 1. Generate Random User

**Endpoint:** `POST /api/v1.0.0/users/generate-user`

**Purpose:** Generate a new user with random data.

**Request:**
```typescript
// No request body required
{}
```

**Response:**
```typescript
{
  "code": 200,
  "message": "success",
  "data": {
    "userId": "generated-uuid",
    "firstName": "RandomFirstName",
    "lastName": "RandomLastName", 
    "userName": "randomusername",
    "gender": "Male|Female|Other",
    "age": 25
  }
}
```

**Usage Example:**
```typescript
this.mockingApiService.generateUser().subscribe({
  next: (response) => {
    if (response.code === 200) {
      console.log('Generated user:', response.data);
    }
  },
  error: (error) => {
    console.error('Error generating user:', error.message);
  }
});
```

### 2. Get All Default Users

**Endpoint:** `GET /api/v1.0.0/users/default-users`

**Purpose:** Retrieve all default users from the service.

**Request:** No body required

**Response:**
```typescript
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "userId": "user-1",
      "firstName": "John",
      "lastName": "Doe",
      "userName": "johndoe",
      "gender": "Male",
      "age": 30
    },
    // ... more users
  ]
}
```

**Usage Example:**
```typescript
this.mockingApiService.getAllUsers().subscribe({
  next: (response) => {
    console.log(`Loaded ${response.data.length} users`);
    this.users.set(response.data);
  }
});
```

### 3. Save New User

**Endpoint:** `POST /api/v1.0.0/users/save`

**Purpose:** Create and save a new user.

**Request:**
```typescript
{
  "userId": "unique-user-id",
  "firstName": "John",
  "lastName": "Doe", 
  "userName": "johndoe",
  "gender": "Male",
  "age": 30
}
```

**Response:**
```typescript
{
  "code": 200,
  "message": "user create success.",
  "data": {
    "userId": "unique-user-id",
    "firstName": "John",
    "lastName": "Doe",
    "userName": "johndoe", 
    "gender": "Male",
    "age": 30
  }
}
```

**Usage Example:**
```typescript
const userRequest: UserRequest = {
  userId: 'new-user-id',
  firstName: 'Jane',
  lastName: 'Smith',
  userName: 'janesmith',
  gender: 'Female',
  age: 28
};

this.mockingApiService.saveUser(userRequest).subscribe({
  next: (response) => {
    console.log('User saved successfully:', response.data);
  }
});
```

### 4. Get User by ID

**Endpoint:** `GET /api/v1.0.0/users/{id}`

**Purpose:** Retrieve a specific user by their ID.

**Request:** No body required, ID passed as path parameter

**Response:**
```typescript
{
  "code": 200,
  "message": "success", 
  "data": {
    "userId": "user-id",
    "firstName": "John",
    "lastName": "Doe",
    "userName": "johndoe",
    "gender": "Male",
    "age": 30
  }
}
```

**Usage Example:**
```typescript
this.mockingApiService.getUserById('user-123').subscribe({
  next: (response) => {
    if (response.data) {
      console.log('Found user:', response.data);
    } else {
      console.log('User not found');
    }
  }
});
```

## Error Handling

The API service implements comprehensive error handling:

### Network Errors
```typescript
// Connection refused, network unavailable, etc.
{
  message: "Unable to connect to mocking service. Please check if the service is running."
}
```

### Client Errors (4xx)
```typescript
// Bad request, validation errors, etc.
{
  message: "Client Error (400): Invalid user data provided"
}
```

### Server Errors (5xx)
```typescript
// Internal server error, service unavailable, etc.
{
  message: "Server Error (500): Internal server error occurred"
}
```

### Retry Logic

The service automatically retries failed requests up to 2 times for:
- Network timeouts
- Temporary server errors (5xx)
- Connection issues

```typescript
// Implemented using RxJS retry operator
.pipe(
  retry(2),
  catchError(this.handleError)
)
```

## Authentication

Currently, the mocking service does not require authentication. If authentication is added in the future, the service can be extended to include:

- JWT token handling
- Automatic token refresh
- Authentication interceptors

```typescript
// Future authentication implementation
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

## TypeScript Interfaces

### ApiResponse<T>
```typescript
interface ApiResponse<T> {
  code: number;        // HTTP status code
  message: string;     // Response message
  data: T;            // Response data
}
```

### User
```typescript
interface User {
  userId: string;      // Unique user identifier
  firstName: string;   // User's first name
  lastName: string;    // User's last name
  userName: string;    // Unique username
  gender: string;      // User's gender
  age: number;         // User's age
}
```

### UserRequest
```typescript
interface UserRequest {
  userId: string;      // Unique user identifier
  firstName: string;   // User's first name
  lastName: string;    // User's last name
  userName: string;    // Unique username
  gender: string;      // User's gender
  age: number;         // User's age (1-120)
}
```

## CORS Configuration

For development, ensure the mocking service allows CORS from the Angular dev server:

```yaml
# In mocking service application.yaml
cors:
  allowed-origins: 
    - http://localhost:4200
  allowed-methods:
    - GET
    - POST
    - PUT
    - DELETE
  allowed-headers:
    - Content-Type
    - Authorization
```

## Performance Considerations

### Request Caching
Consider implementing caching for frequently accessed data:

```typescript
// Example caching strategy
private userCache = new Map<string, User>();

getUserById(id: string): Observable<ApiResponse<User | null>> {
  if (this.userCache.has(id)) {
    return of({
      code: 200,
      message: 'success',
      data: this.userCache.get(id)!
    });
  }
  
  return this.http.get<ApiResponse<User | null>>(`${this.baseUrl}/users/${id}`)
    .pipe(
      tap(response => {
        if (response.data) {
          this.userCache.set(id, response.data);
        }
      })
    );
}
```

### Request Debouncing
For search functionality, implement debouncing:

```typescript
// Example search with debouncing
searchUsers(searchTerm: string): Observable<ApiResponse<User[]>> {
  return this.searchSubject.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap(term => 
      this.http.get<ApiResponse<User[]>>(`${this.baseUrl}/users/search?q=${term}`)
    )
  );
}
```

## Testing

### Unit Testing API Service

```typescript
// Example test setup
beforeEach(() => {
  TestBed.configureTestingModule({
    imports: [HttpClientTestingModule],
    providers: [MockingApiService]
  });
  service = TestBed.inject(MockingApiService);
  httpMock = TestBed.inject(HttpTestingController);
});

// Example test
it('should generate user', () => {
  const mockResponse = { code: 200, message: 'success', data: mockUser };
  
  service.generateUser().subscribe(response => {
    expect(response).toEqual(mockResponse);
  });
  
  const req = httpMock.expectOne(`${baseUrl}/users/generate-user`);
  expect(req.request.method).toBe('POST');
  req.flush(mockResponse);
});
```

## Deployment Considerations

### Environment Configuration

Use Angular environments for different API URLs:

```typescript
// environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:9090/api/v1.0.0'
};

// environment.prod.ts  
export const environment = {
  production: true,
  apiUrl: 'https://api.yourdomain.com/api/v1.0.0'
};
```

### Service Configuration

```typescript
@Injectable({
  providedIn: 'root'
})
export class MockingApiService {
  private readonly baseUrl = environment.apiUrl;
  // ... rest of service
}
```

## Monitoring and Logging

### Error Logging

```typescript
private handleError(error: HttpErrorResponse) {
  // Log error for monitoring
  console.error('API Error Details:', {
    status: error.status,
    statusText: error.statusText,
    url: error.url,
    timestamp: new Date().toISOString()
  });
  
  // Could integrate with error monitoring service
  // this.errorMonitoringService.logError(error);
  
  return throwError(() => new Error(errorMessage));
}
```

### Request Logging

```typescript
// HTTP Interceptor for request logging
@Injectable()
export class LoggingInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    console.log('API Request:', req.method, req.url);
    
    return next.handle(req).pipe(
      tap(event => {
        if (event instanceof HttpResponse) {
          console.log('API Response:', event.status, event.url);
        }
      })
    );
  }
}
```