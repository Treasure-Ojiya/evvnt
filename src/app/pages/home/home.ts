import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FeatureCard } from '../../shared/components/feature-card/feature-card/feature-card';
import { Payment } from '../../shared/components/payment/payment';
import { Serve } from '../../shared/components/serve/serve';
import { SearchBar } from '../../shared/components/search-bar/search-bar';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule, FeatureCard, Serve, SearchBar],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  backgroundImage = 'assets/hero-1-1.jpg';
  // backgroundSize = 'cover';
  // backgroundPosition = 'center';
}
