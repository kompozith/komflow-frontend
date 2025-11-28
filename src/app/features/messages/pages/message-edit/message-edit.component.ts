import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { CommonModule } from '@angular/common';
import { MessageService } from '../../services/message.service';
import { Message, UpdateMessageRequest, MessageChannel, MessageType, MessageVariable } from '../../models/message';

@Component({
  selector: 'app-message-edit',
  templateUrl: './message-edit.component.html',
  styleUrls: [],
  imports: [
    MaterialModule,
    ReactiveFormsModule,
    FormsModule,
    TablerIconsModule,
    CommonModule,
  ],
})
export class MessageEditComponent implements OnInit {
  messageForm: FormGroup;
  isLoading = false;
  isSaving = false;
  message: Message | null = null;
  messageId: string = '';
  recipientName = 'John Doe'; // Example recipient name for template preview

  // Enums for template
  MessageChannel = MessageChannel;
  MessageType = MessageType;

  // Variable types
  variableTypes = [
    { value: 'TEXT', label: 'Text' },
    { value: 'NUMBER', label: 'Number' },
    { value: 'DATE', label: 'Date' },
    { value: 'EMAIL', label: 'Email' },
  ];

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.messageForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      body: ['', [Validators.required, Validators.maxLength(1000)]],
      channel: [MessageChannel.EMAIL, [Validators.required]],
      type: [MessageType.MARKETING, [Validators.required]],
      status: ['ACTIVE'],
      variables: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.messageId = this.route.snapshot.params['id'];
    if (this.messageId) {
      this.loadMessage();
    }
  }

  get variables(): FormArray {
    return this.messageForm.get('variables') as FormArray;
  }

  loadMessage(): void {
    this.isLoading = true;
    this.messageService.getMessageById(this.messageId).subscribe({
      next: (message) => {
        this.message = message;
        this.populateForm(message);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading message:', error);
        this.snackBar.open('Error loading message', 'Close', { duration: 3000 });
        this.isLoading = false;
        this.router.navigate(['/messages/list']);
      }
    });
  }

  populateForm(message: Message): void {
    this.messageForm.patchValue({
      title: message.title,
      body: message.body,
      channel: message.channel,
      type: message.type,
      status: message.status
    });

    // Clear existing variables
    while (this.variables.length !== 0) {
      this.variables.removeAt(0);
    }

    // Add variables
    message.variables.forEach(variable => {
      this.addVariable(variable);
    });
  }

  addVariable(variable?: MessageVariable): void {
    const variableForm = this.fb.group({
      name: [variable?.name || '', [Validators.required, Validators.pattern(/^[a-zA-Z_][a-zA-Z0-9_]*$/)]],
      type: [variable?.type || 'TEXT', [Validators.required]],
      defaultValue: [variable?.defaultValue || ''],
      required: [variable?.required || false],
      description: [variable?.description || '']
    });
    this.variables.push(variableForm);
  }

  removeVariable(index: number): void {
    this.variables.removeAt(index);
  }

  onSubmit(): void {
    if (this.messageForm.valid) {
      this.isSaving = true;
      const formValue = this.messageForm.value;

      const messageData: UpdateMessageRequest = {
        title: formValue.title,
        body: formValue.body,
        channel: formValue.channel,
        type: formValue.type,
        status: formValue.status,
        variables: formValue.variables.map((v: any) => ({
          name: v.name,
          type: v.type,
          defaultValue: v.defaultValue || undefined,
          required: v.required,
          description: v.description || undefined
        }))
      };

      this.messageService.updateMessage(this.messageId, messageData).subscribe({
        next: (message) => {
          this.snackBar.open('Message updated successfully', 'Close', { duration: 3000 });
          this.router.navigate(['/messages/list']);
        },
        error: (error) => {
          console.error('Error updating message:', error);
          this.snackBar.open('Error updating message', 'Close', { duration: 3000 });
          this.isSaving = false;
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel(): void {
    this.router.navigate(['/messages/list']);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.messageForm.controls).forEach(key => {
      const control = this.messageForm.get(key);
      control?.markAsTouched();
    });
    // Also mark variables array controls as touched
    this.variables.controls.forEach(control => {
      Object.keys(control.value).forEach(key => {
        const fieldControl = control.get(key);
        fieldControl?.markAsTouched();
      });
    });
  }

  // Preview content with variables highlighted
  getPreviewContent(): string {
    const content = this.messageForm.get('content')?.value || '';
    const variables = this.variables.value;

    let preview = content;
    variables.forEach((variable: any) => {
      const regex = new RegExp(`{{${variable.name}}}`, 'g');
      preview = preview.replace(regex, `<span class="variable-highlight">{{${variable.name}}}</span>`);
    });

    return preview;
  }
}