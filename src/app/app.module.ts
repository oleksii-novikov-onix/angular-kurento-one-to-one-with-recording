import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {NgModule} from '@angular/core';
import {CustomMaterialModule} from './core/material.module';
import {RoutingModule} from './core/routing.module';
import {FormsModule} from '@angular/forms';
import {AppComponent} from './app.component';
import {LoginComponent} from './login/login.component';
import {CallComponent} from './call/call.component';
import {HttpClientModule} from '@angular/common/http';
import {RxStompService} from '@stomp/ng2-stompjs';
import {MatDividerModule, MatGridListModule, MatRadioModule} from '@angular/material';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    CallComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    CustomMaterialModule,
    FormsModule,
    RoutingModule,
    HttpClientModule,
    MatDividerModule,
    MatGridListModule,
    MatRadioModule
  ],
  providers: [
    RxStompService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
