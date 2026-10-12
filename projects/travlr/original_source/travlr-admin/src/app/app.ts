import { Component } from '@angular/core';
import { TripListComponent } from './trip-list/trip-list';
import { TripAddComponent } from './trip-add/trip-add';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {}