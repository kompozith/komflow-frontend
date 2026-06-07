import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatDialog, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-logout',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatButtonModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './logout.component.html',
  styleUrl: './logout.component.scss'
})
export class LogoutComponent {
  dialog = inject(MatDialog);
  dialogRef = inject<MatDialogRef<LogoutComponent>>(MatDialogRef);


  private authService = inject(AuthService);

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}
  
  logout(): void {  
    this.authService.logout();
  }
}
