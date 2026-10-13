import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TripDataService } from '../services/trip-data';

@Component({
  selector: 'app-trip-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './trip-edit.html',
  styleUrl: './trip-edit.css'
})
export class TripEditComponent implements OnInit {

  formData: any = {};
  message = '';
  tripId = '';

  constructor(
    private route: ActivatedRoute,
    private tripService: TripDataService
  ) {}

  ngOnInit(): void {
    this.tripId = this.route.snapshot.paramMap.get('tripId') || '';

    this.tripService.getTrip(this.tripId).subscribe({
      next: (trip) => {
        this.formData = trip;
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  onSubmit(): void {
    this.tripService.updateTrip(this.tripId, this.formData).subscribe({
      next: (result) => {
        console.log('Trip updated:', result);
        this.message = 'Trip updated successfully!';

        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      },
      error: (err) => {
        console.error(err);
        this.message = 'Error updating trip.';
      }
    });
  }
}