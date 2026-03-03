import { Routes } from '@angular/router';
import { EventRegisterComponent } from './pages/event-register/event-register.component';
import { EventConfirmationComponent } from './pages/event-confirmation/event-confirmation.component';

export const PublicEventRoutes: Routes = [
  { path: ':slug', component: EventRegisterComponent },
  { path: ':slug/confirmation', component: EventConfirmationComponent },
];
