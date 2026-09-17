import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TablerIconsModule } from 'angular-tabler-icons';
import { IconX } from 'angular-tabler-icons/icons';

import { DeleteRoleDialogComponent } from './delete-role-dialog.component';
import { RoleService } from '../../../services/role.service';

describe('DeleteRoleDialogComponent', () => {
  let component: DeleteRoleDialogComponent;
  let fixture: ComponentFixture<DeleteRoleDialogComponent>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<DeleteRoleDialogComponent>>;

  const role = { id: 1, name: 'Manager' };

  beforeEach(async () => {
    dialogRef = jasmine.createSpyObj<MatDialogRef<DeleteRoleDialogComponent>>('MatDialogRef', [
      'close',
    ]);

    await TestBed.configureTestingModule({
      // The component renders <i-tabler name="x">, which needs a picked registry.
      imports: [DeleteRoleDialogComponent, TablerIconsModule.pick({ IconX })],
      providers: [
        provideNoopAnimations(),
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { role } },
        { provide: RoleService, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteRoleDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('closes with the role to delete on confirm', () => {
    component.confirmDelete();

    expect(dialogRef.close).toHaveBeenCalledWith({
      event: 'ConfirmDelete',
      role: jasmine.objectContaining(role),
    });
  });

  it('closes without a role on cancel', () => {
    component.closeDialog();

    expect(dialogRef.close).toHaveBeenCalledWith({ event: 'Cancel' });
  });
});
