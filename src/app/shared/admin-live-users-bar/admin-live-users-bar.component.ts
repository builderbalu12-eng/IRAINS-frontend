import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { AdminRealtimeService, PresenceUser } from 'src/app/services/admin-realtime.service';

@Component({
  selector: 'app-admin-live-users-bar',
  templateUrl: './admin-live-users-bar.component.html',
  styleUrls: ['./admin-live-users-bar.component.css'],
})
export class AdminLiveUsersBarComponent {
  readonly liveUsers$: Observable<PresenceUser[]>;
  readonly connected$: Observable<boolean>;

  constructor(private realtime: AdminRealtimeService) {
    this.liveUsers$ = this.realtime.liveUsers$;
    this.connected$ = this.realtime.connected$;
  }

  initials(user: PresenceUser): string {
    const parts = (user.emp_name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  avatarColor(name: string): string {
    const palette = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed', '#db2777'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return palette[Math.abs(hash) % palette.length];
  }

  tooltip(user: PresenceUser): string {
    const parts = [user.emp_name];
    if (user.emp_designation) parts.push(user.emp_designation);
    return parts.join(' · ');
  }
}
