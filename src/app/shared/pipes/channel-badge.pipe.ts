import { Pipe, PipeTransform } from '@angular/core';
import { BadgeVariant } from '../components/badge/badge.component';

/** Map un canal message → variante de badge et libellé affichable. */
export interface ChannelBadge {
  label: string;
  variant: BadgeVariant;
  icon: string; // nom icône Tabler
}

const CHANNEL_MAP: Record<string, ChannelBadge> = {
  EMAIL:    { label: 'Email',    variant: 'info',    icon: 'mail'          },
  SMS:      { label: 'SMS',      variant: 'success', icon: 'message'       },
  WHATSAPP: { label: 'WhatsApp', variant: 'success', icon: 'brand-whatsapp' },
};

const FALLBACK: ChannelBadge = { label: 'Inconnu', variant: 'secondary', icon: 'help-circle' };

@Pipe({ name: 'channelBadge', standalone: true, pure: true })
export class ChannelBadgePipe implements PipeTransform {
  transform(channel: string | null | undefined): ChannelBadge {
    if (!channel) return FALLBACK;
    return CHANNEL_MAP[channel.toUpperCase()] ?? FALLBACK;
  }
}
