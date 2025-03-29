import { Injectable, signal, effect } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Cart } from "../../interfaces/cart";
import { Product } from "../../interfaces/product";
import { forkJoin } from "rxjs";
import { AuthService } from "../auth/auth.service";

interface CartResponse {
  cart: Cart[];
}

// Interfaz para manejar la respuesta anidada de la API
interface ProductResponse {
  product: Product;
}

export interface CartItem extends Cart {
  product: Product; 
}

@Injectable({
  providedIn: "root",
})
export class CartService {
  cartSignal = signal<CartItem[]>([]);
  loadingSignal = signal<boolean>(false);
  errorSignal = signal<string | null>(null);

  userId: number | null = null;
  private apiUrl = "http://localhost:3000/api";

  constructor(private http: HttpClient, private authService: AuthService) {
    this.fetchCart();
    effect (() => {
      const userIdSignal = this.authService.getUserId();
      this.userId = userIdSignal;
    }
    );
  }

  fetchCart(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
  
    const userId = this.authService.getUserId();
  
    if (!userId || isNaN(Number(userId))) {
      console.error("Error: userId no es válido");
      this.errorSignal.set("Error: Usuario no autenticado");
      this.loadingSignal.set(false);
      return;
    }
  
    const headers = {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'userId': `${userId}`
    };
  
    this.http.get<CartResponse>(`${this.apiUrl}/carrito`, { headers }).subscribe({
      next: (response) => {
        console.log("Respuesta de la API:", response);
        const cartItems = response.cart;
  
        if (cartItems.length === 0) {
          this.cartSignal.set([]);
          this.loadingSignal.set(false);
          return;
        }
  
        const productRequests = cartItems.map((cartItem) =>
          this.http.get<ProductResponse>(`${this.apiUrl}/products/${cartItem.product_id}`)
        );
  
        forkJoin(productRequests).subscribe({
          next: (productsResponse) => {
            const cartWithProducts = cartItems.map((cartItem, index) => ({
              ...cartItem,
              product: productsResponse[index].product,
            }));
            this.cartSignal.set(cartWithProducts);
            this.loadingSignal.set(false);
          },
          error: (err) => {
            console.error("Error al obtener productos:", err);
            this.errorSignal.set("Error al obtener productos");
            this.loadingSignal.set(false);
          },
        });
      },
      error: (err) => {
        console.error("Error al obtener el carrito:", err);
        this.errorSignal.set("Error al obtener el carrito");
        this.loadingSignal.set(false);
      },
    });
  }

  addToCart(product: any) {
    console.log("UserID al addtoCard" , this.userId)
    this.http.post(`${this.apiUrl}/carrito/${product.reference_number}`, { product_id: product.reference_number, user_id: this.userId }).subscribe({
      next: () => {
        this.fetchCart();
      }
    });
  }
  
  updateQuantity(item: CartItem, type: string): void {
    const newQuantity =
      type === "increase" ? Number(item.quantity) + 1 : Number(item.quantity) - 1;
  
    // Verificar que la nueva cantidad no exceda el stock disponible
    if (type === "increase" && newQuantity > item.product.stock) {
      console.warn(`No puedes añadir más de ${item.product.stock} unidades de este producto.`);
      return;
    }
  
    if (type === "decrease" && newQuantity < 1) {
      console.warn("No puedes tener menos de 1 unidad en el carrito.");
      return;
    }
  
    const userId = this.userId; // Obtener el userId del signal
  
    if (!userId) {
      console.error("Error: Usuario no autenticado.");
      return;
    }
  
    // Actualizar en el backend
    this.http.patch(`${this.apiUrl}/carrito/${item.id}`, {
      userId,
      product_id: item.product.reference_number,
      quantity: newQuantity,
    }).subscribe({
      next: () => {
        console.log(`Cantidad actualizada en el servidor: ${newQuantity}`);
  
        // Actualizar el carrito localmente
        const updatedCart = this.cartSignal().map((cartItem) =>
          cartItem.id === item.id ? { ...cartItem, quantity: newQuantity } : cartItem
        );
  
        this.cartSignal.set(updatedCart); // Actualizar el estado del carrito
      },
      error: (err) => {
        console.error("Error al actualizar la cantidad:", err);
      }
    });
  }
  
  removeFromCart(item: CartItem): void {
      this.http.delete(`${this.apiUrl}/carrito/${item.id}`).subscribe({
      next: () => {
        console.log(`Producto ${item.product.name} eliminado del carrito`);
        this.fetchCart();
      }
    });
  }

  buyCart(totalAmount: Number): void {
    this.http.post(`${this.apiUrl}/carrito/comprar`, { user_id: this.userId, totalAmount: totalAmount }).subscribe({
      next: () => {
        this.fetchCart();
      },
      error: (err) => {
        console.error("Error al comprar:", err);
      },
    });
  }
}