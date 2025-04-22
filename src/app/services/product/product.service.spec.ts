import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProductService } from './product.service';
import { Product } from '../../interfaces/product';

describe('ProductService', () => {
  let service: ProductService;
  let httpMock: HttpTestingController;

  const mockProducts: Product[] = [
    {
      reference_number: 1,
      name: 'Producto 1',
      description: 'Zapatillas de deporte',
      price: 200,
      type: 'Zapatillas',
      stock: 3,
      on_sale: false,
      image_url: ''
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProductService]
    });

    service = TestBed.inject(ProductService);
    httpMock = TestBed.inject(HttpTestingController);

    const req = httpMock.expectOne('http://localhost:3000/api/products');
    req.flush({ products: [] });
  });

  afterEach(() => {
    httpMock.verify();
  });

  // Test: Fetch products
  it('should fetch products and update signal', () => {
    service.fetchProducts();

    const req = httpMock.expectOne('http://localhost:3000/api/products');
    expect(req.request.method).toBe('GET');

    req.flush({ products: mockProducts });

    expect(service.productsSignal()).toEqual(mockProducts);
    expect(service.loading()).toBeFalse();
  });

  // Test: Handle error on fetchProducts
  it('should handle error on fetchProducts', () => {
    service.fetchProducts();

    const req = httpMock.expectOne('http://localhost:3000/api/products');
    req.flush('Error', { status: 500, statusText: 'Server Error' });

    expect(service.error()).toBe('Error al cargar los productos');
    expect(service.loading()).toBeFalse();
  });

  // Test: Create a product
  it('should create a product and update signal', () => {
    const newProduct: Product = {
      reference_number: 2,
      name: 'Nuevo',
      description: '',
      price: 25,
      type: 'Gorra',
      stock: 10,
      on_sale: true,
      image_url: ''
    };

    service.createProduct(newProduct);

    const req = httpMock.expectOne('http://localhost:3000/api/products');
    expect(req.request.method).toBe('POST');

    req.flush({ message: 'Creado', product: newProduct });

    expect(service.productsSignal()).toContain(newProduct);
    expect(service.currentProduct()).toEqual(newProduct);
    expect(service.loading()).toBeFalse();
  });

  // Test: Handle error on createProduct
  it('should handle error when createProduct fails', () => {
    const newProduct: Product = {
      reference_number: 2,
      name: 'Nuevo',
      description: '',
      price: 25,
      type: 'Gorra',
      stock: 10,
      on_sale: true,
      image_url: ''
    };

    service.createProduct(newProduct);

    const req = httpMock.expectOne('http://localhost:3000/api/products');
    req.flush('Error', { status: 500, statusText: 'Server Error' });

    expect(service.error()).toBe('Error al crear el producto');
    expect(service.loading()).toBeFalse();
  });

  // Test: Add product locally if API fails
  it('should add product locally if API fails in addProduct()', () => {
    const backupProduct: Product = {
      reference_number: 5,
      name: 'Backup',
      description: 'Backup product',
      price: 100,
      type: 'Zapatillas',
      stock: 5,
      on_sale: false,
      image_url: ''
    };

    service.addProduct(backupProduct);

    const req = httpMock.expectOne('http://localhost:3000/api/products');
    req.flush('Error', { status: 500, statusText: 'Fail' });

    expect(service.productsSignal()).toContain(backupProduct);
    expect(service.loading()).toBeFalse();
  });

  // Test: Delete product
  it('should delete product from signal when deleteProduct succeeds', () => {
    service.productsSignal.set(mockProducts);

    service.deleteProduct(1);

    const req = httpMock.expectOne('http://localhost:3000/api/products/1');
    req.flush({ message: 'Deleted' });

    expect(service.productsSignal().length).toBe(0);
  });

  // Test: Handle error on deleteProduct
  it('should handle error when deleteProduct fails', async () => {
    service.productsSignal.set(mockProducts);

    const promise = service.deleteProduct(1);

    const req = httpMock.expectOne('http://localhost:3000/api/products/1');
    req.flush('Error', { status: 500, statusText: 'Server Error' });

    await expectAsync(promise).toBeRejected();
    expect(service.error()).toBe('Error al eliminar el producto');
    expect(service.productsSignal().length).toBe(1); // El producto no debe eliminarse
  });

  // Test: Get product by reference number from API
  it('should get product by reference number from API', async () => {
    const product: Product = mockProducts[0];

    const promise = service.getProductByReferenceNumber(1);

    const req = httpMock.expectOne('http://localhost:3000/api/products/1');
    req.flush(product);

    const result = await promise;
    expect(result).toEqual(product);
    expect(service.currentProduct()).toEqual(product);
  });

  // Test: Get product by reference number from local data if API fails
  it('should get product by reference number from local data if API fails', async () => {
    service.productsSignal.set(mockProducts);

    const promise = service.getProductByReferenceNumber(1);

    const req = httpMock.expectOne('http://localhost:3000/api/products/1');
    req.flush('Error', { status: 500, statusText: 'Fail' });

    const result = await promise;
    expect(result).toEqual(mockProducts[0]);
  });

  // Test: Update product
  it('should update product and update signal', async () => {
    service.productsSignal.set(mockProducts);

    const updatedProduct: Product = {
      ...mockProducts[0],
      name: 'Producto Actualizado',
      price: 300
    };

    const promise = service.updateProduct(1, { name: 'Producto Actualizado', price: 300 });

    const req = httpMock.expectOne('http://localhost:3000/api/products/1');
    req.flush({ message: 'Actualizado', product: updatedProduct });

    await promise;

    expect(service.productsSignal()[0].name).toBe('Producto Actualizado');
    expect(service.productsSignal()[0].price).toBe(300);
  });

  // Test: Filter products by search term
  it('should filter products by search term', () => {
    service.productsSignal.set(mockProducts);

    service.setSearchTerm('Producto 1');
    const filteredProducts = service.getFilteredProducts()();

    expect(filteredProducts.length).toBe(1);
    expect(filteredProducts[0].name).toBe('Producto 1');
  });
});