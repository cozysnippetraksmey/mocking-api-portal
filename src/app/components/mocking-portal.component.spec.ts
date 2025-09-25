import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideZonelessChangeDetection } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError, BehaviorSubject } from 'rxjs';

import { MockingPortalComponent } from './mocking-portal.component';
import { MockingApiService, MockData, AuthData } from '../services/mocking-api.service';

describe('MockingPortalComponent', () => {
  let component: MockingPortalComponent;
  let fixture: ComponentFixture<MockingPortalComponent>;
  let mockingService: jasmine.SpyObj<MockingApiService>;
  let authSubject: BehaviorSubject<AuthData>;

  beforeEach(async () => {
    // Create spies for the service
    authSubject = new BehaviorSubject<AuthData>({ authenticated: false });
    const serviceSpy = jasmine.createSpyObj('MockingApiService', [
      'authenticate',
      'logout',
      'getMockConfigurations',
      'createMockConfiguration',
      'updateMockConfiguration',
      'deleteMockConfiguration',
      'testMockEndpoint',
      'isAuthenticated'
    ], {
      auth$: authSubject.asObservable(),
      loading: jasmine.createSpy().and.returnValue(false)
    });

    await TestBed.configureTestingModule({
      imports: [MockingPortalComponent, ReactiveFormsModule, HttpClientTestingModule],
      providers: [
        provideZonelessChangeDetection(),
        { provide: MockingApiService, useValue: serviceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MockingPortalComponent);
    component = fixture.componentInstance;
    mockingService = TestBed.inject(MockingApiService) as jasmine.SpyObj<MockingApiService>;
    
    // Setup default spy returns
    mockingService.isAuthenticated.and.returnValue(false);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with unauthenticated state', () => {
    expect(component.isAuthenticated()).toBeFalse();
  });

  describe('Authentication', () => {
    it('should authenticate user with valid credentials', () => {
      const credentials = { username: 'testuser', password: 'testpass' };
      const mockResponse = {
        data: { token: 'test-token', username: 'testuser', authenticated: true },
        status: 'success'
      };

      mockingService.authenticate.and.returnValue(of(mockResponse));
      
      component.authForm.patchValue(credentials);
      component.onLogin();

      expect(mockingService.authenticate).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'testpass'
      });
      expect(component.success()).toBe('Successfully authenticated!');
    });

    it('should handle authentication error', () => {
      const credentials = { username: 'testuser', password: 'wrongpass' };
      const error = new Error('Authentication failed');

      mockingService.authenticate.and.returnValue(throwError(() => error));
      
      component.authForm.patchValue(credentials);
      component.onLogin();

      expect(component.error()).toContain('Authentication failed');
    });

    it('should not submit invalid auth form', () => {
      component.authForm.patchValue({ username: '', password: '' });
      component.onLogin();

      expect(mockingService.authenticate).not.toHaveBeenCalled();
    });

    it('should logout user', () => {
      const mockResponse = { status: 'success', message: 'Logged out' };
      mockingService.logout.and.returnValue(of(mockResponse));

      component.onLogout();

      expect(mockingService.logout).toHaveBeenCalled();
      expect(component.success()).toBe('Successfully logged out!');
    });
  });

  describe('Mock Configurations', () => {
    beforeEach(() => {
      mockingService.isAuthenticated.and.returnValue(true);
      component['isAuthenticated'] = jasmine.createSpy().and.returnValue(true);
    });

    it('should load mock configurations', () => {
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
      const mockResponse = { data: mockConfigs, status: 'success' };

      mockingService.getMockConfigurations.and.returnValue(of(mockResponse));

      component.loadMockConfigurations();

      expect(mockingService.getMockConfigurations).toHaveBeenCalled();
      expect(component.mockConfigurations()).toEqual(mockConfigs);
    });

    it('should create new mock configuration', () => {
      const mockData = {
        name: 'New Mock',
        endpoint: '/new-test',
        method: 'POST',
        statusCode: 201,
        responseData: '{"success": true}',
        headers: '{}'
      };
      const mockResponse = {
        data: { ...mockData, id: '2', responseData: { success: true }, headers: {} },
        status: 'success'
      };

      mockingService.createMockConfiguration.and.returnValue(of(mockResponse));
      mockingService.getMockConfigurations.and.returnValue(of({ data: [], status: 'success' }));

      component.mockForm.patchValue(mockData);
      component.onSubmitMock();

      expect(mockingService.createMockConfiguration).toHaveBeenCalledWith({
        name: 'New Mock',
        description: '',
        endpoint: '/new-test',
        method: 'POST',
        statusCode: 201,
        responseData: { success: true },
        headers: {}
      });
      expect(component.success()).toBe('Mock configuration created successfully!');
    });

    it('should handle invalid JSON in mock form', () => {
      component.mockForm.patchValue({
        name: 'Test Mock',
        endpoint: '/test',
        method: 'GET',
        statusCode: 200,
        responseData: 'invalid json',
        headers: '{}'
      });

      component.onSubmitMock();

      expect(mockingService.createMockConfiguration).not.toHaveBeenCalled();
      expect(component.error()).toContain('Invalid JSON format');
    });

    it('should edit mock configuration', () => {
      const mock: MockData = {
        id: '1',
        name: 'Test Mock',
        endpoint: '/test',
        method: 'GET',
        responseData: { message: 'test' },
        statusCode: 200
      };

      component.editMock(mock);

      expect(component.editingMock()).toEqual(mock);
      expect(component.activeTab()).toBe('create');
      expect(component.mockForm.get('name')?.value).toBe('Test Mock');
    });

    it('should delete mock configuration', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      const mockResponse = { status: 'success', message: 'Deleted' };
      mockingService.deleteMockConfiguration.and.returnValue(of(mockResponse));
      mockingService.getMockConfigurations.and.returnValue(of({ data: [], status: 'success' }));

      component.deleteMock('1');

      expect(mockingService.deleteMockConfiguration).toHaveBeenCalledWith('1');
      expect(component.success()).toBe('Mock configuration deleted successfully!');
    });

    it('should not delete when user cancels', () => {
      spyOn(window, 'confirm').and.returnValue(false);

      component.deleteMock('1');

      expect(mockingService.deleteMockConfiguration).not.toHaveBeenCalled();
    });
  });

  describe('Endpoint Testing', () => {
    it('should test mock endpoint', () => {
      const testData = { endpoint: '/test', method: 'GET', testData: '{}' };
      const mockResponse = { message: 'test response' };

      mockingService.testMockEndpoint.and.returnValue(of(mockResponse));

      component.testForm.patchValue(testData);
      component.onTestEndpoint();

      expect(mockingService.testMockEndpoint).toHaveBeenCalledWith('/test', 'GET', {});
      expect(component.testResult()).toEqual(mockResponse);
      expect(component.success()).toBe('Endpoint test completed successfully!');
    });

    it('should handle invalid JSON in test data', () => {
      component.testForm.patchValue({
        endpoint: '/test',
        method: 'GET',
        testData: 'invalid json'
      });

      component.onTestEndpoint();

      expect(mockingService.testMockEndpoint).not.toHaveBeenCalled();
      expect(component.error()).toContain('Invalid JSON format');
    });
  });

  describe('UI Interactions', () => {
    it('should reset mock form', () => {
      component.mockForm.patchValue({ name: 'test' });
      component['editingMockSignal'].set({ id: '1' } as MockData);

      component.resetMockForm();

      expect(component.mockForm.get('name')?.value).toBe('');
      expect(component.editingMock()).toBeNull();
    });

    it('should set active tab', () => {
      component.setActiveTab('create');

      expect(component.activeTab()).toBe('create');
    });

    it('should clear messages', () => {
      component['errorSignal'].set('test error');
      component['successSignal'].set('test success');

      component.clearMessages();

      expect(component.error()).toBeNull();
      expect(component.success()).toBeNull();
    });

    it('should get field error messages', () => {
      const form = component.authForm;
      form.get('username')?.setValue('');
      form.get('username')?.markAsTouched();

      const errorMessage = component.getFieldError(form, 'username');

      expect(errorMessage).toBe('username is required');
    });

    it('should mark form as touched when invalid', () => {
      spyOn(component, 'markFormGroupTouched' as any);

      component.authForm.patchValue({ username: '', password: '' });
      component.onLogin();

      expect((component as any).markFormGroupTouched).toHaveBeenCalledWith(component.authForm);
    });
  });

  describe('ngOnInit', () => {
    it('should load configurations when authenticated on init', () => {
      mockingService.isAuthenticated.and.returnValue(true);
      mockingService.getMockConfigurations.and.returnValue(of({ data: [], status: 'success' }));

      component.ngOnInit();

      expect(mockingService.getMockConfigurations).toHaveBeenCalled();
    });

    it('should subscribe to auth state changes', () => {
      mockingService.getMockConfigurations.and.returnValue(of({ data: [], status: 'success' }));

      component.ngOnInit();
      
      // Simulate authentication
      authSubject.next({ authenticated: true, token: 'test' });

      expect(mockingService.getMockConfigurations).toHaveBeenCalled();
    });
  });
});