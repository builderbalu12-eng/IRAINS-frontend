import { Component, Input } from '@angular/core';
import { AdminActivityUser } from 'src/app/services/admin-activity-log.service';

@Component({
  selector: 'app-officer-identity-card',
  templateUrl: './officer-identity-card.component.html',
  styleUrls: ['./officer-identity-card.component.css'],
})
export class OfficerIdentityCardComponent {
  @Input() officer: AdminActivityUser | null = null;
  @Input() label = 'Acting Officer';
  @Input() compact = false;

  initials(name: string): string {
    const parts = (name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  avatarGradient(name: string): string {
    const palette = [
      ['#6366f1', '#8b5cf6'],
      ['#0891b2', '#06b6d4'],
      ['#059669', '#34d399'],
      ['#d97706', '#fbbf24'],
      ['#dc2626', '#f87171'],
      ['#7c3aed', '#c084fc'],
      ['#db2777', '#f472b6'],
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const [a, b] = palette[Math.abs(hash) % palette.length];
    return `linear-gradient(135deg, ${a} 0%, ${b} 100%)`;
  }
}
