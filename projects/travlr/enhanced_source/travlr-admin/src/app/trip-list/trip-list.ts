import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { TripDataService } from '../services/trip-data';
import { TripCardComponent } from '../trip-card/trip-card';
import { TripAddComponent } from '../trip-add/trip-add';

@Component({
  selector: 'app-trip-list',
  standalone: true,
  imports: [CommonModule, TripCardComponent, TripAddComponent],
  templateUrl: './trip-list.html',
  styleUrl: './trip-list.css'
})
export class TripListComponent {
  trips$: Observable<any[]>;

  constructor(private tripService: TripDataService) {
    this.trips$ = this.tripService.getTrips();
  }
}