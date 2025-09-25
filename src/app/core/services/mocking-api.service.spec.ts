import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MockingApiService } from './mocking-api.service';
import { ApiResponse } from '../models/api-response.model';
import { User, UserRequest } from '../models/user.model';

describe('MockingApiService', () => {
  let service: MockingApiService;
  let httpMock: HttpTestingController;
  const baseUrl = 'http://localhost:9090/api/v1.0.0';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MockingApiService, provideZonelessChangeDetection()]
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

  describe('generateUser', () => {
    it('should generate a new user', () => {
      const mockResponse: ApiResponse<User> = {
        code: 200,
        message: 'success',
        data: {
          userId: 'user-1',
          firstName: 'John',
          lastName: 'Doe',
          userName: 'johndoe',
          gender: 'Male',
          age: 30
        }
      };

      service.generateUser().subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${baseUrl}/users/generate-user`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });

    it('should handle HTTP errors', () => {
      service.generateUser().subscribe({
        next: () => fail('Expected an error'),
        error: (error) => {
          expect(error.message).toContain('HTTP Error 500');
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/users/generate-user`);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle network errors', () => {
      service.generateUser().subscribe({
        next: () => fail('Expected an error'),
        error: (error) => {
          expect(error.message).toContain('Unable to connect to mocking service');
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/users/generate-user`);
      req.error(new ProgressEvent('Network error'), { status: 0 });
    });
  });

  describe('getAllUsers', () => {
    it('should get all users', () => {
      const mockResponse: ApiResponse<User[]> = {
        code: 200,
        message: 'success',
        data: [
          {
            userId: 'user-1',
            firstName: 'John',
            lastName: 'Doe',
            userName: 'johndoe',
            gender: 'Male',
            age: 30
          },
          {
            userId: 'user-2',
            firstName: 'Jane',
            lastName: 'Smith',
            userName: 'janesmith',
            gender: 'Female',
            age: 25
          }
        ]
      };

      service.getAllUsers().subscribe((response) => {
        expect(response).toEqual(mockResponse);
        expect(response.data.length).toBe(2);
      });

      const req = httpMock.expectOne(`${baseUrl}/users/default-users`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('saveUser', () => {
    it('should save a user', () => {
      const userRequest: UserRequest = {
        userId: 'user-3',
        firstName: 'Bob',
        lastName: 'Johnson',
        userName: 'bobjohnson',
        gender: 'Male',
        age: 35
      };

      const mockResponse: ApiResponse<User> = {
        code: 200,
        message: 'user create success.',
        data: userRequest
      };

      service.saveUser(userRequest).subscribe((response) => {
        expect(response).toEqual(mockResponse);
        expect(response.data).toEqual(userRequest);
      });

      const req = httpMock.expectOne(`${baseUrl}/users/save`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(userRequest);
      req.flush(mockResponse);
    });

    it('should handle validation errors', () => {
      const userRequest: UserRequest = {
        userId: '',
        firstName: 'Bob',
        lastName: 'Johnson',
        userName: 'bobjohnson',
        gender: 'Male',
        age: 35
      };

      service.saveUser(userRequest).subscribe({
        next: () => fail('Expected an error'),
        error: (error) => {
          expect(error.message).toContain('Client Error (400)');
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/users/save`);
      req.flush({ message: 'Validation failed' }, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('getUserById', () => {
    it('should get user by id', () => {
      const userId = 'user-1';
      const mockResponse: ApiResponse<User | null> = {
        code: 200,
        message: 'success',
        data: {
          userId: 'user-1',
          firstName: 'John',
          lastName: 'Doe',
          userName: 'johndoe',
          gender: 'Male',
          age: 30
        }
      };

      service.getUserById(userId).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${baseUrl}/users/${userId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle user not found', () => {
      const userId = 'nonexistent';

      service.getUserById(userId).subscribe({
        next: () => fail('Expected an error'),
        error: (error) => {
          expect(error.message).toContain('Client Error (404)');
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/users/${userId}`);
      req.flush({ message: 'User not found' }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('error handling', () => {
    it('should retry requests on temporary failures', () => {
      service.generateUser().subscribe({
        next: () => fail('Expected an error after retries'),
        error: (error) => {
          expect(error.message).toContain('HTTP Error 503');
        }
      });

      // Expect 3 requests (1 initial + 2 retries)
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/users/generate-user`);
        req.flush('Service Unavailable', { status: 503, statusText: 'Service Unavailable' });
      }
    });
  });
});