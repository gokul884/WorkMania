export type Status = 'active' | 'completed' | 'on-hold' | 'pending';
export type InvoiceStatus = 'paid' | 'unpaid' | 'overdue' | 'draft';
export type Priority = 'low' | 'medium' | 'high';

export interface Client {
  id: string;
  name: string;
  email: string;
  company: string;
  avatar: string;
}

export interface Project {
  id: string;
  name: string;
  clientId: string;
  status: Status;
  budget: number;
  dueDate: string;
  description: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: Priority;
  dueDate: string;
}

export interface Invoice {
  id: string;
  clientId: string;
  amount: number;
  status: InvoiceStatus;
  date: string;
  dueDate: string;
}

export interface Activity {
  id: string;
  type: 'project' | 'task' | 'invoice' | 'client';
  action: string;
  target: string;
  timestamp: string;
}
