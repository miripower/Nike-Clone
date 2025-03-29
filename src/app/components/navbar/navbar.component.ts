import { Component, signal, effect } from '@angular/core';
import { ProductService } from '../../services/product/product.service';
import { CommonModule } from '@angular/common';
import { Product } from '../../interfaces/product';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  role = signal<string | null>(null);
  filteredProducts: Product[] = [];
  username: string = '';

  constructor(private productService: ProductService, private authService: AuthService, private router: Router) {
    effect(() => {
      this.role.set(this.authService.getRole());
    }
    );
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  inputSearch(event: any): void {
    const searchTerm = event.target.value.trim();
    this.productService.setSearchTerm(searchTerm);
  
    if (searchTerm === '') {
      this.filteredProducts = []; 
    } else {
      this.updateFilteredProducts();
    }
  }

 goToProduct(): void {
    this.router.navigate(['/products']);
  }

  updateFilteredProducts(): void {
    this.filteredProducts = this.productService.getFilteredProducts()();
  }
}