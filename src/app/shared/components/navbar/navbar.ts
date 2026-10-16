import {
  Component,
  ElementRef,
  inject,
  HostListener,
  OnInit,
} from '@angular/core';
import {
  Router,
  NavigationEnd,
  RouterLink,
  ActivatedRoute,
} from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth-service/auth-service';
import { SearchBar } from '../search-bar/search-bar';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, CommonModule, SearchBar],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css'], // ✅ corrected "styleUrl" → "styleUrls"
})
export class Navbar implements OnInit {
  scrolled = false;
  isHomePage = false;
  menuOpen = false;
  isLoggedIn = false;
  showDropdown = false;
  showNavbar = true;
  createMenuOpen = false;
  searchOpen = false;

  private authService = inject(AuthService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private host = inject(ElementRef<HTMLElement>);

  ngOnInit() {
    this.authService.isLoggedIn$.subscribe((loggedIn) => {
      this.isLoggedIn = loggedIn;
    });

    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd,
        ),
      )
      .subscribe((event: NavigationEnd) => {
        this.isHomePage =
          event.urlAfterRedirects === '/' ||
          event.urlAfterRedirects === '/home';

        const currentRoute = this.getDeepestChild(this.activatedRoute);
        const hideLayout = currentRoute.snapshot.data['hideLayout'];

        this.showNavbar = !hideLayout;
      });
  }

  navLinks = [
    { label: 'Home', path: '/home' },
    { label: 'Explore', path: '/explore' },
    // { label: 'Spaces', path: '/spaces' },
    { label: 'Bookings', path: '/my-booking' },
  ];

  createMenuItems = [
    {
      path: '/events/organizer',
      icon: 'fa-ticket-alt',
      title: 'Host an Event',
      subtitle: 'Create and sell tickets',
    },
    {
      path: '/listings/provider',
      icon: 'fa-building',
      title: 'List a Space',
      subtitle: 'Rent out your venue',
    },
  ];

  // ✅ Helper to find deepest child route (important for nested routing)
  private getDeepestChild(route: ActivatedRoute): ActivatedRoute {
    while (route.firstChild) route = route.firstChild;
    return route;
  }

  // ✅ Add navbar shadow on scroll
  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.scrolled = window.scrollY > 80;
  }

  // ✅ Navigation actions
  goToAuth() {
    this.router.navigate(['auth/authentication']);
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

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  toggleSearch(event: Event): void {
    event.stopPropagation();
    this.searchOpen = !this.searchOpen;
    this.menuOpen = false;
    this.showDropdown = false;
    this.createMenuOpen = false;
  }

  closeSearch(): void {
    this.searchOpen = false;
  }

  closeMenu(): void {
    this.menuOpen = false;
    this.createMenuOpen = false;
    this.searchOpen = false;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.searchOpen = false;
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.showDropdown = !this.showDropdown;
    this.createMenuOpen = false;
    this.searchOpen = false;
  }

  toggleCreateMenu(event: Event): void {
    event.stopPropagation();
    this.createMenuOpen = !this.createMenuOpen;
    this.showDropdown = false;
    this.searchOpen = false;
  }
  closeDropdown() {
    this.showDropdown = false;
  }

  closeCreateMenu(): void {
    this.createMenuOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    const target = event.target as HTMLElement;
    if (!this.host.nativeElement.contains(target)) {
      this.menuOpen = false;
      this.showDropdown = false;
      this.createMenuOpen = false;
      this.searchOpen = false;
    }
  }
}
