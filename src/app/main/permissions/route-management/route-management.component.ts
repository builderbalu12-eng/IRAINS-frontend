import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ManagedAppRoute, RouteAccessService } from 'src/app/services/permissions/route-access.service';

export interface RouteGroup {
  section: string;
  subsection: string;
  routes: ManagedAppRoute[];
}

@Component({
  selector: 'app-route-management',
  templateUrl: './route-management.component.html',
  styleUrls: ['./route-management.component.css']
})
export class RouteManagementComponent implements OnInit, OnDestroy {
  routes: ManagedAppRoute[] = [];
  groups: RouteGroup[] = [];
  showModal = false;
  isEditing = false;
  editingId: number | null = null;
  form!: FormGroup;
  pathError = '';
  customSection = false;
  customSubsection = false;

  /** Known top-level sections for the create form. */
  readonly presetSections = [
    'Data Management',
    'Main',
    'RAINFALL MAP',
    'RAINFALL STATISTICS',
    'SPATIAL ANALYSIS',
    'STATION STATISTICS',
  ];

  /** Default Data Management subsections (sidebar groups). */
  readonly dmSubsections = [
    'Calculation',
    'Shape file/Map Boundaries',
    'Normals',
    'Activity Log',
    'Master File',
    'Infographics',
    'Stations',
    'Automation',
    'Permissions',
  ];

  private sub = new Subscription();

  constructor(
    private fb: FormBuilder,
    private routeAccess: RouteAccessService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      label: ['', Validators.required],
      path: ['', Validators.required],
      section: ['Data Management', Validators.required],
      sectionCustom: [''],
      subsection: ['Permissions'],
      subsectionCustom: [''],
      sortOrder: [0],
      active: [true],
      showInNav: [false],
    });
    void this.routeAccess.ensureLoaded().catch((err) => {
      console.error('Failed to load routes', err);
    });
    this.sub.add(this.routeAccess.routes$.subscribe(routes => {
      this.routes = [...routes];
      this.groups = this.buildGroups(this.routes);
    }));
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  get sectionOptions(): string[] {
    const fromDb = this.routes.map(r => (r.section || '').trim()).filter(Boolean);
    return Array.from(new Set([...this.presetSections, ...fromDb])).sort((a, b) =>
      a.localeCompare(b)
    );
  }

  get subsectionOptions(): string[] {
    const section = this.resolvedSection;
    const fromDb = this.routes
      .filter(r => (r.section || '').trim() === section)
      .map(r => (r.subsection || '').trim())
      .filter(Boolean);
    const base = section === 'Data Management' ? this.dmSubsections : [];
    return Array.from(new Set([...base, ...fromDb])).sort((a, b) => a.localeCompare(b));
  }

  get resolvedSection(): string {
    if (this.customSection) {
      return String(this.form?.value?.sectionCustom || '').trim();
    }
    return String(this.form?.value?.section || '').trim();
  }

  get resolvedSubsection(): string {
    if (this.customSubsection) {
      return String(this.form?.value?.subsectionCustom || '').trim();
    }
    return String(this.form?.value?.subsection || '').trim();
  }

  onSectionChange(): void {
    if (this.form.value.section === '__custom__') {
      this.customSection = true;
      this.form.patchValue({ sectionCustom: '' });
    } else {
      this.customSection = false;
      if (this.resolvedSection === 'Data Management' && !this.customSubsection) {
        const sub = this.form.value.subsection;
        if (!this.dmSubsections.includes(sub)) {
          this.form.patchValue({ subsection: 'Permissions' });
        }
      }
    }
  }

  onSubsectionChange(): void {
    if (this.form.value.subsection === '__custom__') {
      this.customSubsection = true;
      this.form.patchValue({ subsectionCustom: '' });
    } else {
      this.customSubsection = false;
    }
  }

  openAdd(prefill?: { section?: string; subsection?: string }): void {
    this.isEditing = false;
    this.editingId = null;
    this.pathError = '';
    this.customSection = false;
    this.customSubsection = false;
    const section = prefill?.section || 'Data Management';
    const subsection = prefill?.subsection || (section === 'Data Management' ? 'Permissions' : '');
    this.form.reset({
      label: '',
      path: section === 'Data Management' ? '/data-management/' : '/',
      section,
      sectionCustom: '',
      subsection,
      subsectionCustom: '',
      sortOrder: 0,
      active: true,
      showInNav: false,
    });
    this.showModal = true;
  }

  openAddUnder(group: RouteGroup): void {
    this.openAdd({ section: group.section || 'Data Management', subsection: group.subsection });
  }

  openEdit(route: ManagedAppRoute): void {
    this.isEditing = true;
    this.editingId = route.id;
    this.pathError = '';
    const section = (route.section || '').trim();
    const subsection = (route.subsection || '').trim();
    const knownSections = this.sectionOptions;
    const knownSubs = new Set([
      ...this.dmSubsections,
      ...this.routes
        .filter(r => (r.section || '').trim() === section)
        .map(r => (r.subsection || '').trim())
        .filter(Boolean),
    ]);
    this.customSection = !!(section && !knownSections.includes(section));
    this.customSubsection = !!(subsection && !knownSubs.has(subsection));
    this.form.reset({
      label: route.label,
      path: route.path,
      section: this.customSection ? '__custom__' : (section || 'Main'),
      sectionCustom: this.customSection ? section : '',
      subsection: this.customSubsection ? '__custom__' : subsection,
      subsectionCustom: this.customSubsection ? subsection : '',
      sortOrder: route.sortOrder || 0,
      active: route.active,
      showInNav: route.showInNav !== false,
    });
    this.showModal = true;
  }

  async save(): Promise<void> {
    const label = String(this.form.value.label || '').trim();
    const path = this.routeAccess.normalizePath(String(this.form.value.path || '').trim());
    const section = this.resolvedSection;
    const subsection = this.resolvedSubsection;
    if (!label || !this.form.value.path || path === '/' || !section) {
      this.form.markAllAsTouched();
      if (!label) this.form.get('label')?.setErrors({ required: true });
      if (path === '/') this.form.get('path')?.setErrors({ required: true });
      if (!section) this.form.get('section')?.setErrors({ required: true });
      return;
    }
    const duplicate = this.routes.some(r => r.path === path && r.id !== this.editingId);
    if (duplicate) {
      this.pathError = 'A route with this path already exists.';
      return;
    }
    this.pathError = '';
    const active = !!this.form.value.active;
    const showInNav = !!this.form.value.showInNav;
    const sortOrder = Number(this.form.value.sortOrder) || 0;
    const menuPath = [section, subsection].filter(Boolean).join(' > ');
    const next = this.routes.map(r => ({ ...r, allowedRoles: [...r.allowedRoles] }));
    if (this.isEditing && this.editingId !== null) {
      const idx = next.findIndex(r => r.id === this.editingId);
      if (idx > -1) {
        next[idx] = {
          ...next[idx],
          label,
          path,
          active,
          section,
          subsection,
          menuPath,
          sortOrder,
          showInNav,
        };
      }
    } else {
      const id = next.reduce((max, r) => Math.max(max, r.id), 0) + 1;
      next.push({
        id,
        label,
        path,
        active,
        section,
        subsection,
        menuPath,
        sortOrder,
        showInNav,
        allowedRoles: section === 'Data Management' ? ['hq'] : [],
      });
    }
    try {
      await this.routeAccess.saveRoutes(next);
      this.closeModal();
    } catch (err: any) {
      this.pathError = err?.error?.message || err?.message || 'Failed to save route.';
    }
  }

  async remove(route: ManagedAppRoute): Promise<void> {
    if (!confirm(`Remove route "${route.label}"?`)) return;
    try {
      await this.routeAccess.saveRoutes(this.routes.filter(r => r.id !== route.id));
    } catch (err: any) {
      alert(err?.error?.message || err?.message || 'Failed to remove route.');
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.pathError = '';
  }

  private buildGroups(routes: ManagedAppRoute[]): RouteGroup[] {
    const map = new Map<string, RouteGroup>();
    const sorted = [...routes].sort((a, b) => {
      const s = (a.section || '').localeCompare(b.section || '');
      if (s) return s;
      const sub = (a.subsection || '').localeCompare(b.subsection || '');
      if (sub) return sub;
      return (a.sortOrder || 0) - (b.sortOrder || 0) || a.id - b.id;
    });
    for (const r of sorted) {
      const section = (r.section || '').trim() || 'Uncategorized';
      const subsection = (r.subsection || '').trim() || 'General';
      const key = `${section}|||${subsection}`;
      if (!map.has(key)) {
        map.set(key, { section, subsection, routes: [] });
      }
      map.get(key)!.routes.push(r);
    }
    return Array.from(map.values());
  }
}
