import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  of,
  switchMap,
} from 'rxjs';
import { ExploreService } from '../../../core/services/explore-service/explore-service';

@Component({
  selector: 'app-search-bar',
  imports: [FormsModule],
  templateUrl: './search-bar.html',
  styleUrl: './search-bar.css',
})
export class SearchBar {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private exploreService = inject(ExploreService);

  searchText = '';
  showDropdown = false;
  eventSuggestions: string[] = [];

  private typed$ = new Subject<string>();

  constructor() {
    // Keep the box in sync with the URL, so on /explore it shows the current
    // search and clears when the search chip is removed.
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.searchText = params.get('search') ?? '';
    });

    // Event title suggestions, using the same /events/?search= endpoint.
    this.typed$
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((term) =>
          term.length < 2
            ? of<string[]>([])
            : this.exploreService.getEvents({ search: term }).pipe(
                map((events) =>
                  [...new Set(events.map((e) => e.title))].slice(0, 5),
                ),
                catchError(() => of<string[]>([])),
              ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((titles) => (this.eventSuggestions = titles));
  }

  onInput(): void {
    const term = this.searchText.trim();
    this.typed$.next(term);

    if (!term) {
      this.eventSuggestions = [];
      this.showDropdown = false;
      return;
    }

    this.showDropdown = true;
  }

  // Free text searches event titles.
  submit(): void {
    const text = this.searchText.trim();

    if (!text) {
      return;
    }

    this.go({ search: text });
  }

  selectEvent(title: string): void {
    this.searchText = title;
    this.go({ search: title });
  }

  hideDropdown(): void {
    setTimeout(() => (this.showDropdown = false), 100);
  }

  private go(queryParams: Record<string, string | null>): void {
    this.showDropdown = false;

    this.router.navigate(['/explore'], {
      queryParams,
      queryParamsHandling: 'merge',
    });
  }
}
