import { Component, Input } from '@angular/core';
import { ActivityLogRecord } from 'src/app/services/admin-activity-log.service';

@Component({
  selector: 'app-activity-log-timeline',
  templateUrl: './activity-log-timeline.component.html',
  styleUrls: ['./activity-log-timeline.component.css'],
})
export class ActivityLogTimelineComponent {
  @Input() logs: ActivityLogRecord[] = [];
  @Input() loading = false;
  @Input() emptyMessage = 'No activity recorded yet for this page.';

  formatWhen(row: ActivityLogRecord): string {
    const date = row.action_date ? String(row.action_date).slice(0, 10) : '';
    const time = row.action_time ? String(row.action_time).slice(0, 8) : '';
    return [date, time].filter(Boolean).join(' · ');
  }

  formatValue(value: unknown): string {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }
    return String(value);
  }

  hasDiff(row: ActivityLogRecord): boolean {
    return !!(row.old_value || row.new_value || row.changed_field);
  }

  actionClass(action: string | null | undefined): string {
    const value = (action || '').toUpperCase();
    if (value.includes('ADD') || value.includes('CREATE') || value.includes('INSERT')) return 'action-add';
    if (value.includes('DELETE') || value.includes('REMOVE')) return 'action-delete';
    if (value.includes('UPDATE') || value.includes('EDIT') || value.includes('REPLACE')) return 'action-update';
    if (value.includes('PAGE_ACCESS')) return 'action-access';
    return 'action-default';
  }

  initials(name: string): string {
    const parts = (name || '').trim().split(/\s+/).filter(Boolean);
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
}
