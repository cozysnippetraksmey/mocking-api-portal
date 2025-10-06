# Mocking API Portal

This project is an Angular 20 web portal that integrates with the mocking_service API to provide user management functionality. It demonstrates modern Angular development practices with signals, reactive forms, and comprehensive error handling.

## Features

- **User Management**: Create, view, and manage users through the mocking service API
- **API Integration**: Full integration with the mocking_service REST API
- **Error Handling**: Comprehensive error handling for network issues and API errors
- **Responsive Design**: Mobile-friendly interface with modern CSS styling
- **Testing**: Complete unit test coverage for services and components
- **TypeScript**: Full TypeScript support with strong typing

## Prerequisites

Before running this application, make sure you have:

1. **Node.js** (version 18 or later)
2. **Angular CLI** (version 20 or later)
3. **Mocking Service**: The backend mocking_service API running on `http://localhost:9090`

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Mocking Service

Ensure the mocking_service is running on port 9090. The service should provide the following endpoints:

- `POST /api/v1.0.0/users/generate-user` - Generate a random user
- `GET /api/v1.0.0/users/default-users` - Get all users
- `POST /api/v1.0.0/users/save` - Save a new user
- `GET /api/v1.0.0/users/{id}` - Get user by ID

### 3. Start the Development Server

```bash
ng serve
```

Navigate to `http://localhost:4200/` to view the application.

## API Integration

### Service Architecture

The application uses a service-based architecture:

- **MockingApiService**: Handles all HTTP communication with the mocking service API
- **Error Handling**: Automatic retry logic and comprehensive error messages
- **Type Safety**: Full TypeScript interfaces for API requests and responses

### API Endpoints Used

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1.0.0/users/generate-user` | Generate a random user |
| GET | `/api/v1.0.0/users/default-users` | Retrieve all default users |
| POST | `/api/v1.0.0/users/save` | Save a new user |
| GET | `/api/v1.0.0/users/{id}` | Get specific user by ID |

### Example API Response

```typescript
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

interface User {
  userId: string;
  firstName: string;
  lastName: string;
  userName: string;
  gender: string;
  age: number;
}
```

## Usage Examples

### Generate a Random User
Click the "Generate Random User" button to create a new user with random data from the mocking service.

### Load All Users
Click "Load All Users" to fetch and display all users from the mocking service.

### Create a New User
Fill out the form with user details and click "Save User" to create a new user record.

### Form Validation
The form includes comprehensive validation:
- All fields are required
- Age must be between 1 and 120
- Real-time validation feedback

## Development Commands

### Development server

```bash
ng serve
```

### Building

```bash
ng build
```

### Running unit tests

```bash
ng test
```

### Code scaffolding

```bash
ng generate component component-name
ng generate service service-name
```

## Project Structure

```
src/
├── app/
│   ├── core/
│   │   ├── models/           # TypeScript interfaces
│   │   └── services/         # API services
│   ├── features/
│   │   └── mockings/
│   │       └── components/   # UI components
│   ├── app.routes.ts         # Application routing
│   └── app.config.ts         # Application configuration
```

## Error Handling

The application provides comprehensive error handling:

- **Network Errors**: Detected and displayed with helpful messages
- **API Errors**: HTTP status codes are interpreted and shown to users
- **Retry Logic**: Automatic retry for transient failures
- **User Feedback**: Clear success/error messages for all operations

## Testing

### Unit Tests

The project includes comprehensive unit tests:

```bash
ng test
```

Tests cover:
- API service functionality
- Component behavior
- Form validation
- Error handling
- UI rendering

### Test Coverage

- **Services**: 100% coverage of MockingApiService
- **Components**: Full coverage of UserManagementComponent
- **Edge Cases**: Network failures, validation errors, loading states

## Contributing

1. Follow Angular style guide and best practices
2. Ensure all tests pass before committing
3. Add tests for new features
4. Update documentation as needed

## Troubleshooting

### Common Issues

**1. "Unable to connect to mocking service"**
- Ensure the mocking_service is running on `http://localhost:9090`
- Check that all required endpoints are available

**2. CORS Issues**
- The mocking service must allow CORS from `http://localhost:4200`

**3. Build Errors**
- Run `npm install` to ensure all dependencies are installed
- Check that Node.js version is 18 or later

## Additional Resources

For more information on using Angular CLI, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
