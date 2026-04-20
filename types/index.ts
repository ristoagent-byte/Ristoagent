export type BusinessType =
  | "Ristorante / Pizzeria"
  | "Bar / Caffetteria"
  | "Agriturismo"
  | "Parrucchiere / Barbiere"
  | "Centro Estetico / SPA"
  | "Palestra / Studio Fitness"
  | "Studio Medico / Dentista"
  | "Altro";

export interface Business {
  id: string;
  user_id: string;
  name: string;
  type: BusinessType;
  services: string;
  opening_hours: string;
  telegram_bot_token: string | null;
  telegram_bot_username: string | null;
  google_access_token: string | null;
  google_refresh_token: string | null;
  google_calendar_id: string | null;
  plan: "trial" | "flexible" | "starter" | "pro";
  partita_iva: string | null;
  trial_used: boolean;
  trial_started_at: string | null;
  custom_info: string | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  business_id: string;
  telegram_chat_id: string;
  customer_name: string;
  language: "it" | "en";
  last_message_at: string;
  awaiting_feedback: boolean;
  created_at: string;
}

export interface Feedback {
  id: string;
  business_id: string;
  conversation_id: string;
  booking_id: string | null;
  rating: number | null;
  comment: string | null;
  created_at: string;
  conversations?: { customer_name: string };
}

export interface Message {
  id: string;
  conversation_id: string;
  text: string;
  sender: "customer" | "ai";
  created_at: string;
}

export interface Booking {
  id: string;
  business_id: string;
  conversation_id: string;
  customer_name: string;
  date: string;
  time: string;
  party_size: number;
  google_event_id: string | null;
  status: "confirmed" | "cancelled";
  feedback_sent_at: string | null;
  created_at: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    text?: string;
    voice?: {
      file_id: string;
      file_unique_id: string;
      duration: number;
      mime_type?: string;
      file_size?: number;
    };
    date: number;
  };
  callback_query?: {
    id: string;
    from: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    message?: {
      chat: { id: number };
    };
    data: string;
  };
}
