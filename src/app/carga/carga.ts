import { Component , OnInit} from '@angular/core';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-carga',
  imports: [
    RouterModule
  ],
  templateUrl: './carga.html',
  styleUrl: './carga.css'
})
export class Carga implements OnInit{

  constructor(private router: Router) {}

  ngOnInit(): void {
    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 1000);
  }
}
