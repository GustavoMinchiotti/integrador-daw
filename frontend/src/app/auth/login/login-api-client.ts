import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoginApiClient {

  private url = '/api/v1/auth';

  constructor(private http: HttpClient) {}

  iniciarSesion(nombre: string, clave: string): Observable<any> {
    return this.http.post(this.url, {
      nombre,
      clave
    });
  }
}
