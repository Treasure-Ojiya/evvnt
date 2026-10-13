import { Component, inject, signal } from '@angular/core';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterOutlet,
} from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { Navbar } from './shared/components/navbar/navbar';
import { Footer } from './shared/components/footer/footer';
import { ToastMessage } from './shared/components/toast-message/toast-message';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer, ToastMessage],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('event');

  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  // Routes opt out with `data: { hideFooter: true }`. Routes that already
  // use `hideLayout` (auth, organizer, provider) never show the footer.
  protected readonly showFooter = signal(true);

  constructor() {
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd,
        ),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        let route = this.activatedRoute;
        while (route.firstChild) {
          route = route.firstChild;
        }

        const data = route.snapshot.data;
        this.showFooter.set(!data['hideFooter'] && !data['hideLayout']);
      });
  }
}
