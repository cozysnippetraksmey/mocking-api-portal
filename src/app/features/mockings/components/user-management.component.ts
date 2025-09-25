import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MockingApiService } from '../../../core/services/mocking-api.service';
import { User, UserRequest } from '../../../core/models/user.model';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="user-management-container">
      <h1>Mocking API User Management</h1>
      
      <!-- Action Buttons -->
      <div class="action-section">
        <button 
          type="button" 
          class="btn btn-primary" 
          (click)="generateUser()"
          [disabled]="loading()">
          {{ loading() ? 'Generating...' : 'Generate Random User' }}
        </button>
        
        <button 
          type="button" 
          class="btn btn-secondary" 
          (click)="loadAllUsers()"
          [disabled]="loading()">
          {{ loading() ? 'Loading...' : 'Load All Users' }}
        </button>
      </div>

      <!-- User Form -->
      <div class="form-section">
        <h2>Create New User</h2>
        <form [formGroup]="userForm" (ngSubmit)="saveUser()" class="user-form">
          <div class="form-group">
            <label for="userId">User ID:</label>
            <input 
              id="userId"
              type="text" 
              formControlName="userId" 
              class="form-control"
              placeholder="Enter user ID">
            <div *ngIf="userForm.get('userId')?.invalid && userForm.get('userId')?.touched" class="error">
              User ID is required
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="firstName">First Name:</label>
              <input 
                id="firstName"
                type="text" 
                formControlName="firstName" 
                class="form-control"
                placeholder="Enter first name">
              <div *ngIf="userForm.get('firstName')?.invalid && userForm.get('firstName')?.touched" class="error">
                First name is required
              </div>
            </div>

            <div class="form-group">
              <label for="lastName">Last Name:</label>
              <input 
                id="lastName"
                type="text" 
                formControlName="lastName" 
                class="form-control"
                placeholder="Enter last name">
              <div *ngIf="userForm.get('lastName')?.invalid && userForm.get('lastName')?.touched" class="error">
                Last name is required
              </div>
            </div>
          </div>

          <div class="form-group">
            <label for="userName">Username:</label>
            <input 
              id="userName"
              type="text" 
              formControlName="userName" 
              class="form-control"
              placeholder="Enter username">
            <div *ngIf="userForm.get('userName')?.invalid && userForm.get('userName')?.touched" class="error">
              Username is required
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="gender">Gender:</label>
              <select id="gender" formControlName="gender" class="form-control">
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              <div *ngIf="userForm.get('gender')?.invalid && userForm.get('gender')?.touched" class="error">
                Gender is required
              </div>
            </div>

            <div class="form-group">
              <label for="age">Age:</label>
              <input 
                id="age"
                type="number" 
                formControlName="age" 
                class="form-control"
                placeholder="Enter age"
                min="1"
                max="120">
              <div *ngIf="userForm.get('age')?.invalid && userForm.get('age')?.touched" class="error">
                <span *ngIf="userForm.get('age')?.errors?.['required']">Age is required</span>
                <span *ngIf="userForm.get('age')?.errors?.['min']">Age must be at least 1</span>
                <span *ngIf="userForm.get('age')?.errors?.['max']">Age must be at most 120</span>
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            class="btn btn-success"
            [disabled]="userForm.invalid || loading()">
            {{ loading() ? 'Saving...' : 'Save User' }}
          </button>
        </form>
      </div>

      <!-- Error Display -->
      <div *ngIf="errorMessage()" class="error-section">
        <div class="alert alert-error">
          <strong>Error:</strong> {{ errorMessage() }}
        </div>
      </div>

      <!-- Success Display -->
      <div *ngIf="successMessage()" class="success-section">
        <div class="alert alert-success">
          {{ successMessage() }}
        </div>
      </div>

      <!-- Users Display -->
      <div *ngIf="users().length > 0" class="users-section">
        <h2>Users ({{ users().length }})</h2>
        <div class="users-grid">
          <div *ngFor="let user of users()" class="user-card">
            <div class="user-header">
              <h3>{{ user.firstName }} {{ user.lastName }}</h3>
              <span class="user-id">ID: {{ user.userId }}</span>
            </div>
            <div class="user-details">
              <p><strong>Username:</strong> {{ user.userName }}</p>
              <p><strong>Gender:</strong> {{ user.gender }}</p>
              <p><strong>Age:</strong> {{ user.age }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .user-management-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    h1 {
      color: #2c3e50;
      margin-bottom: 2rem;
      text-align: center;
    }

    .action-section {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
      justify-content: center;
    }

    .form-section {
      background: #f8f9fa;
      padding: 2rem;
      border-radius: 8px;
      margin-bottom: 2rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .form-section h2 {
      color: #2c3e50;
      margin-bottom: 1.5rem;
      border-bottom: 2px solid #3498db;
      padding-bottom: 0.5rem;
    }

    .user-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
    }

    .form-group label {
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: #2c3e50;
    }

    .form-control {
      padding: 0.75rem;
      border: 2px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
      transition: border-color 0.3s ease;
    }

    .form-control:focus {
      outline: none;
      border-color: #3498db;
    }

    .form-control:invalid {
      border-color: #e74c3c;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      text-decoration: none;
      display: inline-block;
      text-align: center;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-primary {
      background-color: #3498db;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: #2980b9;
    }

    .btn-secondary {
      background-color: #95a5a6;
      color: white;
    }

    .btn-secondary:hover:not(:disabled) {
      background-color: #7f8c8d;
    }

    .btn-success {
      background-color: #27ae60;
      color: white;
      width: 100%;
      margin-top: 1rem;
    }

    .btn-success:hover:not(:disabled) {
      background-color: #229954;
    }

    .error {
      color: #e74c3c;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    .alert {
      padding: 1rem;
      border-radius: 4px;
      margin-bottom: 1rem;
    }

    .alert-error {
      background-color: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }

    .alert-success {
      background-color: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }

    .users-section h2 {
      color: #2c3e50;
      margin-bottom: 1rem;
    }

    .users-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1rem;
    }

    .user-card {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      border-left: 4px solid #3498db;
    }

    .user-header {
      margin-bottom: 1rem;
    }

    .user-header h3 {
      margin: 0 0 0.5rem 0;
      color: #2c3e50;
    }

    .user-id {
      font-size: 0.875rem;
      color: #7f8c8d;
      background: #ecf0f1;
      padding: 0.25rem 0.5rem;
      border-radius: 3px;
    }

    .user-details p {
      margin: 0.5rem 0;
      color: #34495e;
    }

    .user-details strong {
      color: #2c3e50;
    }

    @media (max-width: 768px) {
      .user-management-container {
        padding: 1rem;
      }

      .action-section {
        flex-direction: column;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .users-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class UserManagementComponent {
  private mockingApiService = inject(MockingApiService);
  private formBuilder = inject(FormBuilder);

  // Signals for reactive state management
  loading = signal(false);
  users = signal<User[]>([]);
  errorMessage = signal('');
  successMessage = signal('');

  userForm: FormGroup;

  constructor() {
    this.userForm = this.formBuilder.group({
      userId: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      userName: ['', Validators.required],
      gender: ['', Validators.required],
      age: ['', [Validators.required, Validators.min(1), Validators.max(120)]]
    });
  }

  generateUser() {
    this.clearMessages();
    this.loading.set(true);

    this.mockingApiService.generateUser().subscribe({
      next: (response) => {
        if (response.code === 200 && response.data) {
          this.users.update(currentUsers => [response.data!, ...currentUsers]);
          this.successMessage.set('Successfully generated a new user!');
        } else {
          this.errorMessage.set(response.message || 'Failed to generate user');
        }
        this.loading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error.message);
        this.loading.set(false);
      }
    });
  }

  loadAllUsers() {
    this.clearMessages();
    this.loading.set(true);

    this.mockingApiService.getAllUsers().subscribe({
      next: (response) => {
        if (response.code === 200 && response.data) {
          this.users.set(response.data);
          this.successMessage.set(`Successfully loaded ${response.data.length} users!`);
        } else {
          this.errorMessage.set(response.message || 'Failed to load users');
        }
        this.loading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error.message);
        this.loading.set(false);
      }
    });
  }

  saveUser() {
    if (this.userForm.valid) {
      this.clearMessages();
      this.loading.set(true);

      const userRequest: UserRequest = {
        userId: this.userForm.value.userId,
        firstName: this.userForm.value.firstName,
        lastName: this.userForm.value.lastName,
        userName: this.userForm.value.userName,
        gender: this.userForm.value.gender,
        age: parseInt(this.userForm.value.age)
      };

      this.mockingApiService.saveUser(userRequest).subscribe({
        next: (response) => {
          if (response.code === 200 && response.data) {
            this.users.update(currentUsers => [response.data!, ...currentUsers]);
            this.successMessage.set('Successfully saved user!');
            this.userForm.reset();
          } else {
            this.errorMessage.set(response.message || 'Failed to save user');
          }
          this.loading.set(false);
        },
        error: (error) => {
          this.errorMessage.set(error.message);
          this.loading.set(false);
        }
      });
    }
  }

  private clearMessages() {
    this.errorMessage.set('');
    this.successMessage.set('');
  }
}