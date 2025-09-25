import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { provideZonelessChangeDetection } from '@angular/core';
import { UserManagementComponent } from './user-management.component';
import { MockingApiService } from '../../../core/services/mocking-api.service';
import { ApiResponse } from '../../../core/models/api-response.model';
import { User, UserRequest } from '../../../core/models/user.model';

describe('UserManagementComponent', () => {
  let component: UserManagementComponent;
  let fixture: ComponentFixture<UserManagementComponent>;
  let mockApiService: jasmine.SpyObj<MockingApiService>;

  const mockUser: User = {
    userId: 'user-1',
    firstName: 'John',
    lastName: 'Doe',
    userName: 'johndoe',
    gender: 'Male',
    age: 30
  };

  const mockUsers: User[] = [
    mockUser,
    {
      userId: 'user-2',
      firstName: 'Jane',
      lastName: 'Smith',
      userName: 'janesmith',
      gender: 'Female',
      age: 25
    }
  ];

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('MockingApiService', [
      'generateUser',
      'getAllUsers',
      'saveUser',
      'getUserById'
    ]);

    await TestBed.configureTestingModule({
      imports: [UserManagementComponent, ReactiveFormsModule],
      providers: [
        provideZonelessChangeDetection(),
        { provide: MockingApiService, useValue: spy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserManagementComponent);
    component = fixture.componentInstance;
    mockApiService = TestBed.inject(MockingApiService) as jasmine.SpyObj<MockingApiService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty form and no users', () => {
    expect(component.users()).toEqual([]);
    expect(component.loading()).toBe(false);
    expect(component.errorMessage()).toBe('');
    expect(component.successMessage()).toBe('');
    expect(component.userForm.valid).toBe(false);
  });

  describe('generateUser', () => {
    it('should generate a user successfully', () => {
      const response: ApiResponse<User> = {
        code: 200,
        message: 'success',
        data: mockUser
      };
      mockApiService.generateUser.and.returnValue(of(response));

      component.generateUser();

      expect(mockApiService.generateUser).toHaveBeenCalled();
      expect(component.users()).toContain(mockUser);
      expect(component.successMessage()).toBe('Successfully generated a new user!');
      expect(component.errorMessage()).toBe('');
      expect(component.loading()).toBe(false);
    });

    it('should handle API errors', () => {
      const errorMessage = 'API Error';
      mockApiService.generateUser.and.returnValue(throwError(() => new Error(errorMessage)));

      component.generateUser();

      expect(component.errorMessage()).toBe(errorMessage);
      expect(component.successMessage()).toBe('');
      expect(component.loading()).toBe(false);
    });

    it('should handle API response with error code', () => {
      const response: ApiResponse<User> = {
        code: 400,
        message: 'Bad request',
        data: null as any
      };
      mockApiService.generateUser.and.returnValue(of(response));

      component.generateUser();

      expect(component.errorMessage()).toBe('Bad request');
      expect(component.successMessage()).toBe('');
    });
  });

  describe('loadAllUsers', () => {
    it('should load all users successfully', () => {
      const response: ApiResponse<User[]> = {
        code: 200,
        message: 'success',
        data: mockUsers
      };
      mockApiService.getAllUsers.and.returnValue(of(response));

      component.loadAllUsers();

      expect(mockApiService.getAllUsers).toHaveBeenCalled();
      expect(component.users()).toEqual(mockUsers);
      expect(component.successMessage()).toBe('Successfully loaded 2 users!');
      expect(component.errorMessage()).toBe('');
    });

    it('should handle load users error', () => {
      const errorMessage = 'Network error';
      mockApiService.getAllUsers.and.returnValue(throwError(() => new Error(errorMessage)));

      component.loadAllUsers();

      expect(component.errorMessage()).toBe(errorMessage);
      expect(component.successMessage()).toBe('');
    });
  });

  describe('saveUser', () => {
    beforeEach(() => {
      component.userForm.patchValue({
        userId: 'user-3',
        firstName: 'Bob',
        lastName: 'Johnson',
        userName: 'bobjohnson',
        gender: 'Male',
        age: 35
      });
    });

    it('should save a user successfully', () => {
      const userRequest: UserRequest = {
        userId: 'user-3',
        firstName: 'Bob',
        lastName: 'Johnson',
        userName: 'bobjohnson',
        gender: 'Male',
        age: 35
      };

      const response: ApiResponse<User> = {
        code: 200,
        message: 'success',
        data: userRequest
      };
      mockApiService.saveUser.and.returnValue(of(response));

      component.saveUser();

      expect(mockApiService.saveUser).toHaveBeenCalledWith(userRequest);
      expect(component.users()).toContain(userRequest);
      expect(component.successMessage()).toBe('Successfully saved user!');
      expect(component.errorMessage()).toBe('');
      expect(component.userForm.pristine).toBe(true); // Form should be reset
    });

    it('should not save if form is invalid', () => {
      component.userForm.reset();

      component.saveUser();

      expect(mockApiService.saveUser).not.toHaveBeenCalled();
    });

    it('should handle save user error', () => {
      const errorMessage = 'Validation error';
      mockApiService.saveUser.and.returnValue(throwError(() => new Error(errorMessage)));

      component.saveUser();

      expect(component.errorMessage()).toBe(errorMessage);
      expect(component.successMessage()).toBe('');
    });
  });

  describe('form validation', () => {
    it('should require all fields', () => {
      expect(component.userForm.get('userId')?.invalid).toBe(true);
      expect(component.userForm.get('firstName')?.invalid).toBe(true);
      expect(component.userForm.get('lastName')?.invalid).toBe(true);
      expect(component.userForm.get('userName')?.invalid).toBe(true);
      expect(component.userForm.get('gender')?.invalid).toBe(true);
      expect(component.userForm.get('age')?.invalid).toBe(true);
    });

    it('should validate age range', () => {
      const ageControl = component.userForm.get('age')!;
      
      ageControl.setValue(0);
      expect(ageControl.hasError('min')).toBe(true);
      
      ageControl.setValue(121);
      expect(ageControl.hasError('max')).toBe(true);
      
      ageControl.setValue(25);
      expect(ageControl.hasError('min')).toBe(false);
      expect(ageControl.hasError('max')).toBe(false);
    });

    it('should be valid when all fields are properly filled', () => {
      component.userForm.patchValue({
        userId: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        userName: 'johndoe',
        gender: 'Male',
        age: 30
      });

      expect(component.userForm.valid).toBe(true);
    });
  });

  describe('loading state', () => {
    it('should set loading state during generate user operation', () => {
      const response: ApiResponse<User> = {
        code: 200,
        message: 'success',
        data: mockUser
      };
      
      mockApiService.generateUser.and.returnValue(of(response));

      component.generateUser();
      
      expect(component.loading()).toBe(false); // Should be false after synchronous completion
      expect(component.users()).toContain(mockUser);
    });
  });

  describe('UI rendering', () => {
    it('should display users when available', () => {
      component.users.set(mockUsers);
      fixture.detectChanges();

      const userCards = fixture.nativeElement.querySelectorAll('.user-card');
      expect(userCards.length).toBe(2);
      
      const firstUserCard = userCards[0];
      expect(firstUserCard.textContent).toContain('John Doe');
      expect(firstUserCard.textContent).toContain('user-1');
    });

    it('should show error message when present', () => {
      component.errorMessage.set('Test error message');
      fixture.detectChanges();

      const errorSection = fixture.nativeElement.querySelector('.error-section');
      expect(errorSection).toBeTruthy();
      expect(errorSection.textContent).toContain('Test error message');
    });

    it('should show success message when present', () => {
      component.successMessage.set('Test success message');
      fixture.detectChanges();

      const successSection = fixture.nativeElement.querySelector('.success-section');
      expect(successSection).toBeTruthy();
      expect(successSection.textContent).toContain('Test success message');
    });

    it('should disable buttons when loading', () => {
      component.loading.set(true);
      fixture.detectChanges();

      const generateButton = fixture.nativeElement.querySelector('.btn-primary');
      const loadButton = fixture.nativeElement.querySelector('.btn-secondary');
      
      expect(generateButton.disabled).toBe(true);
      expect(loadButton.disabled).toBe(true);
    });
  });
});