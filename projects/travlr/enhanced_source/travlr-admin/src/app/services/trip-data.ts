import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TripDataService {
  private apiURL = 'http://localhost:3000/api/trips';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('travlr-token');

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  public getTrips(): Observable<any[]> {
    return this.http.get<any[]>(this.apiURL);
  }

  public getTrip(tripId: string): Observable<any> {
    return this.http.get(`${this.apiURL}/${tripId}`);
  }

  public addTrip(trip: any): Observable<any> {
    return this.http.post(this.apiURL, trip, {
      headers: this.getAuthHeaders()
    });
  }

  public updateTrip(tripId: string, trip: any): Observable<any> {
    return this.http.put(`${this.apiURL}/${tripId}`, trip, {
      headers: this.getAuthHeaders()
    });
  }

  public deleteTrip(tripId: string): Observable<any> {
    return this.http.delete(`${this.apiURL}/${tripId}`, {
      headers: this.getAuthHeaders()
    });
  }
}