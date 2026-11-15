export interface WhatsAppInteractiveListRow {
  id: string;
  title: string;
  description?: string;
}

export interface WhatsAppInteractiveListSection {
  title?: string;
  rows: WhatsAppInteractiveListRow[];
}

export interface WhatsAppInteractiveListAction {
  button: string;
  sections: WhatsAppInteractiveListSection[];
}

export interface WhatsAppInteractiveButtonReply {
  id: string;
  title: string;
}

export interface WhatsAppInteractiveButtonItem {
  type: 'reply';
  reply: WhatsAppInteractiveButtonReply;
}

export interface WhatsAppInteractiveButtonAction {
  buttons: WhatsAppInteractiveButtonItem[];
}

export interface WhatsAppInteractiveListPayload {
  type: 'list';
  header?: { type: 'text'; text: string };
  body: { text: string };
  footer?: { text: string };
  action: WhatsAppInteractiveListAction;
}

export interface WhatsAppInteractiveButtonPayload {
  type: 'button';
  header?: { type: 'text'; text: string };
  body: { text: string };
  footer?: { text: string };
  action: WhatsAppInteractiveButtonAction;
}

export type WhatsAppInteractivePayload =
  | WhatsAppInteractiveListPayload
  | WhatsAppInteractiveButtonPayload;

export interface WhatsAppSendInteractiveParams {
  to: string;
  interactive: WhatsAppInteractivePayload;
  replyToWamId?: string;
}

export interface WhatsAppInteractiveReplySelection {
  type: 'list_reply' | 'button_reply';
  id: string;
  title: string;
  description?: string;
}
