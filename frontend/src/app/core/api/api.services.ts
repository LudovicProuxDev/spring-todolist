import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import {
  Category,
  CategoryRequest,
  Task,
  TaskRequest,
  User,
  UserCreateRequest,
  UserUpdateRequest,
} from '../models';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly url = '/api/categories';

  findAll(): Observable<Category[]> {
    return this.http.get<Category[]>(this.url);
  }

  create(request: CategoryRequest): Observable<Category> {
    return this.http.post<Category>(this.url, request);
  }

  update(id: number, request: CategoryRequest): Observable<Category> {
    return this.http.put<Category>(`${this.url}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly url = '/api/tasks';

  findAll(categoryId: number | null = null): Observable<Task[]> {
    const params = categoryId !== null ? new HttpParams().set('categoryId', categoryId) : undefined;
    return this.http.get<Task[]>(this.url, { params });
  }

  create(request: TaskRequest): Observable<Task> {
    return this.http.post<Task>(this.url, request);
  }

  update(id: number, request: TaskRequest): Observable<Task> {
    return this.http.put<Task>(`${this.url}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly url = '/api/users';

  me(): Observable<User> {
    return this.http.get<User>(`${this.url}/me`);
  }

  findAll(): Observable<User[]> {
    return this.http.get<User[]>(this.url);
  }

  create(request: UserCreateRequest): Observable<User> {
    return this.http.post<User>(this.url, request);
  }

  update(id: number, request: UserUpdateRequest): Observable<User> {
    return this.http.put<User>(`${this.url}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
