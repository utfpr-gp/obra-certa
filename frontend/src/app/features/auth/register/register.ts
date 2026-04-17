import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  constructor(private location: Location, private router: Router) {}

  goBack(): void {
    this.location.back();
  }

  navigateToHome(): void {
    this.router.navigate(['/home']);
  }
}
