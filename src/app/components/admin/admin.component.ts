import { Component } from "@angular/core";
import { FormGroup, Validators, FormControl, ReactiveFormsModule, AbstractControl, ValidationErrors } from "@angular/forms";
import { createClient } from "@supabase/supabase-js";
import { CommonModule } from '@angular/common';
import { ModalComponent } from "../../components/modal/modal.component";
import { ProductService } from "../../services/product/product.service";
import { Product } from "../../interfaces/product";
import { of } from 'rxjs';
import { catchError, debounceTime, switchMap } from "rxjs/operators";
import { Observable } from "rxjs";

@Component({
  selector: 'app-admin',
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent {
  constructor(private productService: ProductService) { }

  get ProductServicePublic() {
    return this.productService;
  }

  private supabase = createClient(
    "https://gaasfmgwkrjjjzfxsyao.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhYXNmbWd3a3Jqamp6ZnhzeWFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwMDI4MTUsImV4cCI6MjA1ODU3ODgxNX0.XerUzbNEePGFBOxoIJ3sz9clgcLdN8Z5SjitrwE-avo"
  );

  newProduct: Product = { reference_number: 1, name: "", price: 0, type: "", description: "", image_url: "", on_sale: false, stock: 0 };
  imageUrl: string | null | undefined = null;
  selectedFile!: File | null;
  Price: number = 0;
  formSubmitted = false;
  showModal = false;
  modalMessage: string = "";
  productTypes = ["Zapatillas", "Ropa", "Equipamiento", "Accesorios"];
  isEditMode = false;
  currentProductId: string | null = null;

  AdminForm = new FormGroup({
    ReferenceNumber: new FormControl(1, [Validators.required, Validators.min(1)]),
    Name: new FormControl("", [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(50),
    ], [this.nameValidator.bind(this)]),
    Description: new FormControl("", [
      Validators.required,
      Validators.minLength(10),
      Validators.maxLength(200)
    ]),
    Price: new FormControl(0, [
      Validators.required,
      Validators.min(0),
      Validators.max(10000)
    ]),
    Type: new FormControl("", [Validators.required]),
    OnSale: new FormControl(false),
    Stock: new FormControl(0, [Validators.required, Validators.min(0)]),
  });

  async onReferenceNumberChange(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const value = inputElement.value.trim(); // Eliminamos espacios extra
  
    try {
      const products = await this.productService.getProducts(); // Obtener productos
      const matchedProduct = products.find(product => product.reference_number === Number(value)); // Buscar coincidencia
  
      console.log("ReferenceNumber of all products:", products.map(p => p.reference_number));
      console.log("Mi input es:", value);
  
      if (matchedProduct) {
        // Si se encuentra un producto, configuramos el formulario en modo edición
        this.isEditMode = true;
        this.AdminForm.patchValue({
          ReferenceNumber: matchedProduct.reference_number,
          Name: matchedProduct.name,
          Price: matchedProduct.price,
          Type: matchedProduct.type,
          Description: matchedProduct.description,
          Stock: matchedProduct.stock,
          OnSale: matchedProduct.on_sale,
        });
        this.imageUrl = matchedProduct.image_url;
      } else {
        // Si no se encuentra un producto, configuramos el formulario en modo creación
        console.log("No se encontró ningún producto con ese número de referencia.");
        this.isEditMode = false;
        this.AdminForm.reset({
          ReferenceNumber: Number(value),
          Name: "",
          Price: 0,
          Type: "",
          Description: "",
          Stock: 0,
          OnSale: false,
        });
        this.imageUrl = null;
      }
    } catch (error) {
      console.error("Error obteniendo productos:", error);
    }
  }

  nameValidator(control: AbstractControl): Observable<ValidationErrors | null> {
    // Solo validamos el nombre si no estamos en modo edición
    if (this.isEditMode) {
      return of(null); // Sin validación si está en modo edición
    }

    return of(control.value).pipe(
      debounceTime(300),
      switchMap(async (name: string) => {
        if (!name) return null; // Skip validation if name is empty

        const products = await this.productService.getProducts();

        const nameExists = products.some(p => p.name === name);

        return nameExists ? { nameTaken: true } : null;
      }),
      catchError(() => of(null)) // Si ocurre algún error, no afecta a la validación
    );
  }

  async onSubmit() {
    this.formSubmitted = true;
  
    if (this.AdminForm.valid) {
      if (this.selectedFile) {
        await this.uploadImage();
      }
  
      const formData = {
        reference_number: this.AdminForm.value.ReferenceNumber ?? 0,
        name: this.AdminForm.value.Name ?? "",
        price: this.AdminForm.value.Price ?? 0,
        type: this.AdminForm.value.Type ?? "",
        description: this.AdminForm.value.Description ?? "",
        image_url: this.imageUrl ?? "null",
        on_sale: this.AdminForm.value.OnSale ?? false,
        stock: this.AdminForm.value.Stock ?? 0,
      };
  
      try {
        if (this.isEditMode && this.AdminForm.value.ReferenceNumber) {
          // Actualizar producto existente
          await this.productService.updateProduct(this.AdminForm.value.ReferenceNumber, formData);
          this.modalMessage = 'Producto actualizado con éxito';
        } else {
          // Crear nuevo producto
          await this.productService.createProduct(formData);
          this.modalMessage = 'Producto agregado con éxito';
        }
  
        this.showModal = true;
  
        // Restablecer el formulario
        this.AdminForm.reset();
        this.imageUrl = null;
        this.selectedFile = null;
        this.isEditMode = false;
  
        Object.values(this.AdminForm.controls).forEach((control) => {
          control.markAsPristine();
          control.markAsUntouched();
        });
        this.formSubmitted = false;
      } catch (error) {
        console.error("Error al enviar el formulario:", error);
        this.modalMessage = "Error al enviar el formulario";
        this.showModal = true;
      }
    } else {
      console.log("Error en el formulario", this.AdminForm);
      this.markFormGroupTouched(this.AdminForm);
    }
  }

  markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  shouldShowError(controlName: string): boolean {
    const control = this.AdminForm.get(controlName);
    return !!(control && control.invalid && (control.touched || control.dirty || this.formSubmitted));
  }

  async onImageChange(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      alert("Formato de imagen no válido. Solo se permiten JPG y PNG.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.imageUrl = e.target.result;
    };
    reader.readAsDataURL(file);

    this.selectedFile = file;
  }

  async uploadImage() {
    if (!this.selectedFile) {
      alert("Por favor, selecciona una imagen antes de enviar el formulario.");
      return;
    }
  
    try {
      const fileExt = this.selectedFile.name.split('.').pop(); // Obtener la extensión del archivo
      const fileName = `${Date.now()}.${fileExt}`; // Nombre único basado en la fecha actual
      const filePath = `products/${fileName}`; // Ruta de almacenamiento en Supabase
  
      const { data, error } = await this.supabase.storage
        .from("v1") // Asegúrate de que "v1" es el bucket correcto
        .upload(filePath, this.selectedFile, { upsert: true });
  
      if (error) throw error;
  
      // Generar la URL pública de la imagen
      const { data: publicURLData } = this.supabase.storage
        .from("v1")
        .getPublicUrl(filePath);
  
      if (!publicURLData.publicUrl) {
        throw new Error("No se pudo obtener la URL pública de la imagen.");
      }
  
      this.imageUrl = publicURLData.publicUrl;
  
      console.log("Imagen subida con éxito:", this.imageUrl);
    } catch (error) {
      console.error("Error al subir la imagen:", error);
    }
  }
  

  deleteProduct() {
    const referenceNumber = this.AdminForm.value.ReferenceNumber;
    const referenceNumberAsNumber = Number(referenceNumber);
  
    if (!isNaN(referenceNumberAsNumber)) {
      this.productService.deleteProduct(referenceNumberAsNumber).then(() => {
        this.modalMessage = 'Producto eliminado con éxito';
        this.showModal = true;
  
        // Restablecer el formulario después de eliminar
        this.AdminForm.reset();
        this.imageUrl = null;
        this.selectedFile = null;
        this.isEditMode = false;
      }).catch((error) => {
        console.error('Error al eliminar el producto:', error);
        this.modalMessage = 'Error al eliminar el producto';
        this.showModal = true;
      });
    } else {
      console.error('ReferenceNumber no es válido');
      this.modalMessage = 'Número de referencia no válido';
      this.showModal = true;
    }
  }
}
