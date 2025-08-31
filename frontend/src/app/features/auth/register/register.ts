import { Component } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-register',
  imports: [],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  constructor(private location: Location) {}

  goBack(): void {
    this.location.back();
  }
}
