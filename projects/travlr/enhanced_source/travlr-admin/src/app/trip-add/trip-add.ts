import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TripDataService } from '../services/trip-data';

@Component({
  selector: 'app-trip-add',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './trip-add.html',
  styleUrl: './trip-add.css'
})
export class TripAddComponent {
  formData = {
    code: '',
    name: '',
    length: '',
    start: '',
    resort: '',
    perPerson: '',
    image: '',
    description: ''
  };

  message = '';

  constructor(private tripService: TripDataService) {}

  onSubmit(): void {
    this.tripService.addTrip(this.formData).subscribe({
      next: (result) => {
        console.log('Trip added:', result);
        this.message = 'Trip added successfully!';

        this.formData = {
          code: '',
          name: '',
          length: '',
          start: '',
          resort: '',
          perPerson: '',
          image: '',
          description: ''
        };

        setTimeout(() => {
          window.location.reload();
        }, 1000);
      },
      error: (err) => {
        console.error('Add trip error:', err);
        this.message = 'Error adding trip.';
      }
    });
  }
}