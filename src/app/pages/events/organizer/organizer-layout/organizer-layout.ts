import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-organizer-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLinkActive, RouterLink, CommonModule],
  templateUrl: './organizer-layout.html',
  styleUrl: './organizer-layout.css',
})
export class OrganizerLayout implements OnInit {
  ngOnInit(): void {
    console.log('OrganizerLayout initialized');
  }

  isCollapsed = false;

  createToggle() {
    this.isCollapsed = !this.isCollapsed;
  }
}
