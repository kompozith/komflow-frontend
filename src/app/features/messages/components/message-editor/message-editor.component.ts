import { Component, Input, Output, EventEmitter, OnInit, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { AbstractControl, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
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
import { AppEvent } from '../../../core/services/event.service';
import { normalizeVariableKey, renderTemplatePreviewHtml } from '../../utils/message-rich-text.util';

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
export class MessageEditorComponent implements OnInit, AfterViewInit, OnChanges {
  @Input() contentControl!: AbstractControl;
  @Input() placeholder = 'Enter your message content...';
  @Input() label = 'Message Content';
  @Input() rows = 6;
  @Input() selectedEvent: AppEvent | null = null;
  @Input() showVariablesPanel = true;
  @Input() showPreview = true;

  @Output() contentChange = new EventEmitter<string>();

  @ViewChild('contentEditor') contentEditor!: ElementRef<HTMLDivElement>;

  variables: Variable[] = [];
  filteredVariables: Observable<Variable[]> = new Observable();
  variableControl = new FormControl('');
  showAutocomplete = false;
  autocompletePosition = { top: 0, left: 0 };
  private isEditorContentUpdating = false;
  private triggerStartRange: Range | null = null;
  private autocompleteReplaceRange: Range | null = null;
  private triggerChar: string | null = null;
  autocompleteQuery = '';
  previewContent: string = '';
  private readonly mockUserValues: Record<string, string> = {
    '{{firstName}}': 'Alice',
    '{{lastName}}': 'Johnson',
    '{{email}}': 'alice.johnson@example.com',
    '{{language}}': 'fr',
    '{{country}}': 'France',
    '{{city}}': 'Paris',
    '{{contactId}}': '1024',
    '{{contactEnabled}}': 'true',
    '{{username}}': 'alice.j',
    '{{phoneNumber}}': '+33 6 12 34 56 78',
    '{{whatsappNumber}}': '+33 6 12 34 56 78',
  };

  constructor(private messageService: MessageService) {}

  ngOnInit(): void {
    this.loadVariables();
    this.initializeVariableFilter();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedEvent']) {
      this.previewContent = this.getPreviewContent();
      this.variableControl.setValue(this.variableControl.value || '');
    }
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
      if (!this.isEditorContentUpdating) {
        this.parseContentIntoEditor(value || '');
        this.previewContent = this.getPreviewContent();
      }
    });
  }

  private initializeVariableFilter(): void {
    this.filteredVariables = this.variableControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterVariables(value || ''))
    );
  }

  private getAvailableVariables(): Variable[] {
    return this.variables.filter(variable => this.selectedEvent || !this.isEventVariable(variable));
  }

  private normalizeVariableKey(key: string): string {
    return normalizeVariableKey(key);
  }

  private isEventVariable(variable: Variable): boolean {
    return this.normalizeVariableKey(variable.key).startsWith('{{event');
  }

  private getVariableValue(variableKey: string): string {
    const key = this.normalizeVariableKey(variableKey);
    if (this.isEventVariable({ key, description: '' })) {
      if (!this.selectedEvent) {
        return '[Event requis]';
      }
      const lowered = key.toLowerCase();
      switch (key) {
        case '{{eventTitle}}':
          return this.selectedEvent.title || '';
        case '{{eventStartDate}}':
          return this.selectedEvent.startDate || '';
        case '{{eventStartTime}}':
          return this.normalizeTime(this.selectedEvent.startTime);
        case '{{eventEndDate}}':
          return this.selectedEvent.endDate || '';
        case '{{eventEndTime}}':
          return this.normalizeTime(this.selectedEvent.endTime);
        case '{{eventLocation}}':
          return this.selectedEvent.location || '';
        case '{{eventTimezone}}':
          return this.selectedEvent.timezone || '';
        case '{{eventLocalTime}}':
          return this.formatEventDateTime(this.selectedEvent.startDate, this.selectedEvent.startTime, this.selectedEvent.startAt);
        case '{{eventEndLocalTime}}':
          return this.formatEventDateTime(this.selectedEvent.endDate, this.selectedEvent.endTime, this.selectedEvent.endAt);
        default:
          if (lowered === '{{eventtitle}}') return this.selectedEvent.title || '';
          if (lowered === '{{eventstartdate}}') return this.selectedEvent.startDate || '';
          if (lowered === '{{eventstarttime}}') return this.normalizeTime(this.selectedEvent.startTime);
          if (lowered === '{{eventenddate}}') return this.selectedEvent.endDate || '';
          if (lowered === '{{eventendtime}}') return this.normalizeTime(this.selectedEvent.endTime);
          if (lowered === '{{eventlocation}}') return this.selectedEvent.location || '';
          if (lowered === '{{eventtimezone}}') return this.selectedEvent.timezone || '';
          if (lowered === '{{eventlocaltime}}') return this.formatEventDateTime(this.selectedEvent.startDate, this.selectedEvent.startTime, this.selectedEvent.startAt);
          if (lowered === '{{eventendlocaltime}}') return this.formatEventDateTime(this.selectedEvent.endDate, this.selectedEvent.endTime, this.selectedEvent.endAt);
          return '[Variable event]';
      }
    }
    return this.mockUserValues[key] ?? `[${key}]`;
  }

  private formatEventDateTime(date?: string | null, time?: string | null, fallback?: string | null): string {
    if (date && time) {
      return `${date} ${this.normalizeTime(time)}`;
    }
    return this.formatDateTime(fallback);
  }

  private normalizeTime(value?: string | null): string {
    if (!value) return '';
    return value.length >= 5 ? value.slice(0, 5) : value;
  }

  private formatDateTime(value?: string | null): string {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString('fr-FR');
  }

  private loadVariables(): void {
    this.messageService.getVariables().subscribe({
      next: (variables) => {
        this.variables = variables || [];
        if (this.contentControl?.value) {
          this.parseContentIntoEditor(this.contentControl.value);
        }
        this.previewContent = this.getPreviewContent();
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
    const parser = new DOMParser();
    const doc = parser.parseFromString(content || '', 'text/html');
    editor.innerHTML = '';

    const transformed = this.replaceTokensWithChips(doc.body);
    while (transformed.firstChild) {
      editor.appendChild(transformed.firstChild);
    }

    if (!editor.innerHTML.trim()) {
      editor.innerHTML = '';
    }
  }

  private handleEditorInput(_event: Event): void {
    // Update the form control with the current content
    const content = this.getEditorContent();
    this.isEditorContentUpdating = true;
    this.contentControl.setValue(content);
    this.contentChange.emit(content);
    this.previewContent = this.getPreviewContent();
    if (!this.showAutocomplete) {
      this.tryOpenAutocompleteFromCaret();
    }
    this.refreshInlineAutocompleteContext();
    this.isEditorContentUpdating = false;
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.contentEditor) {
      return;
    }
    const editor = this.contentEditor.nativeElement;
    const selection = window.getSelection();
    const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

    if (!range) return;

    if (event.key === 'Escape' && this.showAutocomplete) {
      this.hideAutocomplete();
      return;
    }

    // User can skip autocomplete by typing space right after trigger.
    if (event.key === ' ' && this.showAutocomplete) {
      this.hideAutocomplete();
      return;
    }

    // Handle backspace on variable spans
    if (event.key === 'Backspace') {
      const node = range.startContainer;
      const offset = range.startOffset;

      if (node.nodeType === Node.TEXT_NODE && offset === 0) {
        // Check if we're at the start of a text node and the previous sibling is a variable span
        const prevSibling = node.previousSibling;
        if (prevSibling && prevSibling.nodeType === Node.ELEMENT_NODE &&
            (prevSibling as Element).classList.contains('editor-variable-chip')) {
          event.preventDefault();
          (prevSibling as Element).remove();
          this.updateFormControl();
          return;
        }
      } else if (node.nodeType === Node.ELEMENT_NODE &&
                  (node as Element).classList.contains('editor-variable-chip')) {
        // If we're inside a variable span, delete the whole span
        event.preventDefault();
        (node as Element).remove();
        this.updateFormControl();
        return;
      }
    }

    // Trigger keys are handled on keyup after the character is inserted.
  }

  private handleKeyUp(event: KeyboardEvent): void {
    if (!this.showAutocomplete && (event.key === '#' || event.key === '@' || event.key.length === 1)) {
      this.tryOpenAutocompleteFromCaret();
    }

    if (!this.showAutocomplete) {
      return;
    }

    this.refreshInlineAutocompleteContext();
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
    const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

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
    return this.getAvailableVariables().filter(variable =>
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
    let range = this.autocompleteReplaceRange && editor.contains(this.autocompleteReplaceRange.startContainer)
      ? this.autocompleteReplaceRange.cloneRange()
      : null;
    if (!range) {
      // Fallback to current selection
      const selection = window.getSelection();
      const currentRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
      range = currentRange && editor.contains(currentRange.startContainer) ? currentRange.cloneRange() : null;
    }
    if (!range) return;

    // Create variable span
    const span = document.createElement('span');
    span.className = 'editor-variable-chip';
    span.setAttribute('data-variable', this.normalizeVariableKey(variable.key));
    span.contentEditable = 'false';
    span.textContent = this.normalizeVariableKey(variable.key);
    span.title = variable.description;

    // Replace trigger slice with the variable
    range.deleteContents();
    range.insertNode(span);
    const spacer = document.createTextNode('');
    span.parentNode?.insertBefore(spacer, span.nextSibling);

    // Move cursor after the span
    range.setStart(spacer, 0);
    range.setEnd(spacer, 0);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);

    // Clear autocomplete state
    this.triggerStartRange = null;
    this.autocompleteReplaceRange = null;
    this.triggerChar = null;
    this.autocompleteQuery = '';
    this.showAutocomplete = false;
  }

  selectVariable(variable: Variable): void {
    this.insertVariable(variable);
    this.variableControl.setValue('');
  }

  hideAutocomplete(): void {
    this.showAutocomplete = false;
    this.triggerStartRange = null;
    this.autocompleteReplaceRange = null;
    this.triggerChar = null;
    this.autocompleteQuery = '';
  }

  onAutocompleteOptionMouseDown(event: MouseEvent, variable: Variable): void {
    event.preventDefault();
    this.selectVariable(variable);
  }

  getInlineSuggestions(): Variable[] {
    if (!this.showAutocomplete) {
      return [];
    }
    const query = (this.autocompleteQuery || '').toLowerCase();
    return this.getAvailableVariables().filter(variable =>
      !query
      || variable.key.toLowerCase().includes(query)
      || variable.description.toLowerCase().includes(query)
    ).slice(0, 8);
  }

  private getEditorContent(): string {
    if (!this.contentEditor) {
      return '';
    }
    const editor = this.contentEditor.nativeElement;
    const clone = editor.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('.editor-variable-chip').forEach((chipElement) => {
      const variableKey = this.normalizeVariableKey(chipElement.getAttribute('data-variable') || chipElement.textContent || '');
      chipElement.replaceWith(document.createTextNode(variableKey));
    });
    return clone.innerHTML;
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
    return renderTemplatePreviewHtml(content, (token) => this.getVariableValue(token), 'variable-highlight');
  }

  getDetectedVariables(): Variable[] {
    const content = this.getEditorContent();
    const detectedKeys = new Set<string>();

    // Extract variable keys from content
    const regex = /\{\{[^{}]+\}\}/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      detectedKeys.add(this.normalizeVariableKey(match[0]));
    }

    return this.variables.filter(v => detectedKeys.has(this.normalizeVariableKey(v.key)));
  }

  getSelectableVariables(): Variable[] {
    return this.getAvailableVariables();
  }

  displayVariable(variable: Variable): string {
    return variable ? variable.key : '';
  }

  applyFormatting(command: 'bold' | 'italic' | 'underline' | 'insertUnorderedList' | 'insertOrderedList'): void {
    this.focusEditor();
    document.execCommand(command, false);
    this.updateFormControl();
  }

  insertLink(): void {
    const url = window.prompt('Enter URL (https://...)');
    if (!url) return;
    this.focusEditor();
    document.execCommand('createLink', false, url.trim());
    this.updateFormControl();
  }

  clearFormatting(): void {
    this.focusEditor();
    document.execCommand('removeFormat', false);
    this.updateFormControl();
  }

  private focusEditor(): void {
    if (!this.contentEditor) return;
    this.contentEditor.nativeElement.focus();
  }

  private replaceTokensWithChips(root: HTMLElement): DocumentFragment {
    const fragment = document.createDocumentFragment();
    Array.from(root.childNodes).forEach((node) => {
      fragment.appendChild(this.transformNode(node));
    });
    return fragment;
  }

  private transformNode(node: ChildNode): Node {
    if (node.nodeType === Node.TEXT_NODE) {
      return this.transformTextNode(node.textContent || '');
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const source = node as HTMLElement;
      const element = document.createElement(source.tagName.toLowerCase());
      Array.from(source.attributes).forEach((attribute) => {
        if (attribute.name.toLowerCase() === 'contenteditable') {
          return;
        }
        element.setAttribute(attribute.name, attribute.value);
      });
      Array.from(source.childNodes).forEach((childNode) => {
        element.appendChild(this.transformNode(childNode));
      });
      return element;
    }

    return document.createTextNode('');
  }

  private transformTextNode(text: string): DocumentFragment {
    const fragment = document.createDocumentFragment();
    if (!text) {
      return fragment;
    }

    const regex = /\{\{[^{}]+\}\}/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null = regex.exec(text);

    while (match) {
      const token = match[0];
      const index = match.index;
      if (index > lastIndex) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex, index)));
      }

      const normalizedKey = this.normalizeVariableKey(token);
      const variable = this.variables.find(v => this.normalizeVariableKey(v.key) === normalizedKey);
      if (variable) {
        fragment.appendChild(this.buildVariableChip(variable));
      } else {
        fragment.appendChild(document.createTextNode(token));
      }

      lastIndex = index + token.length;
      match = regex.exec(text);
    }

    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    return fragment;
  }

  private buildVariableChip(variable: Variable): HTMLElement {
    const span = document.createElement('span');
    span.className = 'editor-variable-chip';
    span.setAttribute('data-variable', this.normalizeVariableKey(variable.key));
    span.contentEditable = 'false';
    span.textContent = this.normalizeVariableKey(variable.key);
    span.title = variable.description;
    return span;
  }

  private refreshInlineAutocompleteContext(): void {
    if (!this.showAutocomplete || !this.contentEditor) {
      return;
    }

    const editor = this.contentEditor.nativeElement;
    const selection = window.getSelection();
    const caretRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

    if (!caretRange || !editor.contains(caretRange.startContainer)) {
      this.hideAutocomplete();
      return;
    }

    if (!this.triggerStartRange || !editor.contains(this.triggerStartRange.startContainer)) {
      this.hideAutocomplete();
      return;
    }

    const replacementRange = document.createRange();
    replacementRange.setStart(this.triggerStartRange.startContainer, this.triggerStartRange.startOffset);
    replacementRange.setEnd(caretRange.startContainer, caretRange.startOffset);

    const typedSlice = replacementRange.toString();
    if (!this.triggerChar || !typedSlice.startsWith(this.triggerChar)) {
      this.hideAutocomplete();
      return;
    }

    // Stop on whitespace/newline after trigger (Slack/Jira-like behavior)
    const query = typedSlice.slice(1);
    if (/\s/.test(query)) {
      this.hideAutocomplete();
      return;
    }

    this.autocompleteReplaceRange = replacementRange;
    this.autocompleteQuery = query;
    this.positionAutocomplete();
  }

  private tryOpenAutocompleteFromCaret(): void {
    const triggerData = this.findTriggerRangeAtCaret();
    if (!triggerData) {
      return;
    }

    this.triggerChar = triggerData.trigger;
    this.triggerStartRange = triggerData.range.cloneRange();
    this.autocompleteReplaceRange = triggerData.range.cloneRange();
    this.autocompleteQuery = '';
    this.showAutocomplete = true;
    this.positionAutocomplete();
  }

  private findTriggerRangeAtCaret(): { range: Range; trigger: string } | null {
    if (!this.contentEditor) {
      return null;
    }

    const editor = this.contentEditor.nativeElement;
    const selection = window.getSelection();
    const caretRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

    if (!caretRange || !caretRange.collapsed || !editor.contains(caretRange.startContainer)) {
      return null;
    }

    const container = caretRange.startContainer;
    const offset = caretRange.startOffset;
    const triggers = ['@', '#'];

    if (container.nodeType === Node.TEXT_NODE) {
      const text = (container as Text).data || '';
      if (offset <= 0) return null;
      const charBeforeCaret = text.charAt(offset - 1);
      if (!triggers.includes(charBeforeCaret)) return null;

      const range = document.createRange();
      range.setStart(container, offset - 1);
      range.setEnd(container, offset);
      return { range, trigger: charBeforeCaret };
    }

    if (container.nodeType === Node.ELEMENT_NODE && offset > 0) {
      const previousNode = container.childNodes[offset - 1];
      if (!previousNode || previousNode.nodeType !== Node.TEXT_NODE) {
        return null;
      }
      const text = (previousNode as Text).data || '';
      if (!text.length) return null;
      const lastChar = text.charAt(text.length - 1);
      if (!triggers.includes(lastChar)) return null;

      const range = document.createRange();
      range.setStart(previousNode, text.length - 1);
      range.setEnd(previousNode, text.length);
      return { range, trigger: lastChar };
    }

    return null;
  }
}
