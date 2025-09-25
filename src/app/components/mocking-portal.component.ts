import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MockingApiService, MockData, ApiResponse } from '../services/mocking-api.service';

/**
 * Component for interacting with the mocking API
 * Provides forms for creating/editing mocks and displays existing mock configurations
 */
@Component({
  selector: 'app-mocking-portal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './mocking-portal.component.html',
  styleUrl: './mocking-portal.component.css'
})
export class MockingPortalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private mockingService = inject(MockingApiService);

  // Form for authentication
  authForm = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  // Form for creating/editing mock configurations
  mockForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(1)]],
    description: [''],
    endpoint: ['', [Validators.required, Validators.pattern(/^\/.*$/)]],
    method: ['GET', [Validators.required]],
    statusCode: [200, [Validators.required, Validators.min(100), Validators.max(599)]],
    responseData: ['{}', [Validators.required]],
    headers: ['{}']
  });

  // Form for testing endpoints
  testForm = this.fb.group({
    endpoint: ['', [Validators.required]],
    method: ['GET', [Validators.required]],
    testData: ['{}']
  });

  // Signals for component state
  private mockConfigurationsSignal = signal<MockData[]>([]);
  private errorSignal = signal<string | null>(null);
  private successSignal = signal<string | null>(null);
  private editingMockSignal = signal<MockData | null>(null);
  private testResultSignal = signal<any>(null);
  private activeTabSignal = signal<'list' | 'create' | 'test'>('list');

  // Computed values
  mockConfigurations = this.mockConfigurationsSignal.asReadonly();
  error = this.errorSignal.asReadonly();
  success = this.successSignal.asReadonly();
  editingMock = this.editingMockSignal.asReadonly();
  testResult = this.testResultSignal.asReadonly();
  activeTab = this.activeTabSignal.asReadonly();
  
  isAuthenticated = computed(() => this.mockingService.isAuthenticated());
  loading = this.mockingService.loading;
  
  // Available HTTP methods
  httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

  ngOnInit(): void {
    // Subscribe to authentication state
    this.mockingService.auth$.subscribe(auth => {
      if (auth.authenticated) {
        this.loadMockConfigurations();
      }
    });

    // Load configurations if already authenticated
    if (this.isAuthenticated()) {
      this.loadMockConfigurations();
    }
  }

  /**
   * Handle user authentication
   */
  onLogin(): void {
    if (this.authForm.valid) {
      const credentials = this.authForm.value;
      this.clearMessages();

      this.mockingService.authenticate({
        username: credentials.username!,
        password: credentials.password!
      }).subscribe({
        next: (response) => {
          this.successSignal.set('Successfully authenticated!');
          this.authForm.reset();
        },
        error: (error) => {
          this.errorSignal.set(`Authentication failed: ${error.message}`);
        }
      });
    } else {
      this.markFormGroupTouched(this.authForm);
    }
  }

  /**
   * Handle user logout
   */
  onLogout(): void {
    this.mockingService.logout().subscribe({
      next: () => {
        this.successSignal.set('Successfully logged out!');
        this.mockConfigurationsSignal.set([]);
        this.setActiveTab('list');
      },
      error: (error) => {
        this.errorSignal.set(`Logout failed: ${error.message}`);
      }
    });
  }

  /**
   * Load mock configurations from API
   */
  loadMockConfigurations(): void {
    this.clearMessages();
    
    this.mockingService.getMockConfigurations().subscribe({
      next: (response) => {
        this.mockConfigurationsSignal.set(response.data || []);
      },
      error: (error) => {
        this.errorSignal.set(`Failed to load configurations: ${error.message}`);
      }
    });
  }

  /**
   * Handle mock configuration submission (create or update)
   */
  onSubmitMock(): void {
    if (this.mockForm.valid) {
      const formValue = this.mockForm.value;
      this.clearMessages();

      // Parse JSON fields
      let responseData, headers;
      try {
        responseData = JSON.parse(formValue.responseData!);
        headers = formValue.headers ? JSON.parse(formValue.headers) : {};
      } catch (error) {
        this.errorSignal.set('Invalid JSON format in response data or headers');
        return;
      }

      const mockData: Omit<MockData, 'id' | 'createdAt' | 'updatedAt'> = {
        name: formValue.name!,
        description: formValue.description || '',
        endpoint: formValue.endpoint!,
        method: formValue.method!,
        statusCode: formValue.statusCode!,
        responseData,
        headers
      };

      const editing = this.editingMockSignal();
      
      if (editing) {
        // Update existing mock
        this.mockingService.updateMockConfiguration(editing.id!, mockData).subscribe({
          next: (response) => {
            this.successSignal.set('Mock configuration updated successfully!');
            this.resetMockForm();
            this.loadMockConfigurations();
            this.setActiveTab('list');
          },
          error: (error) => {
            this.errorSignal.set(`Failed to update mock: ${error.message}`);
          }
        });
      } else {
        // Create new mock
        this.mockingService.createMockConfiguration(mockData).subscribe({
          next: (response) => {
            this.successSignal.set('Mock configuration created successfully!');
            this.resetMockForm();
            this.loadMockConfigurations();
            this.setActiveTab('list');
          },
          error: (error) => {
            this.errorSignal.set(`Failed to create mock: ${error.message}`);
          }
        });
      }
    } else {
      this.markFormGroupTouched(this.mockForm);
    }
  }

  /**
   * Edit an existing mock configuration
   */
  editMock(mock: MockData): void {
    this.editingMockSignal.set(mock);
    this.mockForm.patchValue({
      name: mock.name,
      description: mock.description || '',
      endpoint: mock.endpoint,
      method: mock.method,
      statusCode: mock.statusCode,
      responseData: JSON.stringify(mock.responseData, null, 2),
      headers: JSON.stringify(mock.headers || {}, null, 2)
    });
    this.setActiveTab('create');
  }

  /**
   * Delete a mock configuration
   */
  deleteMock(id: string): void {
    if (confirm('Are you sure you want to delete this mock configuration?')) {
      this.clearMessages();
      
      this.mockingService.deleteMockConfiguration(id).subscribe({
        next: () => {
          this.successSignal.set('Mock configuration deleted successfully!');
          this.loadMockConfigurations();
        },
        error: (error) => {
          this.errorSignal.set(`Failed to delete mock: ${error.message}`);
        }
      });
    }
  }

  /**
   * Test a mock endpoint
   */
  onTestEndpoint(): void {
    if (this.testForm.valid) {
      const formValue = this.testForm.value;
      this.clearMessages();

      let testData;
      try {
        testData = formValue.testData ? JSON.parse(formValue.testData) : undefined;
      } catch (error) {
        this.errorSignal.set('Invalid JSON format in test data');
        return;
      }

      this.mockingService.testMockEndpoint(
        formValue.endpoint!,
        formValue.method!,
        testData
      ).subscribe({
        next: (response) => {
          this.testResultSignal.set(response);
          this.successSignal.set('Endpoint test completed successfully!');
        },
        error: (error) => {
          this.testResultSignal.set(null);
          this.errorSignal.set(`Endpoint test failed: ${error.message}`);
        }
      });
    } else {
      this.markFormGroupTouched(this.testForm);
    }
  }

  /**
   * Reset the mock form and editing state
   */
  resetMockForm(): void {
    this.mockForm.reset({
      method: 'GET',
      statusCode: 200,
      responseData: '{}',
      headers: '{}'
    });
    this.editingMockSignal.set(null);
  }

  /**
   * Set the active tab
   */
  setActiveTab(tab: 'list' | 'create' | 'test'): void {
    this.activeTabSignal.set(tab);
    if (tab === 'create') {
      this.resetMockForm();
    }
  }

  /**
   * Clear success and error messages
   */
  clearMessages(): void {
    this.errorSignal.set(null);
    this.successSignal.set(null);
  }

  /**
   * Mark all fields in a form group as touched to trigger validation display
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Get field error message
   */
  getFieldError(formGroup: FormGroup, fieldName: string): string | null {
    const control = formGroup.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) return `${fieldName} is required`;
      if (control.errors['minlength']) return `${fieldName} is too short`;
      if (control.errors['pattern']) return `${fieldName} format is invalid`;
      if (control.errors['min']) return `${fieldName} value is too low`;
      if (control.errors['max']) return `${fieldName} value is too high`;
    }
    return null;
  }
}