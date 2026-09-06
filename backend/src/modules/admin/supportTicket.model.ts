import { HydratedDocument, InferSchemaType, model, Schema } from 'mongoose';
import { TicketPriority, TicketStatus } from '@astroai/shared-types';

const ticketMessageSchema = new Schema(
  {
    senderType: { type: String, enum: ['user', 'agent', 'system'], required: true },
    senderId: { type: String, required: true },
    senderName: { type: String, required: true },
    body: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const supportTicketSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    userEmail: { type: String, required: true },
    userName: { type: String, required: true },
    subject: { type: String, required: true },
    category: {
      type: String,
      enum: ['billing', 'report', 'voice_call', 'account', 'astrology_inquiry'],
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: Object.values(TicketPriority),
      default: TicketPriority.NORMAL,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(TicketStatus),
      default: TicketStatus.OPEN,
      required: true,
      index: true,
    },
    assignedAdminId: { type: String, default: null, index: true },
    assignedAdminName: { type: String, default: null },
    messages: { type: [ticketMessageSchema], default: [] },
    resolutionNotes: { type: String, default: null },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export type SupportTicketSchemaType = InferSchemaType<typeof supportTicketSchema>;
export type SupportTicketDocument = HydratedDocument<SupportTicketSchemaType>;

export const SupportTicketModel = model('SupportTicket', supportTicketSchema);
