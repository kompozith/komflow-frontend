export interface PublicEventAgendaItem {
  time: string;
  title: string;
  speaker: string;
  description: string;
}

export interface PublicEventSchedule {
  timezoneLabel: string;
  rangeSameDay: boolean;
  singleDateTime?: string | null;
  sameDayDate?: string | null;
  sameDayTimeRange?: string | null;
  startDateTime?: string | null;
  endDateTime?: string | null;
}

export interface PublicEventDetails {
  slug: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  mode?: 'ONSITE' | 'ONLINE' | null;
  startsAt: string;
  endsAt?: string | null;
  location?: string | null;
  address?: string | null;
  meetingUrl?: string | null;
  bannerImageUrl?: string | null;
  highlights: string[];
  agenda: PublicEventAgendaItem[];
  schedule?: PublicEventSchedule | null;
}

export interface PublicEventRegistrationRequest {
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  whatsappNumber?: boolean;
  language?: string;
  country?: string;
  city?: string;
  timezone?: string;
  civility?: string;
  profession?: string;
  ageRange?: string;
  objectives?: string;
  websiteUrl?: string;
}

export interface PublicEventRegistrationResponse {
  status: 'CREATED' | 'UPDATED' | 'UNCHANGED' | string;
  message: string;
  eventSlug: string;
  contactId: number;
  personId: number;
}
