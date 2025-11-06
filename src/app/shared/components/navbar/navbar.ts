import { Component, inject, HostListener, OnInit } from '@angular/core';
import {
  Router,
  NavigationEnd,
  RouterLink,
  ActivatedRoute,
} from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
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
  showNavbar = true; // ✅ new: control navbar visibility

  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  // private authService = inject(AuthService);

  ngOnInit() {
    // ✅ Detect route changes
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd
        )
      )
      .subscribe((event: NavigationEnd) => {
        // Detect if on home page
        this.isHomePage =
          event.urlAfterRedirects === '/' ||
          event.urlAfterRedirects === '/home';

        // ✅ Detect if current route should hide layout
        const currentRoute = this.getDeepestChild(this.activatedRoute);
        const hideLayout = currentRoute.snapshot.data['hideLayout'];
        this.showNavbar = !hideLayout;
      });

    // Subscribe to login status (when AuthService is connected)
    // this.authService.isLoggedIn$.subscribe((status) => {
    //   this.isLoggedIn = status;
    // });
  }

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

  logout() {
    // this.authService.logout();
    this.isLoggedIn = false;
    this.router.navigate(['/home']);
  }

  // ✅ Hamburger toggle
  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu() {
    this.menuOpen = false;
  }

  // ✅ Profile dropdown
  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.showDropdown = !this.showDropdown;
  }

  closeDropdown() {
    this.showDropdown = false;
  }

  // ✅ Close menu & dropdown on outside click
  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    const target = event.target as HTMLElement;
    const navbar = document.querySelector('.navbar-container');
    if (navbar && !navbar.contains(target)) {
      this.menuOpen = false;
      this.showDropdown = false;
    }
  }
}
