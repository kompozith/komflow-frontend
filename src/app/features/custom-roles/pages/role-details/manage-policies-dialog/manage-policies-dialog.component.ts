import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { CustomRolesFacade } from '../../../services/custom-roles.facade';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Policy } from '../../../models/role';

interface DialogData {
  roleId: string;
  currentPolicies: Policy[];
}

@Component({
  selector: 'app-manage-policies-dialog',
  imports: [
    MaterialModule,
    TablerIconsModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './manage-policies-dialog.component.html',
  styleUrl: './manage-policies-dialog.component.scss',
})
export class ManagePoliciesDialogComponent implements OnInit {
  allPolicies: Policy[] = [];
  selectedPolicyIds = new Set<string>();
  isLoading = false;
  isSubmitting = false;
  selectedCategory = 'all';

  readonly searchControl = new FormControl('');

  constructor(
    public dialogRef: MatDialogRef<ManagePoliciesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private customRolesFacade: CustomRolesFacade,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.selectedPolicyIds = new Set(this.data.currentPolicies.map((policy) => policy.id));
    this.loadPolicies();
  }

  get selectedCount(): number {
    return this.selectedPolicyIds.size;
  }

  get categories(): string[] {
    return [
      'all',
      ...Array.from(new Set(this.allPolicies.map((policy) => policy.resource))).sort(),
    ];
  }

  get filteredPolicies(): Policy[] {
    const query = (this.searchControl.value || '').trim().toLowerCase();

    return this.allPolicies.filter((policy) => {
      const categoryMatch = this.selectedCategory === 'all' || policy.resource === this.selectedCategory;
      const queryMatch = !query
        || policy.id.toLowerCase().includes(query)
        || policy.name.toLowerCase().includes(query)
        || policy.description.toLowerCase().includes(query);

      return categoryMatch && queryMatch;
    });
  }

  loadPolicies(): void {
    this.isLoading = true;
    this.customRolesFacade.getPolicies().subscribe({
      next: (policies: Policy[]) => {
        this.allPolicies = policies || [];
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading policies:', error);
        this.snackBar.open('Error loading permissions', 'Close', { duration: 3000 });
        this.isLoading = false;
      },
    });
  }

  onCategoryChange(category: string): void {
    this.selectedCategory = category;
  }

  togglePolicy(policyId: string): void {
    if (this.selectedPolicyIds.has(policyId)) {
      this.selectedPolicyIds.delete(policyId);
      return;
    }

    this.selectedPolicyIds.add(policyId);
  }

  isSelected(policyId: string): boolean {
    return this.selectedPolicyIds.has(policyId);
  }

  clearSelection(): void {
    this.selectedPolicyIds.clear();
  }

  onPolicySelectionChange(policyId: string, selected: boolean): void {
    if (selected) {
      this.selectedPolicyIds.add(policyId);
      return;
    }
    this.selectedPolicyIds.delete(policyId);
  }

  onSubmit(): void {
    const selectedIds = Array.from(this.selectedPolicyIds);

    this.isSubmitting = true;
    this.customRolesFacade.assignPoliciesToRole(this.data.roleId, selectedIds).subscribe({
      next: () => {
        this.snackBar.open('Permissions updated successfully', 'Close', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (error: any) => {
        console.error('Error assigning policies:', error);
        this.snackBar.open('Error updating permissions', 'Close', { duration: 3000 });
        this.isSubmitting = false;
      },
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
