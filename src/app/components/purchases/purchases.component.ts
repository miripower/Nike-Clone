// my-purchases.component.ts
import { Component, OnInit } from "@angular/core";
import { PurchaseService } from "../../services/purchase/purchase.service"; // Asegúrate de importar el servicio
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-purchases",
  templateUrl: "./purchases.component.html",
  styleUrls: ["./purchases.component.css"],
  imports: [CommonModule]
})
export class PurchasesComponent implements OnInit {

  error: string | null = null;
  loading: boolean = false;

  constructor(private purchaseService: PurchaseService) {}

  ngOnInit(): void {
    this.purchaseService.fetchPurchases();
    console.log(this.purchases);
  }

  getTotalItems(purchase: any): number {
    return purchase.items.length;
  }

  get purchases() {
    console.log(this.purchaseService.purchasesSignal());
    return this.purchaseService.purchasesSignal();
  }
}