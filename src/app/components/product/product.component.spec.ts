import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductComponent } from './product.component';
import { ProductService } from '../../services/product/product.service';
import { CartService } from '../../services/cart/cart.service';
import { Product } from '../../interfaces/product';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../modal/modal.component';
import { HttpClientModule } from '@angular/common/http';


describe('ProductComponent', () => {
  let component: ProductComponent;
  let fixture: ComponentFixture<ProductComponent>;


  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule, ModalComponent, ProductComponent, HttpClientModule],
      providers: [],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should have initial modalMessage as empty and showModal as false', () => {
    expect(component.modalMessage).toBe('');
    expect(component.showModal).toBeFalse();
  });

  it('should set modalMessage and showModal correctly after addToCart is called', () => {
    const testProduct: Product = {
      reference_number: 1,
      name: 'Test Product',
      description: 'Desc',
      price: 10,
      type: 'Zapatillas',
      stock: 1,
      on_sale: false,
      image_url: ''
    };

    component.addToCart(testProduct);

    expect(component.showModal).toBeTrue();
    expect(component.modalMessage).toBe('Producto añadido al carrito');
  });

  it('should show error modal if cartService.addToCart throws an error', () => {
    const testProduct: Product = {
      reference_number: 456,
      name: 'Error Product',
      description: 'Error desc',
      price: 20,
      type: 'Zapatillas',
      stock: 2,
      on_sale: false,
      image_url: ''
    };

    spyOn(component.cartService, 'addToCart').and.throwError('Error al agregar al carrito');

    component.addToCart(testProduct);

    expect(component.showModal).toBeTrue();

  });
});