import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environment/environment';

interface TableInfo {
  table_name: string;
  approx_rows: number;
  data_size: string;
  index_size: string;
  total_size: string;
  total_bytes: number;
}

interface DbOverview {
  db_name: string;
  db_size: string;
  db_bytes: number;
  pg_version: string;
}

interface DiskInfo {
  total: string;
  used: string;
  free: string;
  pct_used: string;
  total_bytes: number;
  used_bytes: number;
  free_bytes: number;
}

@Component({
  selector: 'app-db-info',
  templateUrl: './db-info.component.html',
  styleUrls: ['./db-info.component.css']
})
export class DbInfoComponent implements OnInit {
  loading = true;
  error = '';

  db: DbOverview | null = null;
  disk: DiskInfo | null = null;
  tables: TableInfo[] = [];
  allDbs: { name: string; size: string; bytes: number }[] = [];

  searchText = '';
  sortCol: keyof TableInfo = 'total_bytes';
  sortDir: 'asc' | 'desc' = 'desc';

  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.error = '';
    this.http.get<any>(`${this.baseUrl}/api/v1/getDbInfo`).subscribe({
      next: (res) => {
        this.db     = res.db;
        this.disk   = res.disk;
        this.tables = res.tables ?? [];
        this.allDbs = res.all_dbs ?? [];
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.error || 'Failed to load database info.';
        this.loading = false;
      }
    });
  }

  get filtered(): TableInfo[] {
    const q = this.searchText.toLowerCase();
    const rows = q
      ? this.tables.filter(t => t.table_name.toLowerCase().includes(q))
      : [...this.tables];
    return rows.sort((a, b) => {
      const va = a[this.sortCol] as any;
      const vb = b[this.sortCol] as any;
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return this.sortDir === 'asc' ? cmp : -cmp;
    });
  }

  sort(col: keyof TableInfo): void {
    if (this.sortCol === col) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortCol = col;
      this.sortDir = col === 'total_bytes' || col === 'approx_rows' ? 'desc' : 'asc';
    }
  }

  diskUsedPct(): number {
    if (!this.disk) return 0;
    return Math.round((this.disk.used_bytes / this.disk.total_bytes) * 100);
  }

  dbUsedPct(): number {
    if (!this.disk || !this.db) return 0;
    return Math.round((this.db.db_bytes / this.disk.total_bytes) * 100);
  }

  pgVersionShort(): string {
    return this.db?.pg_version?.split(' ')[1] ?? '';
  }

  pgVersionFull(): string {
    return this.db?.pg_version?.split('on')[0]?.trim() ?? '';
  }
}
