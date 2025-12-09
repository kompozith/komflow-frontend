import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { CommonModule } from '@angular/common';
import { MessageService } from '../../services/message.service';
import { CreateMessageRequest, MessageChannel, MessageVariable } from '../../models/message';
import { MessageEditorComponent } from '../../components/message-editor/message-editor.component';

@Component({
  selector: 'app-message-create',
  templateUrl: './message-create.component.html',
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
export class MessageCreateComponent implements OnInit {
  messageForm: FormGroup;
  isLoading = false;
  // Enums for template
  MessageChannel = MessageChannel;

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private router: Router,
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

  ngOnInit(): void {}

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


  onSubmit(): void {
    if (this.messageForm.valid) {
      this.isLoading = true;
      const formValue = this.messageForm.value;

      const messageData: CreateMessageRequest = {
        title: formValue.title,
        content: formValue.content,
        channel: formValue.channel,
        variables: [] // No custom variables, using API variables instead
      };

      this.messageService.createMessage(messageData).subscribe({
        next: (message) => {
          this.snackBar.open('Message created successfully', 'Close', { duration: 3000 });
          this.router.navigate(['/messages/list']);
        },
        error: (error) => {
          console.error('Error creating message:', error);
          this.snackBar.open('Error creating message', 'Close', { duration: 3000 });
          this.isLoading = false;
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
