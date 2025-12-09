import { Component, Input, Output, EventEmitter, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { AbstractControl, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { Observable, map, startWith } from 'rxjs';
import { MessageService } from '../../services/message.service';
import { Variable } from '../../models/message';

@Component({
  selector: 'app-message-editor',
  templateUrl: './message-editor.component.html',
  styleUrls: ['./message-editor.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatAutocompleteModule,
    MatCardModule,
    MatChipsModule,
    MatTooltipModule,
  ],
})
export class MessageEditorComponent implements OnInit, AfterViewInit {
  @Input() contentControl!: AbstractControl;
  @Input() placeholder = 'Enter your message content...';
  @Input() label = 'Message Content';
  @Input() rows = 6;

  @Output() contentChange = new EventEmitter<string>();

  @ViewChild('contentEditor') contentEditor!: ElementRef<HTMLDivElement>;
  @ViewChild('autocompleteInput') autocompleteInput!: ElementRef<HTMLInputElement>;

  variables: Variable[] = [];
  filteredVariables: Observable<Variable[]> = new Observable();
  variableControl = new FormControl('');
  showAutocomplete = false;
  autocompletePosition = { top: 0, left: 0 };
  private isEditorContentUpdating = false;
  private savedRange: Range | null = null;
  private triggerChar: string | null = null;
  previewContent: string = '';

  constructor(private messageService: MessageService) {}

  ngOnInit(): void {
    this.loadVariables();

    this.filteredVariables = this.variableControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterVariables(value || ''))
    );
  }

  ngAfterViewInit(): void {
    this.initializeEditor();

    // Parse initial content if any
    const initialContent = this.contentControl.value || '';
    if (initialContent) {
      this.parseContentIntoEditor(initialContent);
    }

    // Initialize preview
    this.previewContent = this.getPreviewContent();

    // Watch for form control value changes to update the editor
    this.contentControl.valueChanges.subscribe(value => {
      if (value && !this.isEditorContentUpdating) {
        this.parseContentIntoEditor(value);
        this.previewContent = this.getPreviewContent();
      }
    });
  }

  private loadVariables(): void {
    this.messageService.getVariables().subscribe({
      next: (variables) => {
        this.variables = variables;
      },
      error: (error) => {
        console.error('Error loading variables:', error);
        this.variables = [];
      }
    });
  }

  private initializeEditor(): void {
    if (!this.contentEditor) {
      return;
    }
    const editor = this.contentEditor.nativeElement;

    // Handle input events
    editor.addEventListener('input', (e) => {
      this.handleEditorInput(e);
    });

    editor.addEventListener('keydown', (e) => {
      this.handleKeyDown(e);
    });

    editor.addEventListener('keyup', (e) => {
      this.handleKeyUp(e);
    });

    editor.addEventListener('paste', (e) => {
      this.handlePaste(e);
    });
  }

  private parseContentIntoEditor(content: string): void {
    if (!this.contentEditor) {
      return;
    }
    const editor = this.contentEditor.nativeElement;
    editor.innerHTML = '';

    // Parse content and create visual elements
    const parts = content.split(/(\{\{[^{}]*\}\})/g);

    parts.forEach(part => {
      if (part.startsWith('{{') && part.endsWith('}}')) {
        let variableKey = part.slice(2, -2);
        // Handle escaped variable keys from backend
        try {
          if (variableKey.startsWith('"') && variableKey.endsWith('"')) {
            variableKey = JSON.parse(variableKey);
          }
        } catch (e) {
          // If parsing fails, use as is
        }
        // Handle nested braces in key
        if (variableKey.startsWith('{{') && variableKey.endsWith('}}')) {
          variableKey = variableKey.slice(2, -2);
        }
        const variable = this.variables.find(v => v.key === variableKey);
        if (variable) {
          const span = document.createElement('span');
          span.className = 'variable-chip';
          span.setAttribute('data-variable', variableKey);
          span.contentEditable = 'false';
          span.textContent = variable.key;
          span.title = variable.description;
          editor.appendChild(span);
        } else {
          // Unknown variable, treat as text
          editor.appendChild(document.createTextNode(part));
        }
      } else if (part.trim()) {
        editor.appendChild(document.createTextNode(part));
      }
    });
  }

  private handleEditorInput(event: Event): void {
    // Update the form control with the current content
    const content = this.getEditorContent();
    this.isEditorContentUpdating = true;
    this.contentControl.setValue(content);
    this.contentChange.emit(content);
    this.isEditorContentUpdating = false;
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.contentEditor) {
      return;
    }
    const editor = this.contentEditor.nativeElement;
    const selection = window.getSelection();
    const range = selection?.getRangeAt(0);

    if (!range) return;

    // Handle backspace on variable spans
    if (event.key === 'Backspace') {
      const node = range.startContainer;
      const offset = range.startOffset;

      if (node.nodeType === Node.TEXT_NODE && offset === 0) {
        // Check if we're at the start of a text node and the previous sibling is a variable span
        const prevSibling = node.previousSibling;
        if (prevSibling && prevSibling.nodeType === Node.ELEMENT_NODE &&
            (prevSibling as Element).classList.contains('variable-chip')) {
          event.preventDefault();
          (prevSibling as Element).remove();
          this.updateFormControl();
          return;
        }
      } else if (node.nodeType === Node.ELEMENT_NODE &&
                  (node as Element).classList.contains('variable-chip')) {
        // If we're inside a variable span, delete the whole span
        event.preventDefault();
        (node as Element).remove();
        this.updateFormControl();
        return;
      }
    }

    // Handle special character autocomplete triggers
    if (event.key === '#' || event.key === '@') {
      this.triggerChar = event.key;
      this.showAutocomplete = true;
      this.variableControl.setValue('');
      // Save the current range
      const selection = window.getSelection();
      this.savedRange = selection?.getRangeAt(0) || null;
      this.positionAutocomplete();
      // Focus the autocomplete input after it's rendered
      setTimeout(() => {
        if (this.autocompleteInput) {
          this.autocompleteInput.nativeElement.focus();
        }
      }, 0);
    }
  }

  private handleKeyUp(event: KeyboardEvent): void {
    // Hide autocomplete if not a special character
    if (event.key !== '#' && event.key !== '@' && !this.showAutocomplete) {
      return;
    }

    // Update autocomplete position
    if (this.showAutocomplete) {
      this.positionAutocomplete();
    }
  }

  private handlePaste(event: ClipboardEvent): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text/plain') || '';
    document.execCommand('insertText', false, text);
  }

  private positionAutocomplete(): void {
    if (!this.contentEditor) {
      return;
    }
    const editor = this.contentEditor.nativeElement;
    const selection = window.getSelection();
    const range = selection?.getRangeAt(0);

    if (range) {
      const rect = range.getBoundingClientRect();
      const editorRect = editor.getBoundingClientRect();

      this.autocompletePosition = {
        top: rect.bottom - editorRect.top + 5,
        left: rect.left - editorRect.left
      };
    }
  }

  private _filterVariables(value: string): Variable[] {
    const filterValue = value.toLowerCase();
    return this.variables.filter(variable =>
      variable.key.toLowerCase().includes(filterValue) ||
      variable.description.toLowerCase().includes(filterValue)
    );
  }

  insertVariable(variable: Variable): void {
    this.insertVariableSpan(variable);
    this.updateFormControl();
    if (this.contentEditor) {
      this.contentEditor.nativeElement.focus();
    }
  }

  private insertVariableSpan(variable: Variable): void {
    if (!this.contentEditor) {
      return;
    }
    const editor = this.contentEditor.nativeElement;
    let range = this.savedRange;
    if (!range || !editor.contains(range.startContainer)) {
      // Fallback to current selection or end of editor
      const selection = window.getSelection();
      const currentRange = selection?.getRangeAt(0);
      if (currentRange && editor.contains(currentRange.startContainer)) {
        range = currentRange;
      } else {
        // Insert at the end
        range = document.createRange();
        range.selectNodeContents(editor);
        range.collapse(false);
      }
    }

    if (range) {
      // Create variable span
      const span = document.createElement('span');
      span.className = 'variable-chip';
      span.setAttribute('data-variable', variable.key);
      span.contentEditable = 'false';
      span.textContent = variable.key;
      span.title = variable.description;

      // Insert the span
      range.deleteContents();
      range.insertNode(span);

      // Remove the trigger character if present
      if (this.triggerChar) {
        const nextSibling = span.nextSibling;
        if (nextSibling && nextSibling.nodeType === Node.TEXT_NODE && nextSibling.textContent?.startsWith(this.triggerChar)) {
          nextSibling.textContent = nextSibling.textContent.slice(1);
          if (nextSibling.textContent === '') {
            nextSibling.remove();
          }
        }
      }

      // Move cursor after the span
      range.setStartAfter(span);
      range.setEndAfter(span);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);

      // Clear saved range and trigger char
      this.savedRange = null;
      this.triggerChar = null;
    }
  }

  selectVariable(variable: Variable): void {
    this.insertVariable(variable);
    this.showAutocomplete = false;
    this.variableControl.setValue('');
    this.triggerChar = null;
    this.savedRange = null;
  }

  hideAutocomplete(): void {
    this.showAutocomplete = false;
    this.savedRange = null;
    this.triggerChar = null;
  }

  private getEditorContent(): string {
    if (!this.contentEditor) {
      return '';
    }
    const editor = this.contentEditor.nativeElement;
    let content = '';

    Array.from(editor.childNodes).forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        content += node.textContent;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        if (element.classList.contains('variable-chip')) {
          const variableKey = element.getAttribute('data-variable');
          if (variableKey) {
            content += `${variableKey}`;
          }
        } else {
          content += element.textContent;
        }
      }
    });

    return content;
  }

  private updateFormControl(): void {
    this.isEditorContentUpdating = true;
    const content = this.getEditorContent();
    this.contentControl.setValue(content);
    this.contentChange.emit(content);
    this.previewContent = this.getPreviewContent();
    this.isEditorContentUpdating = false;
  }

  getPreviewContent(): string {
    const content = this.getEditorContent();
    let preview = content;

    // Highlight variables
    this.variables.forEach(variable => {
      const regex = new RegExp(`{{${variable.key}}}`, 'g');
      preview = preview.replace(regex, `<span class="variable-highlight">{{${variable.key}}}</span>`);
    });

    return preview;
  }

  getDetectedVariables(): Variable[] {
    const content = this.getEditorContent();
    const detectedKeys = new Set<string>();

    // Extract variable keys from content
    const regex = /\{\{([^{}]*)\}\}/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      detectedKeys.add(match[1]);
    }

    return this.variables.filter(v => detectedKeys.has(v.key));
  }

  displayVariable(variable: Variable): string {
    return variable ? variable.key : '';
  }
}