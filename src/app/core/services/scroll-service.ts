import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class ScrollService {
  constructor(private router: Router) {}

  async goToSection(sectionId: string, targetRoute: string = '/home') {
    // if user is not on the target route, navigate there first
    if (this.router.url !== targetRoute) {
      await this.router.navigate([targetRoute]);
      // small delay to let the DOM render
      setTimeout(() => this.scrollTo(sectionId), 300);
    } else {
      this.scrollTo(sectionId);
    }
  }

  private scrollTo(sectionId: string) {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      el.focus?.();
    }
  }
}
