import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { ApiResponse } from '../models/api-response.model';
import { User, UserRequest } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class MockingApiService {
  private readonly baseUrl = 'http://localhost:9090/api/v1.0.0';
  
  constructor(private http: HttpClient) { }

  /**
   * Generate a new random user
   */
  generateUser(): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(`${this.baseUrl}/users/generate-user`, {})
      .pipe(
        retry(2),
        catchError(this.handleError)
      );
  }

  /**
   * Get all default users
   */
  getAllUsers(): Observable<ApiResponse<User[]>> {
    return this.http.get<ApiResponse<User[]>>(`${this.baseUrl}/users/default-users`)
      .pipe(
        retry(2),
        catchError(this.handleError)
      );
  }

  /**
   * Save a new user
   */
  saveUser(user: UserRequest): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(`${this.baseUrl}/users/save`, user)
      .pipe(
        retry(2),
        catchError(this.handleError)
      );
  }

  /**
   * Get user by ID
   */
  getUserById(id: string): Observable<ApiResponse<User | null>> {
    return this.http.get<ApiResponse<User | null>>(`${this.baseUrl}/users/${id}`)
      .pipe(
        retry(2),
        catchError(this.handleError)
      );
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.status === 0) {
        errorMessage = 'Unable to connect to mocking service. Please check if the service is running.';
      } else if (error.status >= 400 && error.status < 500) {
        errorMessage = `Client Error (${error.status}): ${error.error?.message || error.statusText}`;
      } else if (error.status >= 500) {
        errorMessage = `Server Error (${error.status}): ${error.error?.message || error.statusText}`;
      } else {
        errorMessage = `HTTP Error ${error.status}: ${error.statusText}`;
      }
    }
    
    console.error('Mocking API Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}