import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-providers-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  templateUrl: './providers-layout.html',
  styleUrl: './providers-layout.css',
})
export class ProvidersLayout {
  isCollapsed = false;

  createToggle() {
    this.isCollapsed = !this.isCollapsed;
  }
}
