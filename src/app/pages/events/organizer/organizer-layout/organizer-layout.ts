import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
  Router,
  RouterLink,
  RouterOutlet,
  RouterLinkActive,
} from '@angular/router';
import { UserService } from '../../../../core/services/user-service/user-service';
import { AuthService } from '../../../../core/services/auth-service/auth-service';

@Component({
  selector: 'app-organizer-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLinkActive, RouterLink, CommonModule],
  templateUrl: './organizer-layout.html',
  styleUrl: './organizer-layout.css',
})
export class OrganizerLayout implements OnInit {
  constructor(private userService: UserService) {}
  private authService = inject(AuthService);
  private router = inject(Router);

  isCollapsed = false;
  mobileMenuOpen = false;
  user = '';

  navItems = [
    { label: 'Home', link: '/home', icon: 'assets/icons/home.svg' },
    {
      label: 'Dashboard',
      link: 'dashboard',
      icon: 'assets/icons/dashboard.svg',
    },
    {
      label: 'Create Event',
      link: 'create-event',
      icon: 'assets/icons/create.svg',
    },
    {
      label: 'Manage Events',
      link: 'manage-events',
      icon: 'assets/icons/manage.svg',
    },
    { label: 'Orders', link: 'orders', icon: 'assets/icons/order.svg' },
    { label: 'Finance', link: 'finance', icon: 'assets/icons/finance.svg' },
    {
      label: 'Settings',
      link: 'setting',
      icon: 'assets/icons/settings-event.svg',
    },
  ];

  ngOnInit(): void {
    this.getCurrentUser();
  }

  getCurrentUser() {
    return this.userService.getUser().subscribe(
      (user) => {
        this.user = user.first_name;
      },
      (error) => {
        console.error('Error fetching user details:', error);
      },
    );
  }

  logout(): void {
    this.authService.logoutUser().subscribe({
      next: () => {
        this.router.navigate(['/auth/authentication']);
      },
      error: (error) => {
        console.error('Logout failed:', error);
        this.router.navigate(['/auth/authentication']);
      },
    });
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }
}
