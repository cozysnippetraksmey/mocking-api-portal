import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, retry, tap } from 'rxjs/operators';

/**
 * Interface for API response data
 */
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  status?: string;
  error?: string;
}

/**
 * Interface for authentication data
 */
export interface AuthData {
  token?: string;
  username?: string;
  authenticated: boolean;
}

/**
 * Interface for mock data structure
 */
export interface MockData {
  id?: string;
  name: string;
  description?: string;
  endpoint: string;
  method: string;
  responseData: any;
  statusCode: number;
  headers?: { [key: string]: string };
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Service to handle API interactions with the mocking service
 * Provides methods for authentication, fetching, and posting data with comprehensive error handling
 */
@Injectable({
  providedIn: 'root'
})
export class MockingApiService {
  private readonly baseUrl = 'http://localhost:3000/api'; // Configurable base URL
  private authSubject = new BehaviorSubject<AuthData>({ authenticated: false });
  private loadingSignal = signal(false);

  public auth$ = this.authSubject.asObservable();
  public loading = this.loadingSignal.asReadonly();

  constructor(private http: HttpClient) {}

  /**
   * Get HTTP headers with authentication token if available
   */
  private getHeaders(): HttpHeaders {
    const authData = this.authSubject.value;
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    if (authData.authenticated && authData.token) {
      headers = headers.set('Authorization', `Bearer ${authData.token}`);
    }

    return headers;
  }

  /**
   * Handle HTTP errors with detailed error information
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage: string;
    
    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      errorMessage = `Network error: ${error.error.message}`;
    } else {
      // Backend error
      errorMessage = `Server error ${error.status}: ${error.error?.message || error.message}`;
    }

    console.error('API Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  };

  /**
   * Set loading state
   */
  private setLoading(loading: boolean): void {
    this.loadingSignal.set(loading);
  }

  /**
   * Authenticate user with username/password or token
   */
  authenticate(credentials: { username?: string; password?: string; token?: string }): Observable<ApiResponse<AuthData>> {
    this.setLoading(true);
    
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<ApiResponse<AuthData>>(`${this.baseUrl}/auth/login`, credentials, { headers })
      .pipe(
        tap(response => {
          if (response.data) {
            this.authSubject.next({
              ...response.data,
              authenticated: true
            });
          }
        }),
        catchError(this.handleError),
        tap(() => this.setLoading(false))
      );
  }

  /**
   * Logout user and clear authentication state
   */
  logout(): Observable<ApiResponse> {
    this.setLoading(true);
    
    return this.http.post<ApiResponse>(`${this.baseUrl}/auth/logout`, {}, { 
      headers: this.getHeaders() 
    }).pipe(
      tap(() => {
        this.authSubject.next({ authenticated: false });
      }),
      catchError(this.handleError),
      tap(() => this.setLoading(false))
    );
  }

  /**
   * Get all mock configurations
   */
  getMockConfigurations(): Observable<ApiResponse<MockData[]>> {
    this.setLoading(true);
    
    return this.http.get<ApiResponse<MockData[]>>(`${this.baseUrl}/mocks`, {
      headers: this.getHeaders()
    }).pipe(
      retry(2),
      catchError(this.handleError),
      tap(() => this.setLoading(false))
    );
  }

  /**
   * Get a specific mock configuration by ID
   */
  getMockConfiguration(id: string): Observable<ApiResponse<MockData>> {
    this.setLoading(true);
    
    return this.http.get<ApiResponse<MockData>>(`${this.baseUrl}/mocks/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      retry(2),
      catchError(this.handleError),
      tap(() => this.setLoading(false))
    );
  }

  /**
   * Create a new mock configuration
   */
  createMockConfiguration(mockData: Omit<MockData, 'id' | 'createdAt' | 'updatedAt'>): Observable<ApiResponse<MockData>> {
    this.setLoading(true);
    
    return this.http.post<ApiResponse<MockData>>(`${this.baseUrl}/mocks`, mockData, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError),
      tap(() => this.setLoading(false))
    );
  }

  /**
   * Update an existing mock configuration
   */
  updateMockConfiguration(id: string, mockData: Partial<MockData>): Observable<ApiResponse<MockData>> {
    this.setLoading(true);
    
    return this.http.put<ApiResponse<MockData>>(`${this.baseUrl}/mocks/${id}`, mockData, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError),
      tap(() => this.setLoading(false))
    );
  }

  /**
   * Delete a mock configuration
   */
  deleteMockConfiguration(id: string): Observable<ApiResponse> {
    this.setLoading(true);
    
    return this.http.delete<ApiResponse>(`${this.baseUrl}/mocks/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError),
      tap(() => this.setLoading(false))
    );
  }

  /**
   * Test a mock endpoint
   */
  testMockEndpoint(endpoint: string, method: string, data?: any): Observable<any> {
    this.setLoading(true);
    
    const url = `${this.baseUrl}/test${endpoint}`;
    const options = { headers: this.getHeaders() };

    let request: Observable<any>;

    switch (method.toUpperCase()) {
      case 'GET':
        request = this.http.get(url, options);
        break;
      case 'POST':
        request = this.http.post(url, data, options);
        break;
      case 'PUT':
        request = this.http.put(url, data, options);
        break;
      case 'DELETE':
        request = this.http.delete(url, options);
        break;
      default:
        return throwError(() => new Error(`Unsupported HTTP method: ${method}`));
    }

    return request.pipe(
      catchError(this.handleError),
      tap(() => this.setLoading(false))
    );
  }

  /**
   * Get current authentication state
   */
  getCurrentAuth(): AuthData {
    return this.authSubject.value;
  }

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated(): boolean {
    return this.authSubject.value.authenticated;
  }
}