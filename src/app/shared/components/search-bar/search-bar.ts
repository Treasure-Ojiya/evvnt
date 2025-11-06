import { Component } from '@angular/core';

@Component({
  selector: 'app-search-bar',
  templateUrl: './search-bar.html',
  styleUrl: './search-bar.css',
})
export class SearchBar {
  searchLocation = '';
  showDropdown = false;
  filteredLocations: { state: string; city: string }[] = [];

  locations = [
    { state: 'Lagos', city: 'Ikeja' },
    { state: 'Lagos', city: 'Lekki' },
    { state: 'Abuja', city: 'Garki' },
    { state: 'Oyo', city: 'Ibadan' },
    { state: 'Rivers', city: 'Port Harcourt' },
  ];

  filterLocations() {
    const query = this.searchLocation.toLowerCase();
    this.filteredLocations = this.locations.filter(
      (l) =>
        l.state.toLowerCase().includes(query) ||
        l.city.toLowerCase().includes(query)
    );
    this.showDropdown = this.filteredLocations.length > 0;
  }

  selectLocation(loc: { state: string; city: string }) {
    this.searchLocation = `${loc.state}, ${loc.city}`;
    this.showDropdown = false;
  }

  hideDropdown() {
    setTimeout(() => (this.showDropdown = false), 100);
  }
}
