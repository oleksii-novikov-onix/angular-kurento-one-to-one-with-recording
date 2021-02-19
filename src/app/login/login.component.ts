import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {AuthenticationService} from '../services/authentication.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  username: string;

  constructor(private router: Router, private authenticationService: AuthenticationService) {

  }

  ngOnInit() {

  }

  login(): void {
    if (this.username) {
      this.authenticationService.login(this.username).toPromise().then(() => {
        this.router.navigate(['call']);
      });
    }
  }
}

