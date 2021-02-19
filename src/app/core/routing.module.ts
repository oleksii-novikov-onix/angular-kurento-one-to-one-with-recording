import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {LoginComponent} from '../login/login.component';
import {CallComponent} from '../call/call.component';
import {LoginActivate} from '../services/login.activate';

const routes: Routes = [
  {path: 'login', component: LoginComponent},
  {path: 'call', component: CallComponent, canActivate: [LoginActivate]},
  {path: '', component: CallComponent, canActivate: [LoginActivate]}
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes)
  ],
  exports: [
    RouterModule
  ],
  declarations: []
})
export class RoutingModule {
}
