import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { CartService } from '../../services/cart/cart.service';
import { ProductService } from '../../services/product/product.service';
import { Product } from '../../interfaces/product';
import { ModalComponent } from '../modal/modal.component';
import { AuthService } from '../../services/auth/auth.service'; // Importa AuthService

@Component({
  selector: 'app-product',
  imports: [CommonModule, ModalComponent],
  templateUrl: './product.component.html',
  styleUrl: './product.component.css'
})
export class ProductComponent implements OnInit {
  modalMessage: string = "";
  showModal = false;

  constructor(
    public productService: ProductService,
    public cartService: CartService,
    public authService: AuthService
  ) { }

  ngOnInit() {
    this.productService.fetchProducts();
  }

  addToCart(product: Product) {
    try {
      this.cartService.addToCart(product);
    } catch (err: any) {
      this.modalMessage = err.message;
      this.showModal = true;
    }
    this.showModal = true;
    this.modalMessage = "Producto añadido al carrito";
  }

  isLoggedIn(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    return this.authService.isLoggedIn();
  }
}