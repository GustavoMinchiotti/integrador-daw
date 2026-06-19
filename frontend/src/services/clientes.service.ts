import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ClientesService {

  private url = '/api/v1/clientes';

  constructor(private http: HttpClient) {}

  getClientes() {
    return this.http.get(this.url);
  }
}
