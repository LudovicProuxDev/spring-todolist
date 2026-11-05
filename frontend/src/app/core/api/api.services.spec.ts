import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CategoryService, TaskService, UserService } from './api.services';

describe('API services', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function expectCall(method: string, url: string, body?: unknown): void {
    const request = http.expectOne((r) => r.urlWithParams === url);
    expect(request.request.method).toBe(method);
    if (body !== undefined) {
      expect(request.request.body).toEqual(body);
    }
    request.flush(null);
  }

  describe('CategoryService', () => {
    it('should call the categories endpoints', () => {
      const service = TestBed.inject(CategoryService);
      const body = { label: 'Urgent', color: '#FF0000' };

      service.findAll().subscribe();
      expectCall('GET', '/api/categories');
      service.create(body).subscribe();
      expectCall('POST', '/api/categories', body);
      service.update(3, body).subscribe();
      expectCall('PUT', '/api/categories/3', body);
      service.delete(3).subscribe();
      expectCall('DELETE', '/api/categories/3');
    });
  });

  describe('TaskService', () => {
    it('should list all tasks without filter', () => {
      TestBed.inject(TaskService).findAll().subscribe();
      expectCall('GET', '/api/tasks');
    });

    it('should filter tasks by category', () => {
      TestBed.inject(TaskService).findAll(2).subscribe();
      expectCall('GET', '/api/tasks?categoryId=2');
    });

    it('should call the write endpoints', () => {
      const service = TestBed.inject(TaskService);
      const body = { description: 'Courses', categoryId: null };

      service.create(body).subscribe();
      expectCall('POST', '/api/tasks', body);
      service.update(5, body).subscribe();
      expectCall('PUT', '/api/tasks/5', body);
      service.delete(5).subscribe();
      expectCall('DELETE', '/api/tasks/5');
    });
  });

  describe('UserService', () => {
    it('should call the users endpoints', () => {
      const service = TestBed.inject(UserService);
      const createBody = { username: 'jdupont', password: 'secret123', email: 'j@example.com', firstname: null, lastname: null };
      const updateBody = { roles: ['ROLE_USER' as const] };

      service.me().subscribe();
      expectCall('GET', '/api/users/me');
      service.findAll().subscribe();
      expectCall('GET', '/api/users');
      service.create(createBody).subscribe();
      expectCall('POST', '/api/users', createBody);
      service.update(7, updateBody).subscribe();
      expectCall('PUT', '/api/users/7', updateBody);
      service.delete(7).subscribe();
      expectCall('DELETE', '/api/users/7');
    });
  });
});
