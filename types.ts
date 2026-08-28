
export interface EmailAccount {
  id: string;
  name: string;
  email: string;
  host: string;
  port: number;
  user: string;
  password?: string;
  isDefault: boolean;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  createdAt: number;
}

export interface Recipient {
  email: string;
  [key: string]: string;
}

export interface RecipientList {
  id: string;
  name: string;
  classification?: string;
  zone?: string;
  city?: string;
  country?: string;
  sourceFileName?: string;
  recipients: Recipient[];
  createdAt: number;
  updatedAt: number;
}

export interface CampaignLog {
  id: string;
  recipient: string;
  recipientData: Recipient;
  subject: string;
  status: 'sent' | 'failed';
  messageId?: string;
  error?: string;
  sentAt: number;
  attempt: number;
}

export interface Campaign {
  id: string;
  name: string;
  accountId: string;
  templateId: string;
  status: 'draft' | 'sending' | 'completed' | 'failed';
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  createdAt: number;
  completedAt?: number;
  logs?: CampaignLog[];
  sendDelayMs?: number;
  maxRetries?: number;
}

export type View = 'dashboard' | 'accounts' | 'templates' | 'lists' | 'campaigns' | 'new-campaign' | 'settings';
