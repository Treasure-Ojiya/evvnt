import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';
import { EventListItem } from '../../../app-model/model';
import { ExploreService } from '../../../core/services/explore-service/explore-service';

const MAX_SLIDES = 8;

@Component({
  selector: 'app-feature-card',
  imports: [RouterLink, DatePipe],
  templateUrl: './feature-card.html',
  styleUrl: './feature-card.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class FeatureCard {
  private exploreService = inject(ExploreService);

  events = signal<EventListItem[]>([]);
  isLoading = signal(true);

  // True when there are featured events, false when we fall back to the
  // next upcoming events so the home page is never empty.
  showingFeatured = signal(true);

  private swiperStarted = false;

  // The slider only exists once there are events, so it is set up when the
  // element appears, not in ngAfterViewInit.
  @ViewChild('swiper')
  set swiperRef(ref: ElementRef | undefined) {
    if (ref && !this.swiperStarted) {
      this.swiperStarted = true;
      this.startSwiper(ref.nativeElement);
    }
  }

  constructor() {
    this.loadEvents();
  }

  private loadEvents(): void {
    this.exploreService
      .getEvents({ featured: true })
      .pipe(
        switchMap((featured) =>
          featured.length > 0
            ? of({ list: featured, isFeatured: true })
            : this.exploreService
                .getEvents({})
                .pipe(map((all) => ({ list: all, isFeatured: false }))),
        ),
        catchError((error) => {
          console.error('Failed to load home events:', error);
          return of({ list: [] as EventListItem[], isFeatured: false });
        }),
      )
      .subscribe(({ list, isFeatured }) => {
        this.showingFeatured.set(isFeatured);
        this.events.set(this.upcoming(list));
        this.isLoading.set(false);
      });
  }

  // Events that have not happened yet, soonest first.
  private upcoming(list: EventListItem[]): EventListItem[] {
    const now = Date.now();

    return list
      .filter((e) => new Date(e.event_date).getTime() >= now)
      .sort((a, b) => a.event_date.localeCompare(b.event_date))
      .slice(0, MAX_SLIDES);
  }

  private startSwiper(
    swiperEl: HTMLElement & { initialize?: () => void },
  ): void {
    Object.assign(swiperEl, {
      breakpoints: {
        0: { slidesPerView: 1.5, spaceBetween: 16 },
        640: { slidesPerView: 2.5, spaceBetween: 18 },
        1024: { slidesPerView: 3, spaceBetween: 20 },
      },
    });

    // Wait a tick so the slides are in the DOM before Swiper reads them.
    setTimeout(() => swiperEl.initialize?.(), 0);
  }
}
