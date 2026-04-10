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
  plan: "starter" | "pro";
  created_at: string;
}

export interface Conversation {
  id: string;
  business_id: string;
  telegram_chat_id: string;
  customer_name: string;
  language: "it" | "en";
  last_message_at: string;
  created_at: string;
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
    date: number;
  };
}
