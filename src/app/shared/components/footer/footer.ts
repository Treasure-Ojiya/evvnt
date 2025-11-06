import { Component, inject, OnInit, EventEmitter, Output } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';
import { RouterLink } from '@angular/router';
import { ScrollService } from '../../../core/services/scroll-service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './footer.html',
  styleUrls: ['./footer.css'],
})
export class Footer implements OnInit {
  showFooter = true;

  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private scrollService = inject(ScrollService);

  onScroll(sectionId: string, event: Event) {
    event.preventDefault();
    this.scrollService.goToSection(sectionId); // 🔥 one-liner now
  }

  ngOnInit() {
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd
        )
      )
      .subscribe(() => {
        const currentRoute = this.getDeepestChild(this.activatedRoute);
        const hideLayout = currentRoute.snapshot.data['hideLayout'];

        this.showFooter = !hideLayout;
      });
  }

  // helper: find the deepest child route (useful for nested routes)
  private getDeepestChild(route: ActivatedRoute): ActivatedRoute {
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route;
  }
}
