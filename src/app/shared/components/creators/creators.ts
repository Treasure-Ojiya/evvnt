import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-creators',
  imports: [RouterLink],
  templateUrl: './creators.html',
  styleUrl: './creators.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Creators implements AfterViewInit {
  @ViewChild('swiper') swiper!: ElementRef;

  creatorSlide = [
    {
      id: 1,
      name: 'The Lagos Social Club',
      username: '@lagossocialclub',
      image: 'assets/avatars/avatar-1.png',
      cover: 'assets/avatars/avatar-1.png',
      location: 'Lagos',
      eventCount: 18,
    },
    {
      id: 2,
      name: 'Afro Nights',
      username: '@afronights',
      image: 'assets/avatars/avatar-2.png',
      cover: 'assets/avatars/avatar-2.png',
      location: 'Lagos',
      eventCount: 12,
    },
    {
      id: 3,
      name: 'Creative House',
      username: '@creativehouse',
      image: 'assets/avatars/avatar-3.png',
      cover: 'assets/avatars/avatar-3.png',
      location: 'Abuja',
      eventCount: 9,
    },
    {
      id: 4,
      name: 'Tech Innovators',
      username: '@techinnovators',
      image: 'assets/avatars/avatar-4.png',
      cover: 'assets/avatars/avatar-4.png',
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
