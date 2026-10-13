import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TripDataService } from '../services/trip-data';

@Component({
  selector: 'app-trip-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trip-card.html',
  styleUrl: './trip-card.css'
})
export class TripCardComponent {
  @Input() trip: any = null;

  constructor(private tripService: TripDataService) {}

  deleteTrip(tripId: string): void {
    this.tripService.deleteTrip(tripId).subscribe({
      next: () => {
        console.log('Trip deleted');
        window.location.reload();
      },
      error: (err) => {
        console.error('Delete trip error:', err);
      }
    });
  }
}