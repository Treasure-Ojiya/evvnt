import {
  AfterViewInit,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-recommended',
  imports: [RouterLink],
  templateUrl: './recommended.html',
  styleUrl: './recommended.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Recommended implements AfterViewInit {
  @ViewChild('swiper') swiper!: ElementRef;

  events = [
    {
      id: 1,
      title: 'Lagos Music Festival',
      image: 'assets/hero-2.jpg',
      location: 'Lagos',
      date: 'Oct 12, 2026',
    },
    {
      id: 2,
      title: 'Creative Arts Night',
      image: 'assets/hero-1-1.jpg',
      location: 'Lagos',
      date: 'Oct 18, 2026',
    },
    {
      id: 3,
      title: 'Tech & Innovation Summit',
      image: 'assets/hero-1.jpg',
      location: 'Abuja',
      date: 'Oct 25, 2026',
    },
    {
      id: 4,
      title: 'Afrobeat Live',
      image: 'assets/hero-2.jpg',
      location: 'Lagos',
      date: 'Nov 2, 2026',
    },
    {
      id: 5,
      title: 'Cultural Extravaganza',
      image: 'assets/hero-1-1.jpg',
      location: 'Abuja',
      date: 'Nov 10, 2026',
    },
  ];

  ngAfterViewInit() {
    const swiperEl = this.swiper.nativeElement;

    Object.assign(swiperEl, {
      breakpoints: {
        0: {
          slidesPerView: 1,
          spaceBetween: 16,
        },
        640: {
          slidesPerView: 2,
          spaceBetween: 18,
        },
        1024: {
          slidesPerView: 3,
          spaceBetween: 20,
        },
      },
    });

    swiperEl.initialize();
  }
}
