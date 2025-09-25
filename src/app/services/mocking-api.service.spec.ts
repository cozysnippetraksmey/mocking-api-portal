import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MockingApiService, ApiResponse, AuthData, MockData } from './mocking-api.service';

describe('MockingApiService', () => {
  let service: MockingApiService;
  let httpMock: HttpTestingController;
  const baseUrl = 'http://localhost:3000/api';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MockingApiService]
    });
    service = TestBed.inject(MockingApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with unauthenticated state', () => {
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.getCurrentAuth()).toEqual({ authenticated: false });
  });

  describe('authenticate', () => {
    it('should authenticate user with credentials', () => {
      const mockCredentials = { username: 'testuser', password: 'testpass' };
      const mockResponse: ApiResponse<AuthData> = {
        data: { token: 'test-token', username: 'testuser', authenticated: true },
        status: 'success'
      };

      service.authenticate(mockCredentials).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(service.isAuthenticated()).toBeTrue();
      });

      const req = httpMock.expectOne(`${baseUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockCredentials);
      req.flush(mockResponse);
    });

    it('should handle authentication error', () => {
      const mockCredentials = { username: 'testuser', password: 'wrongpass' };
      
      service.authenticate(mockCredentials).subscribe({
        next: () => fail('Expected error'),
        error: (error) => {
          expect(error.message).toContain('401');
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/auth/login`);
      req.flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('logout', () => {
    it('should logout user and clear auth state', () => {
      // First authenticate
      service['authSubject'].next({ token: 'test-token', username: 'testuser', authenticated: true });
      
      const mockResponse: ApiResponse = { status: 'success', message: 'Logged out' };

      service.logout().subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(service.isAuthenticated()).toBeFalse();
      });

      const req = httpMock.expectOne(`${baseUrl}/auth/logout`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });

  describe('getMockConfigurations', () => {
    it('should fetch mock configurations', () => {
      const mockConfigs: MockData[] = [
        {
          id: '1',
          name: 'Test Mock',
          endpoint: '/test',
          method: 'GET',
          responseData: { message: 'test' },
          statusCode: 200
        }
      ];
      const mockResponse: ApiResponse<MockData[]> = {
        data: mockConfigs,
        status: 'success'
      };

      service.getMockConfigurations().subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${baseUrl}/mocks`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should retry on failure', () => {
      service.getMockConfigurations().subscribe({
        next: () => fail('Expected error'),
        error: (error) => {
          expect(error.message).toContain('500');
        }
      });

      // Expect 3 requests due to retry(2)
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/mocks`);
        req.flush({ message: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });
      }
    });
  });

  describe('createMockConfiguration', () => {
    it('should create a new mock configuration', () => {
      const newMock: Omit<MockData, 'id' | 'createdAt' | 'updatedAt'> = {
        name: 'New Mock',
        endpoint: '/new-test',
        method: 'POST',
        responseData: { success: true },
        statusCode: 201
      };
      const mockResponse: ApiResponse<MockData> = {
        data: { ...newMock, id: '2', createdAt: new Date(), updatedAt: new Date() },
        status: 'success'
      };

      service.createMockConfiguration(newMock).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${baseUrl}/mocks`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newMock);
      req.flush(mockResponse);
    });
  });

  describe('testMockEndpoint', () => {
    it('should test GET endpoint', () => {
      const mockResponse = { message: 'test response' };

      service.testMockEndpoint('/test', 'GET').subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${baseUrl}/test/test`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should test POST endpoint with data', () => {
      const testData = { name: 'test' };
      const mockResponse = { id: 1, ...testData };

      service.testMockEndpoint('/test', 'POST', testData).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${baseUrl}/test/test`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(testData);
      req.flush(mockResponse);
    });

    it('should handle unsupported HTTP method', () => {
      service.testMockEndpoint('/test', 'PATCH').subscribe({
        next: () => fail('Expected error'),
        error: (error) => {
          expect(error.message).toContain('Unsupported HTTP method: PATCH');
        }
      });

      httpMock.expectNone(`${baseUrl}/test/test`);
    });
  });

  describe('error handling', () => {
    it('should handle network errors', () => {
      service.getMockConfigurations().subscribe({
        next: () => fail('Expected error'),
        error: (error) => {
          expect(error.message).toContain('Network error');
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/mocks`);
      req.error(new ErrorEvent('Network error', {
        message: 'Connection failed'
      }));
    });

    it('should handle server errors', () => {
      service.getMockConfigurations().subscribe({
        next: () => fail('Expected error'),
        error: (error) => {
          expect(error.message).toContain('Server error 404');
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/mocks`);
      req.flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('loading state', () => {
    it('should update loading state during operations', () => {
      let loadingStates: boolean[] = [];
      
      service.loading().subscribe(loading => {
        loadingStates.push(loading);
      });

      service.getMockConfigurations().subscribe();

      const req = httpMock.expectOne(`${baseUrl}/mocks`);
      req.flush({ data: [], status: 'success' });

      expect(loadingStates).toContain(true);
      expect(loadingStates[loadingStates.length - 1]).toBe(false);
    });
  });
});