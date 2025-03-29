import { Component, Input, Output, EventEmitter } from '@angular/core'
import { CommonModule } from '@angular/common'

@Component({
  selector: 'app-modal',
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.css'
})
export class ModalComponent {
  @Input() show = false
  @Input() message: string = ""
  @Output() close = new EventEmitter<void>()

  closeModal(): void {
    this.close.emit()
  }
}
