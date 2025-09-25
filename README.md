# MockingApiPortal

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.3.3.

## Overview

The Mocking API Portal is a comprehensive Angular application that provides a user-friendly interface for interacting with mocking services. It allows users to create, manage, and test API mock configurations through an intuitive web interface.

## Features

### 🔐 Authentication System
- Secure login with username/password authentication
- Token-based authentication support
- Session management with automatic logout

### 📝 Mock Configuration Management
- **Create Mock APIs**: Define custom API endpoints with configurable responses
- **Edit/Update**: Modify existing mock configurations
- **Delete**: Remove unwanted mock configurations
- **List View**: Browse all mock configurations in a responsive table

### 🧪 API Testing
- **Endpoint Testing**: Test mock endpoints directly from the interface
- **Multiple HTTP Methods**: Support for GET, POST, PUT, DELETE, and PATCH
- **Request Data**: Send custom JSON payloads for testing
- **Response Display**: View formatted JSON responses

### 🎨 User Interface
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Tab-based Navigation**: Easy switching between different functionalities
- **Real-time Validation**: Form validation with helpful error messages
- **Loading States**: Visual feedback during API operations
- **Success/Error Alerts**: Clear notification system

## Project Structure

```
src/app/
├── components/
│   ├── mocking-portal.component.ts     # Main UI component
│   ├── mocking-portal.component.html   # Component template
│   ├── mocking-portal.component.css    # Component styles
│   └── mocking-portal.component.spec.ts # Component tests
├── services/
│   ├── mocking-api.service.ts          # API service layer
│   └── mocking-api.service.spec.ts     # Service tests
├── app.config.ts                       # Application configuration
├── app.routes.ts                       # Routing configuration
└── app.html                           # Main application template
```

## Technology Stack

- **Angular 20.3.0** with Standalone Components
- **Zoneless Change Detection** for improved performance
- **Reactive Forms** for form handling and validation
- **RxJS** for reactive programming
- **HTTP Client** with interceptors for API communication
- **TypeScript** for type safety
- **Server-Side Rendering (SSR)** support

## Development server

To start a local development server, run:

```bash
npm install
npm start
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## API Configuration

The application is configured to connect to a mocking service API at `http://localhost:3000/api`. You can modify this in the `MockingApiService`:

```typescript
private readonly baseUrl = 'http://localhost:3000/api';
```

### Expected API Endpoints

- `POST /api/auth/login` - User authentication
- `POST /api/auth/logout` - User logout
- `GET /api/mocks` - Get all mock configurations
- `GET /api/mocks/:id` - Get specific mock configuration
- `POST /api/mocks` - Create new mock configuration
- `PUT /api/mocks/:id` - Update mock configuration
- `DELETE /api/mocks/:id` - Delete mock configuration
- `*` `/api/test/*` - Test mock endpoints

## Usage Instructions

### 1. Authentication
1. Open the application at `http://localhost:4200`
2. Enter your username and password
3. Click "Login" to authenticate

### 2. Managing Mock Configurations
1. After authentication, you'll see three tabs: "Mock List", "Create Mock", and "Test Endpoint"
2. Use the "Mock List" tab to view existing configurations
3. Use the "Create Mock" tab to add new mock APIs
4. Fill in the required fields:
   - **Name**: Descriptive name for your mock
   - **Endpoint**: API endpoint path (e.g., `/api/users`)
   - **HTTP Method**: GET, POST, PUT, DELETE, or PATCH
   - **Status Code**: HTTP response status (e.g., 200, 404)
   - **Response Data**: JSON response payload
   - **Headers**: Optional HTTP headers

### 3. Testing Endpoints
1. Navigate to the "Test Endpoint" tab
2. Enter the endpoint path and select HTTP method
3. Add request data if needed (for POST/PUT requests)
4. Click "Test Endpoint" to execute the request
5. View the response in the results section

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

Note: Tests require a display server. In headless environments, you may need to configure Chrome to run in headless mode.

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Architecture Decisions

### Service Layer
- **Centralized API Management**: All API interactions go through the `MockingApiService`
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Loading States**: Global loading state management using Angular signals
- **Authentication Management**: Secure token-based authentication with RxJS subjects

### UI Components
- **Standalone Components**: Using Angular's latest standalone component architecture
- **Reactive Forms**: Type-safe form handling with validation
- **Signal-based State**: Modern Angular signals for reactive state management
- **Responsive Design**: Mobile-first CSS with flexbox and grid layouts

### Testing Strategy
- **Unit Tests**: Comprehensive service and component testing
- **Mock Data**: Realistic test data for consistent testing
- **Edge Cases**: Testing error scenarios and edge cases
- **Isolated Testing**: Services and components tested in isolation

## Folder Structure Improvements

The current structure follows Angular best practices:

- ✅ **Separation of Concerns**: Services, components, and configuration are properly separated
- ✅ **Feature-based Organization**: Related functionality is grouped together
- ✅ **Testability**: Each module has corresponding test files
- ✅ **Scalability**: Structure supports easy addition of new features

## Contributing

1. Follow Angular style guide conventions
2. Write unit tests for new features
3. Use meaningful commit messages
4. Ensure code is properly formatted and linted
5. Update documentation for new features

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
