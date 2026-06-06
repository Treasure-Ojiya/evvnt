import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-bar',
  imports: [FormsModule],
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
    { state: 'Edo', city: 'Auchi' },
    { state: 'Abuja', city: 'Wuse' },
    { state: 'Delta', city: 'Warri' },
    { state: 'Ebonyi', city: 'Abakaliki' },
  ];

  // filterLocations() {
  //   const query = this.searchLocation.toLowerCase();
  //   this.filteredLocations = this.locations.filter(
  //     (l) =>
  //       l.state.toLowerCase().includes(query) ||
  //       l.city.toLowerCase().includes(query)
  //   );
  //   this.showDropdown = this.filteredLocations.length > 0;
  // }

  filterLocations() {
    const query = this.searchLocation.toLowerCase();

    // If empty input → clear list + hide dropdown
    if (!query.trim()) {
      this.filteredLocations = [];
      this.showDropdown = false;
      return;
    }

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
