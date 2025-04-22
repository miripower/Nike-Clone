import { Injectable, signal, computed } from '@angular/core';
import { Product } from '../../interfaces/product';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';

interface ProductsResponse {
  products: Product[]
}

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  productsSignal = signal<Product[]>([])
  searchTermSignal = signal<string>("")
  loading = signal<boolean>(false)
  error = signal<string | null>(null)
  currentProduct = signal<Product | null>(null)

  private apiUrl = "http://localhost:3000/api"

  constructor(private http: HttpClient) {
    this.fetchProducts()
  }

  fetchProducts(): void {
    this.loading.set(true)
    this.error.set(null)

    this.http.get<ProductsResponse>(`${this.apiUrl}/products`).subscribe({
      next: (response) => {
        this.productsSignal.set(response.products)
        this.loading.set(false)
      },
      error: (err) => {
        console.error("Error al obtener productos:", err)
        this.error.set("Error al cargar los productos")
        this.loading.set(false)
      },
    })
  }

  getProducts(): Product[] {
    return this.productsSignal()
  }

  createProduct(product: Product): void {
    console.log("Creando producto:", product)
    this.loading.set(true)
    this.error.set(null)

    this.http.post<{ message: string; product: Product }>(`${this.apiUrl}/products`, product).subscribe({
      next: (response) => {
        this.productsSignal.update((products) => [...products, response.product])
        this.currentProduct.set(response.product)
        this.loading.set(false)
      },
      error: (err) => {
        this.error.set("Error al crear el producto")
        this.loading.set(false)
        console.error("Error al crear el producto:", err)
      },
    })
  }

  //versión sin API
  addProduct(product: Product): void {
    this.loading.set(true)
    this.error.set(null)

    this.http.post<{ message: string; product: Product }>(`${this.apiUrl}/products`, product).subscribe({
      next: (response) => {
        this.productsSignal.update((products) => [...products, response.product])
        this.loading.set(false)
      },
      error: (err) => {
        console.error("Error al crear el producto en API:", err)
        this.productsSignal.update((products) => [...products, product])
        this.loading.set(false)
      },
    })
  }

  // Actualizar un producto existente
  updateProduct(referenceNumber: number, updatedData: Partial<Product>): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.put<{ message: string; product: Product }>(`${this.apiUrl}/products/${referenceNumber}`, updatedData).subscribe({
        next: (response) => {
          this.productsSignal.update((products) =>
            products.map((p) => (p.reference_number === referenceNumber ? response.product : p))
          );
          this.loading.set(false);
          resolve();
        },
        error: (err) => {
          console.error(`Error al actualizar producto con referencia ${referenceNumber}:`, err);
          this.error.set("Error al actualizar el producto");
          this.loading.set(false);
          reject(err);
        },
      });
    });
  }

  // Eliminar un producto
  deleteProduct(referenceNumber: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.delete<{ message: string }>(`${this.apiUrl}/products/${referenceNumber}`).subscribe({
        next: () => {
          this.productsSignal.update((products) => products.filter((p) => p.reference_number !== referenceNumber));
          this.loading.set(false);
          resolve();
        },
        error: (err) => {
          console.error(`Error al eliminar producto con referencia ${referenceNumber}:`, err);
          this.error.set("Error al eliminar el producto");
          this.loading.set(false);
          reject(err);
        },
      });
    });
  }

  // Obtener un producto por número de referencia
  async getProductByReferenceNumber(referenceNumber: number): Promise<Product | null> {
    this.loading.set(true)
    this.error.set(null)

    try {
      // Primero intentamos obtener de la API
      const response = await this.http.get<Product>(`${this.apiUrl}/products/${referenceNumber}`).toPromise()
      this.loading.set(false)

      if (response) {
        this.currentProduct.set(response)
        return response
      }

      return null
    } catch (err) {
      console.error(`Error al obtener producto con referencia ${referenceNumber}:`, err)

      // Si falla la API, buscamos en la lista local
      const products = this.productsSignal()
      const product = products.find((p) => p.reference_number === referenceNumber) || null

      if (product) {
        this.currentProduct.set(product)
      }

      this.loading.set(false)
      return product
    }
  }

  // Filtrar productos por término de búsqueda
  getFilteredProducts() {
    return computed(() => {
      const searchTerm = this.searchTermSignal()
      if (!searchTerm) return this.productsSignal() // Si no hay término, devuelve todos los productos

      return this.productsSignal().filter((product) => product.name.toLowerCase().includes(searchTerm.toLowerCase()))
    })
  }

  // Establecer término de búsqueda
  setSearchTerm(searchTerm: string): void {
    this.searchTermSignal.set(searchTerm)
  }

  // Obtener headers con autenticación
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem("token")
    return new HttpHeaders({
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    })
  }
}
