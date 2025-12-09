import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { CommonModule } from '@angular/common';
import { MessageService } from '../../services/message.service';
import { Message, UpdateMessageRequest, MessageChannel, MessageVariable } from '../../models/message';
import { MessageEditorComponent } from '../../components/message-editor/message-editor.component';

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
    MessageEditorComponent,
  ],
})
export class MessageEditComponent implements OnInit {
  messageForm: FormGroup;
  isLoading = false;
  isSaving = false;
  message: Message | null = null;
  messageId: string = '';
  // Enums for template
  MessageChannel = MessageChannel;

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.messageForm = this.fb.group({
      title: ['', [Validators.minLength(2), Validators.maxLength(100)]],
      content: ['', [Validators.required, Validators.maxLength(1000)]],
      channel: [MessageChannel.EMAIL, [Validators.required]],
    });

    // Update title validators based on channel
    this.updateTitleValidators();

    // Subscribe to channel changes to update title validators
    this.messageForm.get('channel')?.valueChanges.subscribe(channel => {
      this.updateTitleValidators();
    });
  }

  ngOnInit(): void {
    this.messageId = this.route.snapshot.params['id'];
    if (this.messageId) {
      this.loadMessage();
    }
  }

  private updateTitleValidators(): void {
    const channel = this.messageForm.get('channel')?.value;
    const titleControl = this.messageForm.get('title');

    if (channel === MessageChannel.EMAIL) {
      titleControl?.setValidators([Validators.required, Validators.minLength(2), Validators.maxLength(100)]);
    } else {
      titleControl?.setValidators([Validators.minLength(2), Validators.maxLength(100)]);
    }

    titleControl?.updateValueAndValidity();
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
      content: message.content,
      channel: message.channel,
    });

    // Update validators based on the loaded channel
    this.updateTitleValidators();
  }

  onSubmit(): void {
    if (this.messageForm.valid) {
      this.isSaving = true;
      const formValue = this.messageForm.value;

      const messageData: UpdateMessageRequest = {
        title: formValue.title,
        content: formValue.content,
        channel: formValue.channel,
        // No custom variables, using API variables instead
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
  }
}