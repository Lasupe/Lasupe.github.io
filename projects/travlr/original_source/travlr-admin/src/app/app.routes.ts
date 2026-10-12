import { Routes } from '@angular/router';
import { TripListComponent } from './trip-list/trip-list';
import { TripEditComponent } from './trip-edit/trip-edit';
import { LoginComponent } from './login/login';

export const routes: Routes = [
  { path: '', component: TripListComponent },
  { path: 'edit/:tripId', component: TripEditComponent },
  { path: 'login', component: LoginComponent }
];