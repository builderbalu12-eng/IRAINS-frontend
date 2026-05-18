import { Component, OnInit } from '@angular/core';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DisplayOrderService } from '../../services/district/display-order.service';

interface DistrictRow {
  display_order: number;
  parent_group_order: number;
  parent_group_name: string;
  subdiv_code: number;
  subdiv_name: string;
  state_code: number;
  state_name: string;
  district_code: number;
  district_name: string;
  is_common: boolean;
}

interface StateRow {
  display_order: number;
  region_code: number;
  region_name: string;
  state_code: number;
  state_name: string;
}

interface SubdivRow {
  display_order: number;
  region_code: number;
  region_name: string;
  subdiv_code: number;
  subdivision_name: string;
}

interface NormalRow {
  id: number;
  region_name: string;
  region_code: number;
  subdiv_name: string;
  subdiv_code: number;
  sd: number;
  state_name: string;
  state_code: number;
  rst: number;
  district_name: string;
  district_code: number;
  ddd: number;
}

@Component({
  selector: 'app-display-order-management',
  templateUrl: './display-order-management.component.html',
  styleUrls: ['./display-order-management.component.css']
})
export class DisplayOrderManagementComponent implements OnInit {

  // ── Districts tab ──────────────────────────────────────────────
  flatDistricts: DistrictRow[] = [];
  districtLoading = false;
  districtSaving = false;
  showAddDialog = false;

  addForm = {
    parent_group_order: null as number | null,
    parent_group_name: '',
    subdiv_code: null as number | null,
    subdiv_name: '',
    state_code: null as number | null,
    state_name: '',
    district_code: null as number | null,
    district_name: '',
    is_common: false,
    insert_after: null as number | null,
  };

  normalRows: NormalRow[] = [];
  filteredNormalRows: NormalRow[] = [];
  addSearchText = '';
  normalLoading = false;

  // ── States tab ─────────────────────────────────────────────────
  flatStates: StateRow[] = [];
  stateLoading = false;
  stateSaving = false;
  showAddStateDialog = false;
  addStateForm = { region_code: null as number|null, region_name: '', state_code: null as number|null, state_name: '', insert_after: null as number|null };
  stateSearchText = '';
  filteredStateRows: NormalRow[] = [];

  // ── Subdivisions tab ───────────────────────────────────────────
  flatSubdivs: SubdivRow[] = [];
  subdivLoading = false;
  subdivSaving = false;
  showAddSubdivDialog = false;
  addSubdivForm = { region_code: null as number|null, region_name: '', subdiv_code: null as number|null, subdivision_name: '', insert_after: null as number|null };
  subdivSearchText = '';
  filteredSubdivRows: { subdiv_code: number; subdiv_name: string; region_code: number; region_name: string }[] = [];

  regionNameMap = new Map<number, string>();

  activeTab = 0;

  constructor(
    private svc: DisplayOrderService,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadDistricts();
    this.loadStates();
    this.loadSubdivs();
    this.loadNormalDetails();
  }

  // ──────────────────────────────────────────────────────────────
  // DISTRICTS TAB
  // ──────────────────────────────────────────────────────────────

  loadDistricts(): void {
    this.districtLoading = true;
    this.svc.getDistrictDisplayOrder().subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : (res.data ?? []);
        this.flatDistricts = [...data].sort((a, b) => a.display_order - b.display_order);
        this.districtLoading = false;
      },
      error: () => {
        this.snack.open('Failed to load district display order', 'Close', { duration: 3000 });
        this.districtLoading = false;
      }
    });
  }

  onDistrictDrop(event: CdkDragDrop<DistrictRow[]>): void {
    moveItemInArray(this.flatDistricts, event.previousIndex, event.currentIndex);
  }

  saveDistrictOrder(): void {
    this.districtSaving = true;
    const orders = this.flatDistricts.map((d, i) => ({
      old_display_order: d.display_order,
      new_display_order: i + 1
    }));
    this.svc.updateDistrictDisplayOrders(orders).subscribe({
      next: () => {
        this.flatDistricts.forEach((d, i) => d.display_order = i + 1);
        this.snack.open('District order saved', 'Close', { duration: 2000 });
        this.districtSaving = false;
      },
      error: () => {
        this.snack.open('Failed to save district order', 'Close', { duration: 3000 });
        this.districtSaving = false;
      }
    });
  }

  deleteDistrict(row: DistrictRow, idx: number): void {
    if (!confirm(`Delete "${row.district_name}" from display order?`)) return;
    this.svc.deleteDistrictDisplayOrderEntry(row.display_order).subscribe({
      next: () => {
        this.flatDistricts.splice(idx, 1);
        this.snack.open('Deleted', 'Close', { duration: 2000 });
      },
      error: () => this.snack.open('Delete failed', 'Close', { duration: 3000 })
    });
  }

  openAddDialog(): void {
    this.addForm = {
      parent_group_order: null, parent_group_name: '',
      subdiv_code: null, subdiv_name: '',
      state_code: null, state_name: '',
      district_code: null, district_name: '',
      is_common: false, insert_after: null
    };
    this.addSearchText = '';
    this.filteredNormalRows = this.normalRows.slice(0, 50);
    this.showAddDialog = true;
  }

  onAddSearch(): void {
    const q = this.addSearchText.toLowerCase();
    this.filteredNormalRows = this.normalRows
      .filter(r => r.district_name.toLowerCase().includes(q) || r.subdiv_name.toLowerCase().includes(q) || r.state_name.toLowerCase().includes(q))
      .slice(0, 80);
  }

  selectNormalRow(row: NormalRow): void {
    this.addForm.district_code = row.district_code;
    this.addForm.district_name = row.district_name;
    this.addForm.state_code = row.state_code;
    this.addForm.state_name = row.state_name;
    this.addForm.subdiv_code = row.subdiv_code;
    this.addForm.subdiv_name = row.subdiv_name;
    this.addSearchText = row.district_name;
    this.filteredNormalRows = [];
  }

  submitAdd(): void {
    if (!this.addForm.district_code) {
      this.snack.open('Select a district', 'Close', { duration: 2000 });
      return;
    }
    const entry = {
      parent_group_order: this.addForm.parent_group_order ?? 99,
      parent_group_name: this.addForm.parent_group_name,
      subdiv_code: this.addForm.subdiv_code,
      subdiv_name: this.addForm.subdiv_name,
      state_code: this.addForm.state_code,
      state_name: this.addForm.state_name,
      district_code: this.addForm.district_code,
      district_name: this.addForm.district_name,
      is_common: this.addForm.is_common,
      insert_after: this.addForm.insert_after ?? this.flatDistricts.length
    };
    this.svc.addDistrictDisplayOrderEntry(entry).subscribe({
      next: () => {
        this.snack.open('Added. Reloading...', 'Close', { duration: 2000 });
        this.showAddDialog = false;
        this.loadDistricts();
      },
      error: () => this.snack.open('Add failed', 'Close', { duration: 3000 })
    });
  }

  loadNormalDetails(): void {
    this.normalLoading = true;
    this.svc.getNormalDistrictDetails().subscribe({
      next: (data) => {
        this.normalRows = data;
        this.filteredNormalRows = data.slice(0, 50);
        // Build region code → name map for display
        data.forEach((r: NormalRow) => {
          if (r.region_code && r.region_name) this.regionNameMap.set(r.region_code, r.region_name);
        });
        this.normalLoading = false;
      },
      error: () => { this.normalLoading = false; }
    });
  }

  // ── State add/delete helpers ───────────────────────────────────

  openAddStateDialog(): void {
    this.addStateForm = { region_code: null, region_name: '', state_code: null, state_name: '', insert_after: null };
    this.stateSearchText = '';
    this.filteredStateRows = this.normalRows.slice(0, 50);
    this.showAddStateDialog = true;
  }

  onStateSearch(): void {
    const q = this.stateSearchText.toLowerCase();
    this.filteredStateRows = this.normalRows
      .filter(r => r.state_name.toLowerCase().includes(q) || r.region_name.toLowerCase().includes(q))
      .filter((r, i, arr) => arr.findIndex(x => x.state_code === r.state_code) === i)
      .slice(0, 60);
  }

  selectStateRow(row: NormalRow): void {
    this.addStateForm.state_code = row.state_code;
    this.addStateForm.state_name = row.state_name;
    this.addStateForm.region_code = row.region_code;
    this.addStateForm.region_name = row.region_name;
    this.stateSearchText = row.state_name;
    this.filteredStateRows = [];
  }

  submitAddState(): void {
    if (!this.addStateForm.state_code) {
      this.snack.open('Select a state', 'Close', { duration: 2000 });
      return;
    }
    const entry = {
      region_code: this.addStateForm.region_code,
      region_name: this.addStateForm.region_name,
      state_code: this.addStateForm.state_code,
      state_name: this.addStateForm.state_name,
      insert_after: this.addStateForm.insert_after ?? this.flatStates.length
    };
    this.svc.addStateDisplayOrderEntry(entry).subscribe({
      next: () => {
        this.snack.open('Added. Reloading...', 'Close', { duration: 2000 });
        this.showAddStateDialog = false;
        this.loadStates();
      },
      error: () => this.snack.open('Add failed', 'Close', { duration: 3000 })
    });
  }

  deleteState(row: StateRow, idx: number): void {
    if (!confirm(`Delete "${row.state_name}" from state display order?`)) return;
    this.svc.deleteStateDisplayOrderEntry(row.display_order).subscribe({
      next: () => {
        this.flatStates.splice(idx, 1);
        this.snack.open('Deleted', 'Close', { duration: 2000 });
      },
      error: () => this.snack.open('Delete failed', 'Close', { duration: 3000 })
    });
  }

  // ── Subdivision add/delete helpers ─────────────────────────────

  openAddSubdivDialog(): void {
    this.addSubdivForm = { region_code: null, region_name: '', subdiv_code: null, subdivision_name: '', insert_after: null };
    this.subdivSearchText = '';
    // Build unique subdiv list from normalRows
    const seen = new Set<number>();
    this.filteredSubdivRows = this.normalRows
      .filter(r => { if (seen.has(r.subdiv_code)) return false; seen.add(r.subdiv_code); return true; })
      .map(r => ({ subdiv_code: r.subdiv_code, subdiv_name: r.subdiv_name, region_code: r.region_code, region_name: r.region_name }))
      .slice(0, 60);
    this.showAddSubdivDialog = true;
  }

  onSubdivSearch(): void {
    const q = this.subdivSearchText.toLowerCase();
    const seen = new Set<number>();
    this.filteredSubdivRows = this.normalRows
      .filter(r => r.subdiv_name.toLowerCase().includes(q) || r.region_name.toLowerCase().includes(q))
      .filter(r => { if (seen.has(r.subdiv_code)) return false; seen.add(r.subdiv_code); return true; })
      .map(r => ({ subdiv_code: r.subdiv_code, subdiv_name: r.subdiv_name, region_code: r.region_code, region_name: r.region_name }))
      .slice(0, 60);
  }

  selectSubdivRow(row: { subdiv_code: number; subdiv_name: string; region_code: number; region_name: string }): void {
    this.addSubdivForm.subdiv_code = row.subdiv_code;
    this.addSubdivForm.subdivision_name = row.subdiv_name;
    this.addSubdivForm.region_code = row.region_code;
    this.addSubdivForm.region_name = row.region_name;
    this.subdivSearchText = row.subdiv_name;
    this.filteredSubdivRows = [];
  }

  submitAddSubdiv(): void {
    if (!this.addSubdivForm.subdiv_code) {
      this.snack.open('Select a subdivision', 'Close', { duration: 2000 });
      return;
    }
    const entry = {
      region_code: this.addSubdivForm.region_code,
      region_name: this.addSubdivForm.region_name,
      subdiv_code: this.addSubdivForm.subdiv_code,
      subdivision_name: this.addSubdivForm.subdivision_name,
      insert_after: this.addSubdivForm.insert_after ?? this.flatSubdivs.length
    };
    this.svc.addSubdivisionDisplayOrderEntry(entry).subscribe({
      next: () => {
        this.snack.open('Added. Reloading...', 'Close', { duration: 2000 });
        this.showAddSubdivDialog = false;
        this.loadSubdivs();
      },
      error: () => this.snack.open('Add failed', 'Close', { duration: 3000 })
    });
  }

  deleteSubdiv(row: SubdivRow, idx: number): void {
    if (!confirm(`Delete "${row.subdivision_name}" from subdivision display order?`)) return;
    this.svc.deleteSubdivisionDisplayOrderEntry(row.display_order).subscribe({
      next: () => {
        this.flatSubdivs.splice(idx, 1);
        this.snack.open('Deleted', 'Close', { duration: 2000 });
      },
      error: () => this.snack.open('Delete failed', 'Close', { duration: 3000 })
    });
  }

  // ──────────────────────────────────────────────────────────────
  // STATES TAB  (state_display_order table)
  // ──────────────────────────────────────────────────────────────

  loadStates(): void {
    this.stateLoading = true;
    this.svc.getStateDisplayOrder().subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : (res.data ?? []);
        this.flatStates = [...data].sort((a, b) => a.display_order - b.display_order);
        this.stateLoading = false;
      },
      error: () => {
        this.snack.open('Failed to load state display order', 'Close', { duration: 3000 });
        this.stateLoading = false;
      }
    });
  }

  onStateDrop(event: CdkDragDrop<StateRow[]>): void {
    moveItemInArray(this.flatStates, event.previousIndex, event.currentIndex);
  }

  saveStateOrder(): void {
    this.stateSaving = true;
    const orders = this.flatStates.map((s, i) => ({
      old_display_order: s.display_order,
      new_display_order: i + 1
    }));
    this.svc.updateStateDisplayOrders(orders).subscribe({
      next: () => {
        this.flatStates.forEach((s, i) => s.display_order = i + 1);
        this.snack.open('State order saved', 'Close', { duration: 2000 });
        this.stateSaving = false;
      },
      error: () => {
        this.snack.open('Failed to save state order', 'Close', { duration: 3000 });
        this.stateSaving = false;
      }
    });
  }

  // ──────────────────────────────────────────────────────────────
  // SUBDIVISIONS TAB  (subdivision_display_order table)
  // ──────────────────────────────────────────────────────────────

  loadSubdivs(): void {
    this.subdivLoading = true;
    this.svc.getSubdivisionDisplayOrder().subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : (res.data ?? []);
        this.flatSubdivs = [...data].sort((a, b) => a.display_order - b.display_order);
        this.subdivLoading = false;
      },
      error: () => {
        this.snack.open('Failed to load subdivision display order', 'Close', { duration: 3000 });
        this.subdivLoading = false;
      }
    });
  }

  onSubdivDrop(event: CdkDragDrop<SubdivRow[]>): void {
    moveItemInArray(this.flatSubdivs, event.previousIndex, event.currentIndex);
  }

  saveSubdivOrder(): void {
    this.subdivSaving = true;
    const orders = this.flatSubdivs.map((s, i) => ({
      old_display_order: s.display_order,
      new_display_order: i + 1
    }));
    this.svc.updateSubdivisionDisplayOrders(orders).subscribe({
      next: () => {
        this.flatSubdivs.forEach((s, i) => s.display_order = i + 1);
        this.snack.open('Subdivision order saved', 'Close', { duration: 2000 });
        this.subdivSaving = false;
      },
      error: () => {
        this.snack.open('Failed to save subdivision order', 'Close', { duration: 3000 });
        this.subdivSaving = false;
      }
    });
  }

  onTabChange(index: number): void {
    this.activeTab = index;
  }
}
