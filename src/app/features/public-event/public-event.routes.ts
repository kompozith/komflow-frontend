import { Routes } from '@angular/router';
import { EventRegisterComponent } from './pages/event-register/event-register.component';

export const PublicEventRoutes: Routes = [
  { path: ':slug', component: EventRegisterComponent },
];
