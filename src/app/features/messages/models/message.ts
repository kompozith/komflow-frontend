// src/app/features/messages/models/message.ts

export interface MessageVariable {
  id: string;
  name: string;
  type: 'TEXT' | 'NUMBER' | 'DATE' | 'EMAIL';
  defaultValue?: string;
  required: boolean;
  description?: string;
}

export interface Message {
  id: string;
  title: string;
  content: string;
  channel: MessageChannel;
  type: MessageType;
  variables: MessageVariable[];
  attachmentCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface MessagePage {
  totalElements: number;
  totalPages: number;
  size: number;
  content: Message[];
  number: number;
  sort: any;
  numberOfElements: number;
  pageable: any;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface MessageFilters {
  page?: number;
  size?: number;
  sort?: string[];
  channel?: MessageChannel;
  type?: MessageType;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export enum MessageChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP'
}

export enum MessageType {
  MARKETING = 'MARKETING',
  TRANSACTIONAL = 'TRANSACTIONAL',
  NOTIFICATION = 'NOTIFICATION'
}

export interface CreateMessageRequest {
  title: string;
  content: string;
  channel: MessageChannel;
  type: MessageType;
  variables: Omit<MessageVariable, 'id'>[];
}

export interface UpdateMessageRequest {
  title?: string;
  content?: string;
  channel?: MessageChannel;
  type?: MessageType;
  variables?: MessageVariable[];
}

export interface SendMessageRequest {
  messageId: string;
  contactIds: string[];
  variableValues?: { [key: string]: string };
}

export interface MessageSendResult {
  success: boolean;
  messageId: string;
  contactId: string;
  error?: string;
  sentAt: string;
}
