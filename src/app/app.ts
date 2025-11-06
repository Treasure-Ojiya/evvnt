import { Component, signal } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { Navbar } from './shared/components/navbar/navbar';
import { Footer } from './shared/components/footer/footer';
// import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('event');

  // constructor(library: FaIconLibrary) {
  //   library.addIcons(faUser, faCoffee);
  // }

  // showNavbar = true;

  // constructor(private router: Router) {
  //   this.router.events
  //     .pipe(filter((event) => event instanceof NavigationEnd))
  //     .subscribe((event: NavigationEnd) => {
  //       // hide navbar on login and register pages
  //       const noNavbarRoutes = ['/authentication'];
  //       this.showNavbar = !noNavbarRoutes.includes(event.url);
  //     });
  // }
}
