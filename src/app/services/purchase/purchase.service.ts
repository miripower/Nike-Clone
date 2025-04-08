// purchase.service.ts

import { Injectable, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Purchase } from "../../interfaces/purchase";
import { forkJoin } from "rxjs";
import { AuthService } from "../auth/auth.service";

interface PurchaseResponse {
  purchases: Purchase[];
}

interface ItemResponse {
  items: any[];
}

@Injectable({
  providedIn: "root",
})
export class PurchaseService {
  userId: number | null = null;
  purchasesSignal = signal<Purchase[]>([]);
  loadingSignal = signal<boolean>(false);
  errorSignal = signal<string | null>(null);
  private apiUrl = "http://localhost:3000/api";

  constructor(private http: HttpClient, private authService: AuthService) {}

  // Método para obtener las compras
  fetchPurchases(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
  
    const userId = this.authService.getUserId();
  
    const headers = {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'userId': `${userId}`
    };
  
    this.http.get<PurchaseResponse>(`${this.apiUrl}/compras`, { headers }).subscribe({
      next: (response) => {
        let purchases = response.purchases;
  
        // Ordenar las compras por fecha descendente
        purchases = purchases.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  
        if (purchases.length === 0) {
          this.purchasesSignal.set([]);
          this.loadingSignal.set(false);
          return;
        }
  
        // Obtener los ítems de cada compra
        const itemRequests = purchases.map((purchase) =>
          this.http.get<ItemResponse>(`${this.apiUrl}/compras/${purchase.id}/items`, { headers }),
        );
  
        // Esperar que todas las solicitudes de ítems se completen
        forkJoin(itemRequests).subscribe({
          next: (itemsResponses) => {
            const purchasesWithItems = purchases.map((purchase, index) => {
              const items = itemsResponses[index].items;
              return { ...purchase, items: items };
            });
  
            this.purchasesSignal.set(purchasesWithItems);
            this.loadingSignal.set(false);
          },
          error: (err) => {
            console.error("Error al obtener los ítems:", err);
            this.errorSignal.set("Error al obtener los ítems");
            this.loadingSignal.set(false);
          },
        });
      },
      error: (err) => {
        console.error("Error al obtener las compras:", err);
        this.errorSignal.set("Error al obtener las compras");
        this.loadingSignal.set(false);
      },
    });
  }
}