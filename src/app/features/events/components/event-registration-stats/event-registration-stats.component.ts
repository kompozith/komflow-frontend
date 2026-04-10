import {
  Component,
  DestroyRef,
  inject,
  Input,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { NgApexchartsModule } from 'ng-apexcharts';

import { MaterialModule } from 'src/app/material.module';
import {
  EventRegistrationStats,
  EventService,
} from 'src/app/features/core/services/event.service';

export type FilterMode = 'all' | 'today' | '7d' | '30d' | '1y' | 'range';
type BreakdownKey = 'countByLanguage' | 'countByCountry' | 'countByCivility' | 'countByAgeRange' | 'countByProfession';

const FILTER_STORAGE_KEY = 'event-stats-filter';

export interface FilterPreset { mode: FilterMode; label: string; }
export interface BreakdownOption { key: BreakdownKey; label: string; }

@Component({
  selector: 'app-event-registration-stats',
  standalone: true,
  imports: [CommonModule, MaterialModule, NgApexchartsModule, ReactiveFormsModule],
  templateUrl: './event-registration-stats.component.html',
  styleUrl: './event-registration-stats.component.scss',
})
export class EventRegistrationStatsComponent implements OnInit {
  @Input() eventId!: number;

  private readonly eventService = inject(EventService);
  private readonly destroyRef   = inject(DestroyRef);

  stats       = signal<EventRegistrationStats | null>(null);
  loading     = signal(true);
  error       = signal(false);
  sseConnected = signal(false);
  flashActive  = signal(false);

  filterMode = signal<FilterMode>(
    (localStorage.getItem(FILTER_STORAGE_KEY) as FilterMode) ?? '30d'
  );

  readonly rangeFromCtrl = new FormControl<Date | null>(null);
  readonly rangeToCtrl   = new FormControl<Date | null>(null);

  selectedBreakdown = signal<BreakdownKey>('countByCountry');

  readonly filterPresets: FilterPreset[] = [
    { mode: 'all',   label: 'Tout' },
    { mode: 'today', label: "Auj." },
    { mode: '7d',    label: '7 j' },
    { mode: '30d',   label: '30 j' },
    { mode: '1y',    label: '1 an' },
    { mode: 'range', label: 'Plage' },
  ];

  readonly breakdownOptions: BreakdownOption[] = [
    { key: 'countByCountry',    label: 'Pays' },
    { key: 'countByLanguage',   label: 'Langue' },
    { key: 'countByCivility',   label: 'Civilite' },
    { key: 'countByAgeRange',   label: "Tranche d'age" },
    { key: 'countByProfession', label: 'Profession' },
  ];

  // Chart configs  pattern Partial<any>|any standard projet ng-apexcharts
  sparklineChart: Partial<any> | any = {};
  donutChart:     Partial<any> | any = {};

  // --- Computed ---

  filterLabel = computed(() => {
    switch (this.filterMode()) {
      case 'all':   return 'toutes periodes';
      case 'today': return "aujourd'hui";
      case '7d':    return 'ces 7 jours';
      case '30d':   return 'ces 30 jours';
      case '1y':    return 'cette annee';
      case 'range': {
        const f = this.rangeFromCtrl.value;
        const t = this.rangeToCtrl.value;
        if (f && t) return `${this.fmtDate(f)} au ${this.fmtDate(t)}`;
        return 'plage personnalisee';
      }
    }
  });

  prevFilterLabel = computed(() => {
    switch (this.filterMode()) {
      case 'all':   return '';
      case 'today': return 'hier';
      case '7d':    return 'sem. prec.';
      case '30d':   return 'mois prec.';
      case '1y':    return 'an prec.';
      case 'range': return 'periode prec.';
    }
  });

  trendIsMonthly = computed(() => {
    const t = this.stats()?.dailyTrend;
    return t && t.length > 0 && t[0].date.length === 7; // yyyy-MM
  });

  trendTitle = computed(() =>
    this.trendIsMonthly() ? 'Tendance mensuelle' : 'Tendance journaliere'
  );

  currentCount  = computed(() => this.stats()?.newInPeriod      ?? 0);
  previousCount = computed(() => this.stats()?.previousPeriodCount ?? 0);
  growthRate    = computed(() => this.stats()?.growthRatePeriod  ?? 0);

  showGrowth = computed(() =>
    this.filterMode() !== 'all' && this.previousCount() > 0
  );

  breakdownHasData = computed(() => {
    const s = this.stats();
    if (!s) return false;
    return Object.keys(s[this.selectedBreakdown()] ?? {}).length > 0;
  });

  sparklineHasData = computed(() =>
    (this.stats()?.dailyTrend?.length ?? 0) > 0
  );

  ngOnInit(): void {
    this.loadStats();
    this.startSseStream();
    this.rangeToCtrl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(val => {
        if (val && this.rangeFromCtrl.value) this.loadStats();
      });
  }

  private computeWindow(): { from?: string; to?: string } {
    const now = new Date();
    switch (this.filterMode()) {
      case 'all':   return {};
      case 'today': {
        const s = new Date(now); s.setUTCHours(0, 0, 0, 0);
        return { from: s.toISOString(), to: now.toISOString() };
      }
      case '7d':  return { from: new Date(now.getTime() - 7   * 86400_000).toISOString(), to: now.toISOString() };
      case '30d': return { from: new Date(now.getTime() - 30  * 86400_000).toISOString(), to: now.toISOString() };
      case '1y':  return { from: new Date(now.getTime() - 365 * 86400_000).toISOString(), to: now.toISOString() };
      case 'range': {
        const f = this.rangeFromCtrl.value;
        const t = this.rangeToCtrl.value;
        if (!f || !t) return {};
        const from = new Date(f); from.setUTCHours(0,  0,  0,   0);
        const to   = new Date(t); to.setUTCHours(23, 59, 59, 999);
        return { from: from.toISOString(), to: to.toISOString() };
      }
    }
  }

  loadStats(): void {
    if (this.filterMode() === 'range' && (!this.rangeFromCtrl.value || !this.rangeToCtrl.value)) return;
    this.loading.set(true);
    this.error.set(false);
    const { from, to } = this.computeWindow();
    this.eventService
      .getEventRegistrationStats(this.eventId, from, to)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: stats => {
          this.stats.set(stats);
          this.rebuildCharts(stats);
          this.loading.set(false);
        },
        error: () => { this.error.set(true); this.loading.set(false); },
      });
  }

  private startSseStream(): void {
    this.eventService
      .streamEventRegistrationStats(this.eventId)
      .pipe(
        catchError(() => { this.sseConnected.set(false); return of(null); }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(incoming => {
        if (incoming) {
          this.sseConnected.set(true);
          this.triggerFlash();
          this.loadStats(); // Rafraichit la vue filtree
        } else {
          this.sseConnected.set(false);
        }
      });
  }

  private rebuildCharts(stats: EventRegistrationStats): void {
    this.rebuildSparkline(stats);
    this.rebuildDonut(stats);
  }

  private rebuildSparkline(stats: EventRegistrationStats): void {
    const trend  = stats.dailyTrend ?? [];
    const labels = trend.map((d: any) => d.date);
    const showLabels = trend.length <= 31;
    this.sparklineChart = {
      series:      [{ name: 'Inscriptions', data: trend.map((d: any) => d.count) }],
      chart:       { type: 'bar', height: 180, toolbar: { show: false } },
      plotOptions: { bar: { columnWidth: '65%', borderRadius: 3 } },
      dataLabels:  { enabled: false },
      stroke:      { show: false },
      fill:        { opacity: 1 },
      colors:      ['#5D87FF'],
      xaxis: {
        categories: labels,
        labels:     { show: showLabels, rotate: -45, style: { fontSize: '10px' } },
        axisBorder: { show: false },
        axisTicks:  { show: false },
      },
      yaxis:   { show: true, labels: { style: { fontSize: '10px' } } },
      tooltip: { enabled: true },
      legend:  { show: false },
      grid:    { show: true, strokeDashArray: 4, borderColor: '#f0f0f0' },
    };
  }

  private rebuildDonut(stats: EventRegistrationStats): void {
    const raw    = stats[this.selectedBreakdown()] ?? {};
    const labels = Object.keys(raw);
    const series = Object.values(raw).map((v: any) => Number(v));
    this.donutChart = {
      series,
      chart:      { type: 'donut', height: 200, toolbar: { show: false } },
      labels,
      dataLabels: { enabled: false },
      legend:     { show: true, position: 'right', fontSize: '12px' },
      stroke:     { width: 2, colors: ['#fff'] },
      tooltip:    { enabled: true },
      plotOptions: { pie: { donut: { size: '65%', labels: {
        show: true,
        total: { show: true, label: 'Total', fontSize: '13px', fontWeight: 600 },
      }}}},
      colors: ['#5D87FF', '#49BEFF', '#13DEB9', '#FA896B', '#FFAE1F', '#cccccc'],
    };
  }

  private triggerFlash(): void {
    this.flashActive.set(true);
    setTimeout(() => this.flashActive.set(false), 900);
  }

  setFilter(mode: FilterMode): void {
    this.filterMode.set(mode);
    localStorage.setItem(FILTER_STORAGE_KEY, mode);
    if (mode !== 'range') {
      this.loadStats();
    } else {
      this.rangeFromCtrl.reset();
      this.rangeToCtrl.reset();
    }
  }

  onBreakdownChange(key: BreakdownKey): void {
    this.selectedBreakdown.set(key);
    const s = this.stats();
    if (s) this.rebuildDonut(s);
  }

  private fmtDate(date: Date): string {
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  formatGrowth(rate: number): string {
    if (rate === 0) return '-';
    return `${rate > 0 ? '+' : ''}${rate.toFixed(1)}%`;
  }

  growthClass(rate: number): string {
    if (rate > 0) return 'text-success';
    if (rate < 0) return 'text-error';
    return 'text-muted';
  }

  growthIcon(rate: number): string {
    if (rate > 0) return 'arrow_upward';
    if (rate < 0) return 'arrow_downward';
    return 'remove';
  }
}
