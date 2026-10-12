import {
  AfterViewInit,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-view-spaces',
  imports: [RouterLink],
  templateUrl: './view-spaces.html',
  styleUrl: './view-spaces.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ViewSpaces implements AfterViewInit {
  @ViewChild('swiper') swiper!: ElementRef;

  spaces = [
    {
      id: 1,
      name: 'Landmark Event Hall',
      image: 'assets/hero-2.jpg',
      location: 'Lagos',
      capacity: 500,
    },

    {
      id: 2,
      name: 'Creative Arts Center',
      image: 'assets/hero-1-1.jpg',
      location: 'Lagos',
      capacity: 500,
    },

    {
      id: 3,
      name: 'Tech & Innovation Hub',
      image: 'assets/hero-1.jpg',
      location: 'Abuja',
      capacity: 500,
    },

    {
      id: 4,
      name: 'National Arts Theater',
      image: 'assets/hero-2.jpg',
      location: 'Lagos',
      capacity: 500,
    },

    {
      id: 5,
      name: 'Victor Uwaifo Creative Hub',
      image: 'assets/hero-1-1.jpg',
      location: 'Benin City',
      capacity: 500,
    },

    {
      id: 6,
      name: 'Wole Soyinka Cultural Center',
      image: 'assets/hero-1.jpg',
      location: 'Lagos',
      capacity: 500,
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
