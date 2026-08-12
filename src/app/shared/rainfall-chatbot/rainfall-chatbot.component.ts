import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from 'src/app/data.service';
import { Subscription } from 'rxjs';
import {
  RainfallChatService,
  OllamaChatResponse,
  OllamaClarifyOption,
} from 'src/app/services/rainfall-chat/rainfall-chat.service';

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  time: string;
  /** District / row lines shown as a collapsible list. */
  listItems?: string[];
  listExpanded?: boolean;
  /** Deep-link from a navigation answer. */
  navLink?: { label: string; path: string } | null;
  /** Clarification buttons (local navigate/data or backend clarify). */
  choices?: ClarificationChoice[] | null;
}

interface ClarificationChoice {
  id: string;
  label: string;
  /** Local keyword clarify only (open page vs ask data). */
  localIntent?: 'navigate' | 'data';
  /** Backend option value used to rewrite the follow-up question. */
  value?: string | number;
  /** Backend which_map / product route. */
  path?: string | null;
  /** False = show but not selectable (e.g. Temperature). */
  available?: boolean;
  /** Visual group for chip styling (month / year / action). */
  variant?: 'default' | 'month' | 'year' | 'action';
  /** For Yes/No styling when variant is action. */
  emphasize?: boolean;
}

interface FormattedAnswer {
  text: string;
  listItems?: string[];
  navLink?: { label: string; path: string } | null;
}

interface QuickPrompt {
  label: string;
  query: string;
  icon: string;
  group: 'rainfall' | 'navigation';
}

interface PendingClarification {
  topic: string;
  productName: string;
  path: string;
  originalText: string;
}

/** Backend clarify waiting on a chip / follow-up. */
interface PendingBackendClarify {
  type: string;
  originalQuestion: string;
  suggestion?: string | null;
  input?: string;
  originalValue?: string | number;
  location?: string;
  from?: string;
  to?: string;
}

/** Product / page keywords that are ambiguous without navigate vs data intent. */
const PRODUCT_KEYWORDS: {
  keywords: string[];
  productName: string;
  path: string;
}[] = [
  {
    keywords: ['yearly statistics', 'yearly station statistics', 'yearly stats'],
    productName: 'Yearly Station Statistics',
    path: '/yearlystationstatistics',
  },
  {
    keywords: ['all statistics', 'all stats'],
    productName: 'All Statistics',
    path: '/all-statistics',
  },
  {
    keywords: [
      'spatial distribution',
      'spatial table',
      'spatial map',
      'spatial',
    ],
    productName: 'Spatial Distribution Table',
    path: '/spatial-table',
  },
  {
    keywords: ['monsoon activity', 'monsoon'],
    productName: 'Monsoon Activity',
    path: '/monsoon-activity',
  },
  {
    keywords: ['station level data', 'station data'],
    productName: 'Station Level Data',
    path: '/station-level-data',
  },
  {
    keywords: ['station statistics', 'station stats'],
    productName: 'Station Statistics',
    path: '/station-statistics',
  },
  {
    keywords: ['block rainfall', 'block map'],
    productName: 'Block Rainfall Map',
    path: '/block-rainfall',
  },
  {
    keywords: [
      'annual seasonal monthly',
      'annual–seasonal–monthly',
      'annual seasonal',
    ],
    productName: 'Annual–Seasonal–Monthly Maps',
    path: '/annual-seasonal-monthly-actual-maps',
  },
  {
    keywords: ['data entry', 'verification'],
    productName: 'Data Entry / Verification',
    path: '/newverification',
  },
  {
    keywords: ['email dissemination', 'send reports', 'email reports'],
    productName: 'Email Dissemination',
    path: '/new-email-dissemination',
  },
  {
    keywords: ['pdf report', 'pdf download', 'pdf rainfall'],
    productName: 'PDF Rainfall Report Download',
    path: '/new-email-dissemination',
  },
  {
    keywords: ['mc/rmc', 'mc rmc', 'regional maps'],
    productName: 'MC/RMC Regional Maps',
    path: '/state-map-mc-rmc',
  },
  {
    keywords: ['all maps', 'maps overview'],
    productName: 'All Maps Overview',
    path: '/all-maps',
  },
  {
    keywords: ['daily actual state', 'actual state map'],
    productName: 'Daily Actual State Rainfall Map',
    path: '/daily-actual-state-map',
  },
  {
    keywords: ['pan india', 'departure district', 'district departure'],
    productName: 'Daily Departure District (Pan India) Map',
    path: '/pan-india-region',
  },
  {
    keywords: ['weekly homogenous', 'weekly homogeneous'],
    productName: 'Weekly Departure Homogenous Map',
    path: '/weekly-departure-homogenous-map',
  },
  {
    keywords: ['cumulative country', 'cummulative country'],
    productName: 'Cumulative Departure Country Map',
    path: '/cummulative-departure-country-map',
  },
];

/** Row shape returned inside ollama-chat `api.data`. */
interface ApiDataRow {
  district_name?: string;
  state_name?: string;
  subdiv_name?: string;
  name?: string;
  product_name?: string;
  route_path?: string;
  departure?: number | null;
  category?: string;
  actual?: number | null;
  actual_rainfall?: number | null;
  actual_state_rainfall?: number | null;
  actual_subdiv_rainfall?: number | null;
  actual_country_rainfall?: number | null;
  rainfall_normal_value?: number | null;
  normal_rainfall?: number | null;
  date?: string;
}

/**
 * Backend catalog routes → real Angular paths in this app.
 * Kept local so chat deep-links work even if catalog paths are placeholders.
 */
const ROUTE_ALIASES: Record<string, string> = {
  '/daily-actual-state-map': '/daily-actual-state-map',
  '/daily-departure-district-map': '/pan-india-region',
  '/weekly-departure-homogenous': '/weekly-departure-homogenous-map',
  '/cumulative-departure-country': '/cummulative-departure-country-map',
  '/block-rainfall-map': '/block-rainfall',
  '/monsoon-activity': '/monsoon-activity',
  '/spatial-distribution-table': '/spatial-table',
  '/station-level-data': '/station-level-data',
  '/station-statistics': '/station-statistics',
  '/data-entry-verification': '/newverification',
  '/maps/annual-seasonal-monthly': '/annual-seasonal-monthly-actual-maps',
  '/all-maps-overview': '/all-maps',
  '/reports/pdf-download': '/new-email-dissemination',
  '/email-dissemination': '/new-email-dissemination',
  '/mc-rmc-regional-maps': '/state-map-mc-rmc',
};

/**
 * Rainfall api_id → iRAINS page that visualizes the same product data.
 * Used so every data answer can deep-link to its source map/page.
 */
const API_SOURCE_PAGES: Record<
  string,
  { label: string; path: string; weeklyPath?: string; seasonalPath?: string }
> = {
  fetch_district_data: {
    label: 'Daily Departure District (Pan India) Map',
    path: '/pan-india-region',
    weeklyPath: '/weekly-departure-district-panindia-map',
    seasonalPath: '/cummulative-departure-district-pan-map',
  },
  fetch_state_data: {
    label: 'Daily Actual State Rainfall Map',
    path: '/daily-actual-state-map',
    weeklyPath: '/weekly-departure-state-map',
    seasonalPath: '/cummulative-departure-state-map',
  },
  fetch_subdivision_data: {
    label: 'Daily Actual Subdivision Map',
    path: '/daily-actual-subdivision-map',
    weeklyPath: '/weekly-departure-subdiv-map',
    seasonalPath: '/cummulative-departure-subdiv-map',
  },
  fetch_region_data: {
    label: 'Daily Homogeneous Region Map',
    path: '/daily-actual-homogenous-map',
    weeklyPath: '/weekly-departure-homogenous-map',
    seasonalPath: '/cummulative-departure-region-map',
  },
  fetch_country_data: {
    label: 'Daily Country Rainfall Map',
    path: '/daily-actual-country-map',
    weeklyPath: '/weekly-departure-country-map',
    seasonalPath: '/cummulative-departure-country-map',
  },
  fetch_cumulative_country_data: {
    label: 'Cumulative Departure Country Map',
    path: '/cummulative-departure-country-map',
  },
  fetch_block_data: {
    label: 'Block Rainfall Map',
    path: '/block-rainfall',
  },
  fetch_block_rainfall_analysis: {
    label: 'Block Rainfall Map',
    path: '/block-rainfall',
  },
  top_rainfall_stations: {
    label: 'Station Statistics',
    path: '/station-statistics',
  },
  get_all_districts: {
    label: 'All Maps Overview',
    path: '/all-maps',
  },
  get_all_states: {
    label: 'All Maps Overview',
    path: '/all-maps',
  },
  get_all_subdivisions: {
    label: 'All Maps Overview',
    path: '/all-maps',
  },
};

@Component({
  selector: 'app-rainfall-chatbot',
  templateUrl: './rainfall-chatbot.component.html',
  styleUrls: ['./rainfall-chatbot.component.css'],
})
export class RainfallChatbotComponent implements OnInit, OnDestroy {
  @ViewChild('messagesEnd') messagesEnd?: ElementRef<HTMLDivElement>;
  @ViewChild('chatInput') chatInput?: ElementRef<HTMLTextAreaElement>;

  open = false;
  inputText = '';
  isTyping = false;
  messages: ChatMessage[] = [];
  rainDrops: { left: number; delay: number; duration: number; height: number }[] = [];
  promptGroup: 'rainfall' | 'navigation' = 'rainfall';

  fromDate = '';
  toDate = '';
  dataMode = 'Departure';
  ollamaReady: boolean | null = null;
  ollamaModel = '';

  private msgId = 0;
  private typingTimer?: ReturnType<typeof setTimeout>;
  private askSub?: Subscription;
  private subs: Subscription[] = [];
  private pendingClarification: PendingClarification | null = null;
  private pendingBackendClarify: PendingBackendClarify | null = null;

  /** Mirrors backend SAMPLE_QUESTIONS (catalog Q1–Q25). */
  quickPrompts: QuickPrompt[] = [
    {
      label: 'Today’s rainfall',
      query: 'What is today’s rainfall for Maharashtra?',
      icon: 'bi-cloud-rain',
      group: 'rainfall',
    },
    {
      label: 'MH departure',
      query: 'What is the departure from normal for Maharashtra today?',
      icon: 'bi-graph-up-arrow',
      group: 'rainfall',
    },
    {
      label: 'Actual vs Departure',
      query: 'Show Actual vs Departure for Maharashtra from 2026-05-01 to 2026-05-10',
      icon: 'bi-arrow-left-right',
      group: 'rainfall',
    },
    {
      label: 'Deficient districts',
      query: 'Which districts are deficient / large deficient today?',
      icon: 'bi-exclamation-triangle',
      group: 'rainfall',
    },
    {
      label: 'Excess districts',
      query: 'Which districts are in excess / large excess today?',
      icon: 'bi-droplet-fill',
      group: 'rainfall',
    },
    {
      label: 'All-India today',
      query: 'What is country / all-India rainfall today?',
      icon: 'bi-globe-asia-australia',
      group: 'rainfall',
    },
    {
      label: 'Last 7 days',
      query: 'What is rainfall for last 7 days / this week?',
      icon: 'bi-calendar-week',
      group: 'rainfall',
    },
    {
      label: 'Seasonal so far',
      query: 'What is seasonal / cumulative rainfall so far?',
      icon: 'bi-calendar-range',
      group: 'rainfall',
    },
    {
      label: 'Chennai range',
      query: 'Give actual, normal and % departure for Chennai district from 01-Jul to 15-Jul.',
      icon: 'bi-geo-alt',
      group: 'rainfall',
    },
    {
      label: 'TN vs Kerala',
      query: 'Compare rainfall of Tamil Nadu vs Kerala for yesterday.',
      icon: 'bi-bar-chart',
      group: 'rainfall',
    },
    {
      label: 'Daily actual state',
      query: 'Where is the daily actual state rainfall map?',
      icon: 'bi-map',
      group: 'navigation',
    },
    {
      label: 'Departure district',
      query: 'Open daily departure district (Pan India) map.',
      icon: 'bi-map',
      group: 'navigation',
    },
    {
      label: 'Weekly homogenous',
      query: 'Where is weekly departure homogenous map?',
      icon: 'bi-map',
      group: 'navigation',
    },
    {
      label: 'Cumulative country',
      query: 'Where is cumulative departure country map?',
      icon: 'bi-map',
      group: 'navigation',
    },
    {
      label: 'Block rainfall',
      query: 'Where is block rainfall map (actual / AWS)?',
      icon: 'bi-grid-3x3',
      group: 'navigation',
    },
    {
      label: 'Monsoon activity',
      query: 'Where is monsoon activity?',
      icon: 'bi-cloud-sun',
      group: 'navigation',
    },
    {
      label: 'Spatial table',
      query: 'Where is spatial distribution / spatial table?',
      icon: 'bi-table',
      group: 'navigation',
    },
    {
      label: 'Station data',
      query: 'Where is station level data?',
      icon: 'bi-broadcast-pin',
      group: 'navigation',
    },
    {
      label: 'Station stats',
      query: 'Where is station statistics?',
      icon: 'bi-graph-up',
      group: 'navigation',
    },
    {
      label: 'Data entry',
      query: 'Where is data entry / verification?',
      icon: 'bi-pencil-square',
      group: 'navigation',
    },
    {
      label: 'Annual–seasonal',
      query: 'Where are annual–seasonal–monthly maps?',
      icon: 'bi-calendar3',
      group: 'navigation',
    },
    {
      label: 'All Maps',
      query: 'Where is All Maps home overview?',
      icon: 'bi-house',
      group: 'navigation',
    },
    {
      label: 'PDF reports',
      query: 'Where is PDF rainfall report download?',
      icon: 'bi-file-earmark-pdf',
      group: 'navigation',
    },
    {
      label: 'Email reports',
      query: 'Where is email dissemination / send reports?',
      icon: 'bi-envelope',
      group: 'navigation',
    },
    {
      label: 'MC/RMC maps',
      query: 'Where is MC/RMC state / subdiv / region map?',
      icon: 'bi-geo',
      group: 'navigation',
    },
  ];

  private dataSuggestions: string[] = this.quickPrompts
    .filter((p) => p.group === 'rainfall')
    .map((p) => p.query);
  private navSuggestions: string[] = this.quickPrompts
    .filter((p) => p.group === 'navigation')
    .map((p) => p.query);
  private readonly listPreviewCount = 5;

  constructor(
    private dataService: DataService,
    private rainfallChat: RainfallChatService,
    private router: Router
  ) {}

  get visiblePrompts(): QuickPrompt[] {
    return this.quickPrompts.filter((p) => p.group === this.promptGroup);
  }

  get showQuickChips(): boolean {
    return this.messages.length <= 2 && !this.isTyping;
  }

  ngOnInit(): void {
    this.rainDrops = Array.from({ length: 28 }, () => ({
      left: Math.random() * 100,
      delay: Math.random() * 2.4,
      duration: 0.7 + Math.random() * 0.9,
      height: 10 + Math.random() * 16,
    }));

    this.subs.push(
      this.dataService.fromAndToDate$.subscribe((value) => {
        if (!value) return;
        try {
          const dates = JSON.parse(value);
          this.fromDate = dates.fromDate || '';
          this.toDate = dates.toDate || '';
        } catch {
          /* ignore */
        }
      }),
      this.dataService.selectdatamode$.subscribe((value) => {
        if (!value) return;
        try {
          const mode = JSON.parse(value);
          this.dataMode = mode.selecteddatamode || 'Departure';
        } catch {
          /* ignore */
        }
      })
    );

    this.pushAssistant(this.welcomeText());
    this.checkOllamaHealth();
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
    this.askSub?.unsubscribe();
    if (this.typingTimer) clearTimeout(this.typingTimer);
  }

  toggle(): void {
    this.open = !this.open;
    if (this.open) {
      this.checkOllamaHealth();
      setTimeout(() => {
        this.scrollToBottom();
        this.chatInput?.nativeElement?.focus();
      }, 280);
    }
  }

  close(): void {
    this.open = false;
  }

  usePrompt(query: string): void {
    this.inputText = query;
    this.send();
  }

  setPromptGroup(group: 'rainfall' | 'navigation'): void {
    this.promptGroup = group;
  }

  openNavLink(path: string): void {
    if (!path) return;
    this.close();
    this.router.navigateByUrl(path);
  }

  /** User tapped a clarification choice button. */
  chooseClarification(choice: ClarificationChoice): void {
    if (this.isTyping) return;
    if (choice.available === false) return;

    // Local navigate-vs-data chips
    if (choice.localIntent && this.pendingClarification) {
      const pending = this.pendingClarification;
      this.clearChoicesFromMessages();
      this.pushUser(choice.label);
      this.resolveClarification(choice.localIntent, pending);
      return;
    }

    // Backend clarify chips (which map, place, timeframe, …)
    if (this.pendingBackendClarify) {
      this.resolveBackendClarify(choice);
    }
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  send(): void {
    const text = this.inputText.trim();
    if (!text || this.isTyping) return;

    this.pushUser(text);
    this.inputText = '';
    this.isTyping = true;
    this.scrollToBottom();

    // Reply to an open navigate-vs-data clarification
    if (this.pendingClarification) {
      const pending = this.pendingClarification;
      const intent = this.parseClarificationReply(text);
      this.clearChoicesFromMessages();
      if (intent) {
        this.resolveClarification(intent, pending);
        return;
      }
      // Unclear follow-up — re-ask briefly, keep pending
      this.isTyping = false;
      this.pushAssistant(
        `Please choose one option for <strong>${this.escapeHtml(
          pending.productName
        )}</strong>:`,
        undefined,
        null,
        [
          { id: 'navigate', label: 'Open the page', localIntent: 'navigate' },
          { id: 'data', label: 'Ask about rainfall data', localIntent: 'data' },
        ]
      );
      this.scrollToBottom();
      return;
    }

    // Free-text while backend clarify chips are open → try to match Yes/No or a period chip
    if (this.pendingBackendClarify) {
      const pending = this.pendingBackendClarify;
      const matched = this.matchBackendClarifyFreeText(text, pending);
      if (matched) {
        this.clearChoicesFromMessages();
        // User bubble already pushed above; resolve without duplicating the label
        this.resolveBackendClarify(matched, { skipUserBubble: true });
        return;
      }
      this.isTyping = false;
      const hint =
        pending.type === 'did_you_mean'
          ? `Please tap <strong>Yes</strong> or <strong>No</strong>.`
          : pending.type === 'which_month'
          ? `Please tap a month, a year, or type one like <em>March 2023</em>.`
          : `Please tap one of the options above.`;
      this.pushAssistant(hint);
      this.scrollToBottom();
      return;
    }

    // Ambiguous product keyword → ask navigate vs data first
    const ambiguous = this.detectAmbiguousProduct(text);
    if (ambiguous) {
      const delay = 350 + Math.min(500, text.length * 8);
      this.typingTimer = setTimeout(() => {
        this.isTyping = false;
        this.pendingClarification = {
          topic: ambiguous.topic,
          productName: ambiguous.productName,
          path: ambiguous.path,
          originalText: text,
        };
        this.pushAssistant(
          `I found <strong>${this.escapeHtml(
            ambiguous.productName
          )}</strong> in iRAINS.<br><br>` +
            `Are you looking to <strong>navigate to that page</strong>, ` +
            `or do you want <strong>rainfall data / statistics</strong> related to it?`,
          undefined,
          null,
          [
            { id: 'navigate', label: 'Open the page', localIntent: 'navigate' },
            { id: 'data', label: 'Ask about rainfall data', localIntent: 'data' },
          ]
        );
        this.scrollToBottom();
      }, delay);
      return;
    }

    if (this.isFaqOnlyQuestion(text)) {
      const delay = 450 + Math.min(800, text.length * 12);
      this.typingTimer = setTimeout(() => {
        const reply = this.composeReply(text);
        this.isTyping = false;
        this.pushAssistant(reply.text);
        this.scrollToBottom();
      }, delay);
      return;
    }

    this.askBackend(text);
  }

  clearChat(): void {
    this.askSub?.unsubscribe();
    this.isTyping = false;
    this.pendingClarification = null;
    this.pendingBackendClarify = null;
    this.messages = [];
    this.msgId = 0;
    this.pushAssistant(this.welcomeText());
  }

  trackById(_: number, msg: ChatMessage): number {
    return msg.id;
  }

  visibleListItems(msg: ChatMessage): string[] {
    const items = msg.listItems || [];
    if (msg.listExpanded || items.length <= this.listPreviewCount) return items;
    return items.slice(0, this.listPreviewCount);
  }

  expandList(msg: ChatMessage): void {
    msg.listExpanded = true;
    this.scrollToBottom();
  }

  collapseList(msg: ChatMessage): void {
    msg.listExpanded = false;
  }

  hiddenListCount(msg: ChatMessage): number {
    const n = (msg.listItems || []).length;
    return Math.max(0, n - this.listPreviewCount);
  }

  private welcomeText(): string {
    const range =
      this.fromDate && this.toDate
        ? ` for <strong>${this.fromDate}</strong> → <strong>${this.toDate}</strong>`
        : '';
    return (
      `Namaste — I'm <strong>Varsha</strong>, your iRAINS rainfall companion.` +
      `<br><br>You're on All Maps in <strong>${this.dataMode}</strong> mode${range}.` +
      `<br>Ask live rainfall (today, week, seasonal, compare states, deficient / excess), ` +
      `or <em>Where is…?</em> to open a product page.`
    );
  }

  private checkOllamaHealth(): void {
    this.rainfallChat.health().subscribe({
      next: (res) => {
        this.ollamaReady = Boolean(res?.success && res?.ollama?.up);
        this.ollamaModel = res?.ollama?.model || '';
        this.applySampleQuestionsFromHealth(res?.sample_questions);
      },
      error: () => {
        this.ollamaReady = false;
      },
    });
  }

  /** Prefer backend SAMPLE_QUESTIONS so UI stays in sync with catalog training. */
  private applySampleQuestionsFromHealth(sample?: {
    rainfall?: string[];
    navigation?: string[];
  }): void {
    if (!sample) return;
    const rainfall = Array.isArray(sample.rainfall) ? sample.rainfall : [];
    const navigation = Array.isArray(sample.navigation) ? sample.navigation : [];
    if (!rainfall.length && !navigation.length) return;

    const iconFor = (group: 'rainfall' | 'navigation', i: number): string => {
      const rainIcons = [
        'bi-cloud-rain',
        'bi-graph-up-arrow',
        'bi-arrow-left-right',
        'bi-exclamation-triangle',
        'bi-droplet-fill',
        'bi-globe-asia-australia',
        'bi-calendar-week',
        'bi-calendar-range',
        'bi-geo-alt',
        'bi-bar-chart',
      ];
      const navIcons = [
        'bi-map',
        'bi-map',
        'bi-map',
        'bi-map',
        'bi-grid-3x3',
        'bi-cloud-sun',
        'bi-table',
        'bi-broadcast-pin',
        'bi-graph-up',
        'bi-pencil-square',
        'bi-calendar3',
        'bi-house',
        'bi-file-earmark-pdf',
        'bi-envelope',
        'bi-geo',
      ];
      return group === 'rainfall'
        ? rainIcons[i % rainIcons.length]
        : navIcons[i % navIcons.length];
    };

    const shortLabel = (q: string, max = 22): string => {
      const cleaned = q.replace(/^where is\s+/i, '').replace(/\?$/, '').trim();
      return cleaned.length > max ? cleaned.slice(0, max - 1) + '…' : cleaned;
    };

    const next: QuickPrompt[] = [
      ...rainfall.map((query, i) => ({
        label: shortLabel(query),
        query,
        icon: iconFor('rainfall', i),
        group: 'rainfall' as const,
      })),
      ...navigation.map((query, i) => ({
        label: shortLabel(query),
        query,
        icon: iconFor('navigation', i),
        group: 'navigation' as const,
      })),
    ];

    if (next.length) {
      this.quickPrompts = next;
      this.dataSuggestions = rainfall.length ? rainfall : this.dataSuggestions;
      this.navSuggestions = navigation.length ? navigation : this.navSuggestions;
    }
  }

  private pushUser(text: string): void {
    this.messages.push({
      id: ++this.msgId,
      role: 'user',
      text,
      time: this.now(),
    });
  }

  private pushAssistant(
    text: string,
    listItems?: string[],
    navLink?: { label: string; path: string } | null,
    choices?: ClarificationChoice[] | null
  ): void {
    this.messages.push({
      id: ++this.msgId,
      role: 'assistant',
      text,
      time: this.now(),
      listItems: listItems?.length ? listItems : undefined,
      listExpanded: false,
      navLink: navLink || null,
      choices: choices?.length ? choices : null,
    });
  }

  private askBackend(text: string): void {
    const question = this.enrichQuestionWithDates(text);
    this.askSub?.unsubscribe();
    this.askSub = this.rainfallChat.ask({ question }).subscribe({
      next: (res) => {
        this.isTyping = false;
        this.ollamaReady = true;

        if (this.isClarifyResponse(res)) {
          this.handleClarifyResponse(res, text);
          this.scrollToBottom();
          return;
        }

        if (res?.answer) {
          const formatted = this.formatApiAnswer(res);
          this.pushAssistant(
            formatted.text,
            formatted.listItems,
            formatted.navLink
          );
        } else {
          const reply = this.composeReply(text);
          if (!this.isGenericFaqFallback(reply.text)) {
            this.pushAssistant(reply.text);
          } else {
            this.pushAssistant(
              `I couldn’t map that to a rainfall API. Try asking about today’s rainfall, departure, deficient / excess districts, or <em>Where is…?</em> for a product page.`
            );
          }
        }
        this.scrollToBottom();
      },
      error: (err) => {
        this.isTyping = false;
        const status = err?.status || err?.name;
        const isTimeout = err?.name === 'TimeoutError' || status === 0;
        const isOllamaDown = status === 503;
        const body: OllamaChatResponse | null = err?.error ?? null;
        // 422 = Ollama answered, the question just isn't in the API catalog.
        this.ollamaReady = !isOllamaDown && !isTimeout;
        const reply = this.composeReply(text);

        if (body && this.isClarifyResponse(body)) {
          this.handleClarifyResponse(body, text);
          this.scrollToBottom();
          return;
        }

        if (body?.out_of_scope && body.answer) {
          this.pushAssistant(
            `<p>${this.escapeHtml(body.answer)}</p>`,
            (body.suggestions || []).map((s) => this.escapeHtml(s))
          );
          this.scrollToBottom();
          return;
        }

        if (!this.isGenericFaqFallback(reply.text)) {
          this.pushAssistant(reply.text);
        } else if (isOllamaDown) {
          this.pushAssistant(
            `I can't answer right now — the iRAINS rainfall service is temporarily ` +
              `unavailable.<br><br>Please try again in a little while.`
          );
        } else if (isTimeout) {
          this.pushAssistant(
            `That's taking me longer than usual. Please ask once more in a few seconds.`
          );
        } else {
          this.pushAssistant(
            `I couldn't fetch that from iRAINS just now.<br><br>` +
              `Please try again in a moment — e.g. ` +
              `<em>departure for Maharashtra today</em>.`
          );
        }
        this.scrollToBottom();
      },
    });
  }

  private isClarifyResponse(res: OllamaChatResponse | null | undefined): boolean {
    if (!res) return false;
    return (
      res.needs_clarification === true ||
      res.mode === 'clarify' ||
      res.answer_mode === 'clarify' ||
      Boolean(res.clarify?.options?.length) ||
      res.action?.module === 'clarify'
    );
  }

  private handleClarifyResponse(
    res: OllamaChatResponse,
    originalQuestion: string
  ): void {
    const clarify = res.clarify || {};
    this.pendingClarification = null;
    this.pendingBackendClarify = {
      type: clarify.type || res.action?.reason || 'clarify',
      originalQuestion,
      suggestion: clarify.suggestion ?? clarify.to ?? null,
      input: clarify.input ?? clarify.from,
      originalValue: clarify.original_value,
      location: clarify.location,
      from: clarify.from ?? clarify.input,
      to: clarify.to ?? clarify.suggestion ?? undefined,
    };

    const clarifyType = this.pendingBackendClarify.type;
    const answer =
      res.answer ||
      clarify.prompt ||
      'Please choose an option so I can continue.';
    const choices = this.mapBackendClarifyOptions(res, clarifyType);

    this.pushAssistant(
      this.formatClarifyAnswer(answer, clarifyType),
      undefined,
      null,
      choices.length ? choices : null
    );
  }

  /** Structured, professional clarify copy (no pipe lists / raw HTML). */
  private formatClarifyAnswer(answer: string, clarifyType: string): string {
    const lines = String(answer || '')
      .replace(/<\/?em>/gi, '')
      .split(/\n+/)
      .map((l) => l.trim())
      .filter(Boolean)
      // Drop legacy pipe-option lines — chips render options instead
      .filter((l) => !(/\|/.test(l) && l.split('|').length >= 3));

    if (!lines.length) {
      return `<p class="clarify-title">Please choose an option to continue.</p>`;
    }

    const [title, ...rest] = lines;
    let html = `<p class="clarify-title">${this.escapeHtml(title)}</p>`;
    if (rest.length) {
      html += rest
        .map((line) => `<p class="clarify-hint">${this.escapeHtml(line)}</p>`)
        .join('');
    } else if (clarifyType === 'which_month') {
      html += `<p class="clarify-hint">Select a month or year below, or type one like March 2023.</p>`;
    } else if (clarifyType === 'ambiguous_timeframe') {
      html += `<p class="clarify-hint">Choose a period below to continue.</p>`;
    } else if (clarifyType === 'did_you_mean') {
      html += `<p class="clarify-hint">Confirm to continue with this location.</p>`;
    }
    return html;
  }

  private mapBackendClarifyOptions(
    res: OllamaChatResponse,
    clarifyType?: string
  ): ClarificationChoice[] {
    const options: OllamaClarifyOption[] = Array.isArray(res.clarify?.options)
      ? res.clarify!.options!
      : [];

    return options.map((opt, i) => {
      const product = opt.product_name || '';
      const label =
        opt.label || product || (opt.value != null ? String(opt.value) : `Option ${i + 1}`);
      const path = this.resolveAppRoute(opt.route_path);
      let variant: ClarificationChoice['variant'] = 'default';
      let emphasize = false;
      if (clarifyType === 'which_month') {
        variant = /^year\s+/i.test(label) ? 'year' : 'month';
      } else if (clarifyType === 'did_you_mean') {
        const v = String(opt.value ?? label).toLowerCase();
        variant = 'action';
        emphasize = v === 'yes' || /^yes\b/i.test(label);
      }
      return {
        id: `${res.clarify?.type || 'opt'}_${i}`,
        label,
        value: opt.value ?? product ?? label,
        path,
        available: opt.available !== false,
        variant,
        emphasize,
      };
    });
  }

  private resolveBackendClarify(
    choice: ClarificationChoice,
    opts?: { skipUserBubble?: boolean }
  ): void {
    const pending = this.pendingBackendClarify;
    if (!pending) return;

    this.clearChoicesFromMessages();
    if (!opts?.skipUserBubble) {
      this.pushUser(choice.label);
    }
    this.pendingBackendClarify = null;

    if (choice.available === false) {
      this.isTyping = false;
      this.pushAssistant(
        `That option isn’t available in Varsha yet. Please pick another choice, or ask about rainfall.`
      );
      this.scrollToBottom();
      return;
    }

    // which_map (and any option that carries a product route) → open page
    if (pending.type === 'which_map' || choice.path) {
      const path = choice.path || '';
      const product = choice.label;
      this.isTyping = true;
      this.scrollToBottom();
      this.typingTimer = setTimeout(() => {
        this.isTyping = false;
        this.pushAssistant(
          `<p><strong>${this.escapeHtml(product)}</strong> is available in iRAINS.</p>` +
            (path
              ? `<p class="nav-path">Route: <code>${this.escapeHtml(path)}</code></p>`
              : ''),
          undefined,
          path ? { label: `Open ${product}`, path } : null
        );
        this.scrollToBottom();
      }, 280);
      return;
    }

    // mixed_concept → temperature not supported
    if (pending.type === 'mixed_concept' && String(choice.value).toLowerCase() === 'temperature') {
      this.isTyping = false;
      this.pushAssistant(
        `Temperature isn’t available in this chat yet. Ask me about <strong>rainfall</strong> for that place instead.`
      );
      this.scrollToBottom();
      return;
    }

    // Did you mean Chennai? → Yes continues with corrected place; No asks to rephrase
    if (pending.type === 'did_you_mean') {
      const confirmed = String(choice.value).toLowerCase() === 'yes';
      if (!confirmed) {
        this.isTyping = false;
        this.pushAssistant(
          `Okay — please type the correct place name and ask again ` +
            `(for example: <em>Chennai</em>, <em>Madurai</em>, or <em>Maharashtra</em>).`
        );
        this.scrollToBottom();
        return;
      }
      const nextQuestion = this.buildClarifiedQuestion(pending, choice);
      this.isTyping = true;
      this.scrollToBottom();
      this.askBackend(nextQuestion);
      return;
    }

    const nextQuestion = this.buildClarifiedQuestion(pending, choice);
    this.isTyping = true;
    this.scrollToBottom();
    this.askBackend(nextQuestion);
  }

  private matchBackendClarifyFreeText(
    text: string,
    pending: PendingBackendClarify
  ): ClarificationChoice | null {
    const t = text.trim().toLowerCase().replace(/[?.!,]+$/g, '');
    if (!t) return null;

    if (pending.type === 'did_you_mean') {
      if (/^(y|yes|yeah|yep|correct|confirm|ok|okay|sure)$/i.test(t)) {
        return {
          id: 'did_you_mean_yes',
          label: 'Yes',
          value: 'yes',
        };
      }
      if (/^(n|no|nope|wrong|cancel)$/i.test(t)) {
        return {
          id: 'did_you_mean_no',
          label: 'No',
          value: 'no',
        };
      }
      return null;
    }

    if (pending.type === 'suspicious_rainfall_value') {
      const suggested = pending.suggestion != null ? Number(pending.suggestion) : NaN;
      const original = pending.originalValue != null ? Number(pending.originalValue) : NaN;
      if (
        /^(y|yes|yeah|yep|correct|ok|okay|sure)(\s*,?\s*\d+(\.\d+)?\s*mm)?$/i.test(t) ||
        (Number.isFinite(suggested) &&
          new RegExp(`^(yes[,\\s]*)?${suggested}(\\s*mm)?$`, 'i').test(t))
      ) {
        return {
          id: 'sus_yes',
          label: Number.isFinite(suggested) ? `Yes, ${suggested} mm` : 'Yes',
          value: Number.isFinite(suggested) ? suggested : 'yes',
        };
      }
      if (
        /^(n|no|nope|keep|keep\s+it)$/i.test(t) ||
        (Number.isFinite(original) &&
          new RegExp(`^(keep[,\\s]*)?${original}(\\s*mm)?$`, 'i').test(t))
      ) {
        return {
          id: 'sus_keep',
          label: Number.isFinite(original) ? `Keep ${original} mm` : 'Keep',
          value: Number.isFinite(original) ? original : 'keep',
        };
      }
      return null;
    }

    if (pending.type === 'ambiguous_timeframe' || pending.type === 'which_month') {
      const map: Array<{ re: RegExp; label: string; value: string }> = [
        { re: /^today$/, label: 'Today', value: 'today' },
        { re: /^yesterday$/, label: 'Yesterday', value: 'yesterday' },
        {
          re: /^(last\s*7\s*days?|this\s*week|past\s*7\s*days?)$/,
          label: 'Last 7 days',
          value: 'last 7 days',
        },
        { re: /^this\s*month$/, label: 'This month', value: 'this month' },
        { re: /^last\s*month$/, label: 'Last month', value: 'last month' },
        {
          re: /^(specific\s*month|pick\s*a\s*month|choose\s*month)$/,
          label: 'Specific month',
          value: 'specific_month',
        },
        { re: /^historical$/, label: 'Season so far', value: 'season so far' },
        { re: /^season(\s+so\s+far)?$/, label: 'Season so far', value: 'season so far' },
        { re: /^monthly$/, label: 'This month', value: 'this month' },
      ];
      for (const item of map) {
        if (item.re.test(t)) {
          return { id: `tf_${item.value}`, label: item.label, value: item.value };
        }
      }
      // "July 2026" / "month of July"
      if (
        /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i.test(
          t
        )
      ) {
        return { id: 'tf_month', label: text.trim(), value: text.trim() };
      }
    }

    return null;
  }

  private buildClarifiedQuestion(
    pending: PendingBackendClarify,
    choice: ClarificationChoice
  ): string {
    const original = pending.originalQuestion.trim();
    const value = choice.value != null ? String(choice.value) : choice.label;
    const base = original.replace(/[?.!]+$/, '').trim();

    switch (pending.type) {
      case 'did_you_mean': {
        const from = pending.from || pending.input;
        const to = pending.to || pending.suggestion || value;
        if (from && to) {
          const replaced = original.replace(
            new RegExp(`\\b${this.escapeRegExp(String(from))}\\b`, 'ig'),
            String(to)
          );
          if (replaced !== original) return replaced;
        }
        return to ? `${base.replace(/\bchenai\b/gi, String(to))}`.trim() : base;
      }
      case 'ambiguous_timeframe':
      case 'which_month': {
        // Drop picker tokens / bare months before appending the chosen period
        const cleaned = base
          .replace(/\bspecific[_\s-]?month\b/gi, ' ')
          .replace(/\byear\s+20\d{2}\b/gi, ' ')
          .replace(
            /\b(?:at|in|for|during)\s+(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sept|sep|october|oct|november|nov|december|dec)(?:\s+\d{4})?\b/gi,
            ' '
          )
          .replace(
            /\bmonth\s+of\s+(january|february|march|april|may|june|july|august|september|october|november|december)(?:\s+\d{4})?\b/gi,
            ' '
          )
          .replace(/\s+/g, ' ')
          .trim();

        let period = String(value || '').trim();

        // Year shortcut → ask backend to show that year's months
        if (/^specific_month\s+20\d{2}$/i.test(period) || /^year\s+20\d{2}$/i.test(period)) {
          const y = (period.match(/20\d{2}/) || [])[0];
          return `${cleaned} specific_month ${y}`.trim();
        }

        // Normalize chip values so they stay period cues, not part of the place name
        const periodAliases: Record<string, string> = {
          monthly: 'this month',
          historical: 'season so far',
          history: 'season so far',
          seasonal: 'season so far',
          today: 'today',
          yesterday: 'yesterday',
          'last 7 days': 'last 7 days',
          'this month': 'this month',
          'last month': 'last month',
          'season so far': 'season so far',
        };
        const aliasKey = period.toLowerCase();
        if (periodAliases[aliasKey]) {
          period = periodAliases[aliasKey];
        }

        // Normalize free-typed / chip "March 2024" → "month of March 2024"
        if (
          /^(january|february|march|april|may|june|july|august|september|october|november|december)(\s+\d{4})?$/i.test(
            period
          )
        ) {
          period = `month of ${period}`;
        }
        if (
          /^month\s+of\s+(january|february|march|april|may|june|july|august|september|october|november|december)(\s+\d{4})?$/i.test(
            period
          ) === false &&
          /^(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}$/i.test(
            period
          )
        ) {
          period = `month of ${period}`;
        }

        // Prefer "this month rainfall in goa" style when the base already has a place
        if (
          /^(today|yesterday|historical|this month|last month|last 7 days|season so far)$/i.test(
            period
          )
        ) {
          if (/\b(rain|rainfall)\b/i.test(cleaned)) {
            return cleaned.replace(
              /\b(rain|rainfall)\b/i,
              `${period} $1`
            );
          }
          return `${cleaned} ${period}`.trim();
        }

        return `${cleaned} ${period}`.trim();
      }
      case 'ambiguous_location':
        if (/^all[- ]?india$/i.test(value)) {
          return /\b(all[- ]?india|country|pan[- ]?india)\b/i.test(original)
            ? original
            : `${base} all-India`;
        }
        return `${base} for ${value}`;
      case 'invalid_location': {
        const input = pending.input;
        if (input) {
          const replaced = original.replace(new RegExp(this.escapeRegExp(input), 'ig'), value);
          if (replaced !== original) return replaced;
        }
        if (pending.suggestion && choice.label === pending.suggestion) {
          return original.replace(
            new RegExp(this.escapeRegExp(pending.suggestion), 'ig'),
            value
          );
        }
        return `${value} rainfall today`;
      }
      case 'suspicious_rainfall_value': {
        const origVal = pending.originalValue;
        const chosen = String(value).trim();
        const chosenNum = Number(chosen);
        const origNum = origVal != null ? Number(origVal) : NaN;

        // Replace "4000mm" / "4000 mm" / "4000 millimetres" (word-boundary alone fails on 4000mm)
        if (origVal != null && Number.isFinite(chosenNum)) {
          const replaced = original.replace(
            new RegExp(
              `\\b${this.escapeRegExp(String(origVal))}\\s*(mm|millimet(?:er|re)s?)\\b`,
              'i'
            ),
            `${chosenNum} mm`
          );
          if (replaced !== original) {
            // Keeping the same high value → mark confirmed so backend won't re-ask
            if (Number.isFinite(origNum) && chosenNum === origNum) {
              return `${replaced} confirmed_rainfall_mm`.trim();
            }
            return replaced;
          }
          // Fallback: bare number without unit glued
          const bare = original.replace(
            new RegExp(`\\b${this.escapeRegExp(String(origVal))}\\b`),
            chosen
          );
          if (bare !== original) {
            if (Number.isFinite(origNum) && chosenNum === origNum) {
              return `${bare} confirmed_rainfall_mm`.trim();
            }
            return bare;
          }
        }
        return original;
      }
      case 'mixed_concept':
        return base
          .replace(
            /\b(temp|temperature|hot|cold|celsius|fahrenheit|°c|°f)\b/gi,
            ''
          )
          .replace(/\s+/g, ' ')
          .trim();
      default:
        return `${base} ${value}`.trim();
    }
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private resolveClarification(
    intent: 'navigate' | 'data',
    pending: PendingClarification
  ): void {
    this.pendingClarification = null;
    this.isTyping = true;
    this.scrollToBottom();

    if (intent === 'navigate') {
      const delay = 280;
      this.typingTimer = setTimeout(() => {
        this.isTyping = false;
        const path = this.resolveAppRoute(pending.path) || pending.path;
        this.pushAssistant(
          `<p><strong>${this.escapeHtml(
            pending.productName
          )}</strong> is available in iRAINS.</p>` +
            `<p class="nav-path">Route: <code>${this.escapeHtml(path)}</code></p>`,
          undefined,
          { label: `Open ${pending.productName}`, path }
        );
        this.scrollToBottom();
      }, delay);
      return;
    }

    // Data intent: if original already looks like a rainfall question, ask backend;
    // otherwise guide the user to ask a concrete data question.
    const original = pending.originalText;
    if (this.hasClearDataIntent(original) && !this.isAmbiguousProductOnly(original)) {
      this.askBackend(original);
      return;
    }

    const delay = 320;
    this.typingTimer = setTimeout(() => {
      this.isTyping = false;
      this.pushAssistant(
        `Sure — ask me a rainfall question about <strong>${this.escapeHtml(
          pending.productName
        )}</strong>, for example:` +
          `<ul class="rain-list">` +
          `<li><em>What is today’s rainfall for Maharashtra?</em></li>` +
          `<li><em>Which districts are deficient today?</em></li>` +
          `<li><em>What is country / all-India rainfall today?</em></li>` +
          `</ul>` +
          `Or say <em>Where is ${this.escapeHtml(
            pending.productName
          )}?</em> if you want the page link instead.`
      );
      this.scrollToBottom();
    }, delay);
  }

  private clearChoicesFromMessages(): void {
    this.messages.forEach((m) => {
      if (m.choices?.length) m.choices = null;
    });
  }

  private parseClarificationReply(text: string): 'navigate' | 'data' | null {
    const q = text.toLowerCase().replace(/\s+/g, ' ').trim();
    if (
      /\b(open|navigate|go to|take me|show (me )?the )?page\b/.test(q) ||
      /\b(navigate|open it|open page|go there|yes.? open|menu|route)\b/.test(q) ||
      /^(open|navigate|page)\b/.test(q)
    ) {
      return 'navigate';
    }
    if (
      /\b(data|rainfall|statistics|stats|numbers|values|ask about)\b/.test(q) ||
      /^(data|rainfall)\b/.test(q)
    ) {
      return 'data';
    }
    return null;
  }

  /**
   * Match short / keyword-only product mentions that need navigate-vs-data clarification.
   * Skip when the user already said "where is" / "open" or asked a clear rainfall question.
   */
  private detectAmbiguousProduct(
    text: string
  ): { topic: string; productName: string; path: string } | null {
    const q = text.toLowerCase().replace(/\s+/g, ' ').trim();
    if (!q || q.length > 80) return null;
    if (this.hasClearNavigateIntent(q) || this.hasClearDataIntent(q)) return null;

    // Prefer longer keyword matches first
    const ranked = [...PRODUCT_KEYWORDS].sort(
      (a, b) =>
        Math.max(...b.keywords.map((k) => k.length)) -
        Math.max(...a.keywords.map((k) => k.length))
    );

    for (const product of ranked) {
      const hit = product.keywords.find((k) => q.includes(k));
      if (!hit) continue;
      // Keyword-only / near keyword-only, or brief "about X" style
      const stripped = q
        .replace(hit, '')
        .replace(/\b(about|regarding|for|the|a|an|please|show|me|info|information)\b/g, '')
        .replace(/[?.!,]/g, '')
        .trim();
      if (stripped.length <= 12) {
        return {
          topic: hit,
          productName: product.productName,
          path: product.path,
        };
      }
    }
    return null;
  }

  private isAmbiguousProductOnly(text: string): boolean {
    return Boolean(this.detectAmbiguousProduct(text));
  }

  private hasClearNavigateIntent(q: string): boolean {
    return (
      /\bwhere is\b/.test(q) ||
      /^\s*open\b/.test(q) ||
      /\b(take me to|go to|navigate to|find (the )?(map|page|menu|product))\b/.test(
        q
      )
    );
  }

  private hasClearDataIntent(q: string): boolean {
    return (
      /\b(today|yesterday|last 7|this week|seasonal|cumulative|departure|deficient|excess|actual vs|compare|rainfall for|mm\b|%dep)\b/.test(
        q
      ) ||
      /\b(maharashtra|kerala|tamil nadu|chennai|all-india|all india|country)\b/.test(
        q
      )
    );
  }

  private now(): string {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      this.messagesEnd?.nativeElement?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 40);
  }

  /** Inject header From/To when user asks about the selected range. */
  private enrichQuestionWithDates(raw: string): string {
    const q = raw.toLowerCase();
    const wantsSelectedRange =
      /\bselected date range\b|\bselected dates?\b|\bcurrent (date )?range\b|\bthis period\b|\bheader dates?\b/.test(
        q
      ) ||
      (/\bactual\b/.test(q) && /\bdeparture\b/.test(q) && /\brange\b/.test(q));

    if (wantsSelectedRange && this.fromDate && this.toDate) {
      return `${raw.trim()} ${this.fromDate} to ${this.toDate}`;
    }
    return raw.trim();
  }

  private isFaqOnlyQuestion(raw: string): boolean {
    const q = raw.toLowerCase();
    // Product-location questions must hit the ollama-chat navigation module.
    if (
      /\bwhere is\b/.test(q) ||
      /^\s*open\b/.test(q) ||
      /\bfind (the )?(map|page|menu|product)\b/.test(q)
    ) {
      return false;
    }
    const strongFaq = [
      'four maps',
      'these maps',
      'read the maps',
      'what do these',
      'legend',
      'colour',
      'color',
      'palette',
      'coverage',
      'station count',
      'bar chart',
      'how to use',
      'difference between actual',
      'hello',
      'namaste',
      'good morning',
      'good evening',
      'thank',
      'bye',
      'goodbye',
    ];
    if (strongFaq.some((k) => q.includes(k))) return true;
    if (/^(hi|hey)\b/.test(q)) return true;
    return false;
  }

  private isGenericFaqFallback(text: string): boolean {
    return text.includes("I didn't catch a precise match");
  }

  /** Banner when backend soft-corrected a place name (chenai → Chennai). */
  private formatDidYouMeanBanner(res: OllamaChatResponse): string {
    const prompt =
      res?.did_you_mean?.prompt ||
      (res?.did_you_mean?.to
        ? `Did you mean ${res.did_you_mean.to}?`
        : res?.location_correction?.to
        ? `Did you mean ${res.location_correction.to}?`
        : '');
    if (!prompt) return '';
    return `<p class="did-you-mean"><em>${this.escapeHtml(prompt)}</em></p>`;
  }

  /** Drop a leading "Did you mean …?" from answer text when the banner already shows it. */
  private stripLeadingDidYouMean(answer: string, res: OllamaChatResponse): string {
    if (!res?.did_you_mean?.prompt && !res?.did_you_mean?.to && !res?.location_correction?.to) {
      return answer;
    }
    return String(answer || '')
      .replace(/^\s*did you mean[^\n?]*\??\s*/i, '')
      .trim();
  }

  private formatApiAnswer(res: OllamaChatResponse): FormattedAnswer {
    const rawAnswer = (res?.answer || res?.message || 'No answer returned.').trim();
    const didYouMean = this.formatDidYouMeanBanner(res);
    const answer = this.stripLeadingDidYouMean(rawAnswer, res);

    // Clarify payloads are handled separately — never invent a nav / data card.
    if (this.isClarifyResponse(res)) {
      return { text: this.escapeAndLightFormat(answer) };
    }

    const rows: ApiDataRow[] = Array.isArray(res?.api?.data) ? res.api!.data! : [];
    const postProcess = res?.action?.post_process;
    const isNav =
      res?.action?.module === 'navigation' ||
      res?.action?.api_id === 'resolve_product_route' ||
      Boolean(res?.navigation?.route_path);

    if (isNav) {
      const product =
        res.navigation?.product_name ||
        res.action?.product_name ||
        rows[0]?.product_name ||
        'Product';
      const catalogPath =
        res.navigation?.route_path ||
        res.action?.route_path ||
        rows[0]?.route_path ||
        '';
      const path = this.resolveAppRoute(catalogPath);
      const text =
        didYouMean +
        `<p><strong>${this.escapeHtml(String(product))}</strong> is available in iRAINS.</p>` +
        (path
          ? `<p class="nav-path">Route: <code>${this.escapeHtml(path)}</code></p>`
          : `<p>${this.escapeAndLightFormat(answer)}</p>`);
      return {
        text,
        navLink: path
          ? { label: `Open ${product}`, path }
          : null,
      };
    }

    const sourceLink = this.resolveDataSourceLink(res);
    const withSource = (formatted: FormattedAnswer): FormattedAnswer => {
      if (!sourceLink) return formatted;
      return {
        ...formatted,
        text:
          (formatted.text || '') +
          `<p class="source-page">Data from: <strong>${this.escapeHtml(
            sourceLink.label.replace(/^View on\s+/i, '')
          )}</strong></p>`,
        navLink: sourceLink,
      };
    };

    // Prefer structured API rows for deficient / excess / multi-district lists
    if (postProcess?.type === 'filter_by_departure_category' && rows.length === 0) {
      const cats = postProcess.categories?.join(' / ') || 'that category';
      const place =
        (res.action?.post_filter as { district_name?: string; state_name?: string } | undefined)
          ?.district_name ||
        (res.action?.post_filter as { state_name?: string } | undefined)?.state_name ||
        (res.api as { category_miss?: { name?: string } } | undefined)?.category_miss
          ?.name ||
        'the selected area';
      const start = (res.action?.body?.['startDate'] as string) || '';
      const end = (res.action?.body?.['endDate'] as string) || '';
      const date =
        res.api?.usedDate ||
        (start && end && start !== end ? `${start} to ${end}` : start) ||
        '';
      const miss = (res.api as { category_miss?: { category?: string; departure?: number } } | undefined)
        ?.category_miss;

      let text = didYouMean;
      if (miss?.category) {
        const dep =
          miss.departure != null
            ? ` (departure ${miss.departure > 0 ? '+' : ''}${Number(miss.departure).toFixed(1)}%)`
            : '';
        text +=
          `<p><strong>${this.escapeHtml(String(place))}</strong> was not in ` +
          `<strong class="${this.categoryTextClass(cats)}">${this.escapeHtml(cats)}</strong>` +
          (date ? ` for <strong>${this.escapeHtml(String(date))}</strong>` : '') +
          `.</p>` +
          `<p>It was <strong class="${this.categoryTextClass(miss.category)}">${this.escapeHtml(
            miss.category
          )}</strong>${dep}.</p>` +
          `<p class="clarify-hint">Rainfall data is available — it just was not ${this.escapeHtml(
            cats
          )}.</p>`;
      } else {
        text +=
          `<p>No <strong class="${this.categoryTextClass(cats)}">${this.escapeHtml(
            cats
          )}</strong> for <strong>${this.escapeHtml(String(place))}</strong>` +
          (date ? ` on <strong>${this.escapeHtml(String(date))}</strong>` : '') +
          `.</p>` +
          `<p class="clarify-hint">Rainfall data for this place/date was not found.</p>`;
      }
      return withSource({ text });
    }

    if (
      rows.length > 1 ||
      postProcess?.type === 'filter_by_departure_category'
    ) {
      const listItems = rows.map((d) => this.formatDistrictListItem(d));
      const date =
        res.api?.usedDate ||
        (rows[0]?.date as string) ||
        (res.action?.body?.['startDate'] as string) ||
        '';
      const cats = postProcess?.categories?.join(' / ');
      const catClass = this.categoryTextClass(
        postProcess?.categories?.[0] || cats || null
      );
      const isCompare = Array.isArray(
        (res.action?.post_filter as { state_names?: string[] } | undefined)
          ?.state_names
      );
      const intro = cats
        ? `<p><strong>${rows.length}</strong> district(s)${
            date ? ` on <strong>${this.escapeHtml(date)}</strong>` : ''
          } in <strong class="${catClass}">${this.escapeHtml(cats)}</strong>.</p>`
        : isCompare
        ? `<p>Comparison for <strong>${rows.length}</strong> area(s)${
            date ? ` on <strong>${this.escapeHtml(date)}</strong>` : ''
          }:</p>`
        : `<p><strong>${rows.length}</strong> result(s)${
            date ? ` for <strong>${this.escapeHtml(date)}</strong>` : ''
          }.</p>`;

      return withSource({
        text: didYouMean + intro,
        listItems,
      });
    }

    if (rows.length === 1) {
      const row = rows[0];
      const hasNums =
        row.actual_state_rainfall != null ||
        row.actual_rainfall != null ||
        row.actual_subdiv_rainfall != null ||
        row.actual_country_rainfall != null ||
        row.departure != null;

      if (hasNums) {
        const name =
          row.state_name ||
          row.district_name ||
          row.subdiv_name ||
          row.name ||
          'Selected area';
        const date =
          res.api?.usedDate ||
          row.date ||
          (res.action?.body?.['startDate'] as string) ||
          '';
        const intro =
          `<p>For <strong>${this.escapeHtml(String(name))}</strong>` +
          (date ? ` on <strong>${this.escapeHtml(String(date))}</strong>` : '') +
          `:</p>`;
        return withSource({
          text: didYouMean + intro + this.formatRowSummaryList(row),
        });
      }

      return withSource({ text: didYouMean + this.escapeAndLightFormat(answer) });
    }

    // Parse long Ollama "* item * item" walls into a crisp expandable list
    const parsed = this.parseAnswerBulletList(answer);
    if (parsed.items.length > this.listPreviewCount) {
      return withSource({
        text: didYouMean + `<p>${this.escapeHtml(parsed.intro)}</p>`,
        listItems: parsed.items.map((item) => this.formatParsedListItem(item)),
      });
    }

    return withSource({ text: didYouMean + this.escapeAndLightFormat(answer) });
  }

  /** Map catalog route placeholders onto real Angular routes. */
  private resolveAppRoute(catalogPath: string | null | undefined): string | null {
    if (!catalogPath) return null;
    const key = catalogPath.startsWith('/') ? catalogPath : `/${catalogPath}`;
    return ROUTE_ALIASES[key] || key;
  }

  /**
   * For rainfall answers, link to the product page that shows the same data.
   * Prefers weekly / seasonal map variants when the planner used those date tokens.
   */
  private resolveDataSourceLink(
    res: OllamaChatResponse
  ): { label: string; path: string } | null {
    const apiId = res?.action?.api_id;
    if (!apiId || apiId === 'resolve_product_route') return null;

    // Prefer an explicit route from the backend when present.
    const explicitPath =
      res.action?.route_path ||
      res.navigation?.route_path ||
      null;
    if (explicitPath) {
      const path = this.resolveAppRoute(explicitPath);
      const label =
        res.action?.product_name ||
        res.navigation?.product_name ||
        'Source page';
      return path ? { label: `View on ${label}`, path } : null;
    }

    const source = API_SOURCE_PAGES[apiId];
    if (!source) return null;

    const span = this.inferDateSpan(res);
    let path = source.path;
    let label = source.label;
    if (span === 'seasonal' && source.seasonalPath) {
      path = source.seasonalPath;
      label = label.replace(/^Daily\b/, 'Cumulative').replace(/\bActual\b/, 'Departure');
    } else if (span === 'weekly' && source.weeklyPath) {
      path = source.weeklyPath;
      label = label.replace(/^Daily\b/, 'Weekly').replace(/\bActual\b/, 'Departure');
    }

    // Deficient / excess district lists always belong on the departure district map.
    if (
      apiId === 'fetch_district_data' &&
      res.action?.post_process?.type === 'filter_by_departure_category'
    ) {
      path =
        span === 'seasonal'
          ? '/cummulative-departure-district-pan-map'
          : span === 'weekly'
          ? '/weekly-departure-district-panindia-map'
          : '/pan-india-region';
      label =
        span === 'seasonal'
          ? 'Cumulative Departure District (Pan India) Map'
          : span === 'weekly'
          ? 'Weekly Departure District (Pan India) Map'
          : 'Daily Departure District (Pan India) Map';
    }

    return { label: `View on ${label}`, path };
  }

  /** Infer weekly / seasonal intent from planner date tokens or api_id. */
  private inferDateSpan(res: OllamaChatResponse): 'daily' | 'weekly' | 'seasonal' {
    if (res?.action?.api_id === 'fetch_cumulative_country_data') return 'seasonal';
    const body = res?.action?.body || {};
    const start = String(body['startDate'] || '').toUpperCase();
    const end = String(body['endDate'] || '').toUpperCase();
    const joined = `${start} ${end}`;
    if (joined.includes('SEASON_START') || joined.includes('SEASONAL')) return 'seasonal';
    if (joined.includes('LAST_7') || joined.includes('WEEK')) return 'weekly';
    return 'daily';
  }

  private formatDistrictListItem(d: ApiDataRow): string {
    const name = d.district_name || d.state_name || d.subdiv_name || d.name || 'Area';
    const category = this.resolveCategory(d.category, d.departure);
    const textClass = this.categoryTextClass(category);
    const dep =
      d.departure == null
        ? null
        : `${Number(d.departure) > 0 ? '+' : ''}${Number(d.departure).toFixed(1)}%`;
    const actRaw = d.actual ?? d.actual_rainfall ?? d.actual_state_rainfall;
    const act = actRaw != null ? `${Number(actRaw).toFixed(1)} mm` : null;
    const bits = [
      dep
        ? `departure <span class="${textClass}">${dep}</span>`
        : null,
      category
        ? `<span class="${textClass}">${this.escapeHtml(category)}</span>`
        : null,
      act ? `actual ${act}` : null,
    ].filter(Boolean);
    return (
      `<strong class="${textClass}">${this.escapeHtml(String(name))}</strong>` +
      (bits.length ? ` — ${bits.join(' · ')}` : '')
    );
  }

  private resolveCategory(
    category?: string | null,
    departure?: number | null
  ): string | null {
    if (category && String(category).trim()) {
      const c = String(category).trim().toLowerCase();
      if (c === 'large excess') return 'Large Excess';
      if (c === 'excess') return 'Excess';
      if (c === 'normal') return 'Normal';
      if (c === 'deficient') return 'Deficient';
      if (c === 'large deficient') return 'Large Deficient';
      if (c === 'no rain') return 'No Rain';
      if (c === 'no data') return 'No Data';
      return String(category).trim();
    }
    if (departure === null || departure === undefined || Number.isNaN(Number(departure))) {
      return null;
    }
    const value = Number(departure);
    if (value === -100) return 'No Rain';
    if (value >= 60) return 'Large Excess';
    if (value >= 20) return 'Excess';
    if (value >= -19 && value <= 19) return 'Normal';
    if (value >= -59 && value <= -20) return 'Deficient';
    if (value >= -99 && value <= -60) return 'Large Deficient';
    return 'No Data';
  }

  private categoryTextClass(category: string | null | undefined): string {
    switch ((category || '').toLowerCase().split(' / ')[0].trim()) {
      case 'large excess':
        return 'cat-le';
      case 'excess':
        return 'cat-e';
      case 'normal':
        return 'cat-n';
      case 'deficient':
        return 'cat-d';
      case 'large deficient':
        return 'cat-ld';
      case 'no rain':
        return 'cat-nr';
      default:
        return 'cat-nd';
    }
  }

  /** Colorize parsed Ollama list lines that mention a departure category. */
  private formatParsedListItem(raw: string): string {
    const categoryMatch = raw.match(
      /\b(Large Excess|Large Deficient|Excess|Deficient|Normal|No Rain|No Data)\b/i
    );
    const depMatch = raw.match(/([+-]?\d+(?:\.\d+)?)\s*%/);
    const category = categoryMatch ? categoryMatch[1] : null;
    const departure = depMatch ? Number(depMatch[1]) : null;
    const resolved = this.resolveCategory(category, departure);
    const textClass = this.categoryTextClass(resolved);

    let body = this.escapeHtml(raw);
    if (resolved) {
      const re = new RegExp(`(${resolved.replace(/\s+/g, '\\s+')})`, 'ig');
      body = body.replace(re, `<span class="${textClass}">$1</span>`);
      body = body.replace(
        /([+-]?\d+(?:\.\d+)?%)/g,
        `<span class="${textClass}">$1</span>`
      );
      body = body.replace(
        /^([^—(]+)/,
        `<strong class="${textClass}">$1</strong>`
      );
    }

    return body;
  }

  /** Split Ollama walls like "Intro: * A * B * C" into intro + items. */
  private parseAnswerBulletList(answer: string): { intro: string; items: string[] } {
    const starred = answer
      .split(/\s*\*\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (starred.length > this.listPreviewCount + 1) {
      return { intro: starred[0].replace(/:\s*$/, ':'), items: starred.slice(1) };
    }

    const lines = answer
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const bulletLines = lines.filter((l) => /^[-•*]\s+/.test(l) || /^\d+[\.)]\s+/.test(l));
    if (bulletLines.length > this.listPreviewCount) {
      const intro =
        lines.find((l) => !/^[-•*]\s+/.test(l) && !/^\d+[\.)]\s+/.test(l)) ||
        'Results:';
      return {
        intro: intro.replace(/:\s*$/, ':'),
        items: bulletLines.map((l) => l.replace(/^[-•*]\s+/, '').replace(/^\d+[\.)]\s+/, '')),
      };
    }

    return { intro: answer, items: [] };
  }

  private formatRowSummaryList(row: ApiDataRow): string {
    const actual =
      row.actual_state_rainfall ??
      row.actual_rainfall ??
      row.actual_subdiv_rainfall ??
      row.actual_country_rainfall ??
      null;
    const normal = row.rainfall_normal_value ?? row.normal_rainfall ?? null;
    const departure = row.departure ?? null;
    const category = this.resolveCategory(row.category, departure);
    const textClass = this.categoryTextClass(category);
    return (
      `<ul class="rain-list">` +
      `<li><strong>Actual</strong> — ${this.fmtMm(actual)}</li>` +
      `<li><strong>Normal</strong> — ${this.fmtMm(normal)}</li>` +
      `<li><strong>Departure</strong> — ` +
      `<span class="${textClass}">${this.fmtPct(departure)}</span>` +
      (category
        ? ` <span class="${textClass}">(${this.escapeHtml(category)})</span>`
        : '') +
      `</li></ul>`
    );
  }

  private escapeAndLightFormat(text: string): string {
    const escaped = this.escapeHtml(text).replace(/\r\n/g, '\n');
    // Preserve multi-line clarify / backend answers
    if (escaped.includes('\n')) {
      return escaped
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => `<p>${line}</p>`)
        .join('');
    }
    // Split on sentence boundaries for readability when long
    if (escaped.length > 180 && escaped.includes('. ')) {
      const parts = escaped.split(/(?<=\.)\s+/);
      if (parts.length > 1) {
        return parts.map((p) => `<p>${p}</p>`).join('');
      }
    }
    return `<p>${escaped}</p>`;
  }

  private escapeHtml(value: string): string {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private fmtMm(value: number | null | undefined): string {
    if (value === null || value === undefined) return 'No Data';
    return `${Number(value).toFixed(1)} mm`;
  }

  private fmtPct(value: number | null | undefined): string {
    if (value === null || value === undefined) return 'No Data';
    const n = Number(value);
    const sign = n > 0 ? '+' : '';
    return `${sign}${n.toFixed(1)}%`;
  }

  private composeReply(raw: string): { text: string } {
    const q = raw.toLowerCase().replace(/\s+/g, ' ').trim();

    if (this.match(q, ['hello', 'hi', 'hey', 'namaste', 'good morning', 'good evening'])) {
      return {
        text:
          `Hello! Varsha here — your rainfall guide on All Maps.<br><br>` +
          `Ask live numbers (e.g. Maharashtra departure today) or how to use the maps.`,
      };
    }

    if (this.match(q, ['what do these', 'four maps', 'these maps', 'overview', 'read the maps', 'what am i looking'])) {
      return {
        text:
          `<strong>All Maps</strong> is your rainfall dashboard at a glance — four linked choropleths for the selected date range:` +
          `<ul class="rain-list">` +
          `<li><strong>District</strong> — finest spatial rainfall picture</li>` +
          `<li><strong>State</strong> — aggregated across districts</li>` +
          `<li><strong>Subdivision</strong> — IMD meteorological subdivisions</li>` +
          `<li><strong>Region / Homogeneous</strong> — broad climatic regions</li>` +
          `</ul>` +
          `Use the date picker in the header to refresh all four together. Toggle <strong>Actual</strong> / <strong>Departure</strong> to switch rainfall product type.`,
      };
    }

    if (
      this.match(q, ['difference between actual', 'actual and departure', 'vs departure mode']) ||
      (this.match(q, ['actual', 'departure']) &&
        this.match(q, ['difference', 'versus', 'mode', 'lens']) &&
        !this.match(q, ['range', 'selected', 'today', 'maharashtra']))
    ) {
      return {
        text:
          `Two rainfall lenses, same geography:` +
          `<ul class="rain-list">` +
          `<li><strong>Actual</strong> — observed rainfall totals (mm) for the period</li>` +
          `<li><strong>Departure</strong> — how far actual is from the long-period normal (deficit / excess %)</li>` +
          `</ul>` +
          `You're currently in <strong>${this.dataMode}</strong> mode` +
          (this.fromDate && this.toDate
            ? ` for <strong>${this.fromDate}</strong> to <strong>${this.toDate}</strong>.`
            : `.`) +
          `<br><br>For live numbers, ask: <em>Show Actual vs Departure for the selected date range.</em>`,
      };
    }

    if (this.match(q, ['legend', 'colour', 'color', 'palette']) && !this.match(q, ['deficient', 'excess', 'today'])) {
      return {
        text:
          `Departure colour bands (IMD-style categories):` +
          `<ul class="rain-list legend-list">` +
          `<li><span class="swatch s-le"></span> <strong>Large Excess</strong> — ≥ +60%</li>` +
          `<li><span class="swatch s-e"></span> <strong>Excess</strong> — +20% to +59%</li>` +
          `<li><span class="swatch s-n"></span> <strong>Normal</strong> — −19% to +19%</li>` +
          `<li><span class="swatch s-d"></span> <strong>Deficient</strong> — −59% to −20%</li>` +
          `<li><span class="swatch s-ld"></span> <strong>Large Deficient</strong> — −99% to −60%</li>` +
          `<li><span class="swatch s-nr"></span> <strong>No Rain</strong> — −100%</li>` +
          `<li><span class="swatch s-nd"></span> <strong>No Data</strong></li>` +
          `</ul>` +
          `Hover a polygon on any map for the unit name, rainfall / normal / departure values.`,
      };
    }

    if (this.match(q, ['coverage', 'station count', 'bar chart', 'pie', 'how many stations'])) {
      return {
        text:
          `Each map card has a circular <strong>coverage</strong> button (top-right chart icon).` +
          `<ul class="rain-list">` +
          `<li><strong>District</strong> → stations reporting per district</li>` +
          `<li><strong>State / Subdivision</strong> → districts covered</li>` +
          `<li><strong>Region</strong> → districts, states & subdivisions summary</li>` +
          `</ul>` +
          `The left sidebar opens with a table + pie chart for the active date range — useful to spot sparse observation networks.`,
      };
    }

    if (this.match(q, ['download', 'export', 'png', 'image', 'save map', 'print']) &&
        !this.match(q, ['where is', 'pdf', 'email'])) {
      return {
        text:
          `On each map card, use the <strong>Download</strong> control (pill button) to export the current choropleth as an image.` +
          `<br>Fullscreen (if available on the card) is handy before capturing high-resolution figures for briefings.`,
      };
    }

    if (this.match(q, ['navigate', 'where else', 'other maps', 'go to', 'menu']) &&
        !this.match(q, ['where is', 'open '])) {
      return {
        text:
          `Ask <em>Where is…?</em> for a direct product link, e.g.:` +
          `<ul class="rain-list">` +
          `<li>Where is monsoon activity?</li>` +
          `<li>Where is the daily actual state rainfall map?</li>` +
          `<li>Where is station level data?</li>` +
          `</ul>`,
      };
    }

    if (this.match(q, ['help', 'how to use', 'guide', 'what can you', 'features'])) {
      return {
        text:
          `I can help with:` +
          `<ul class="rain-list">` +
          `<li>Today’s / weekly / seasonal rainfall</li>` +
          `<li>Departure, deficient & excess districts</li>` +
          `<li>Compare states (e.g. Tamil Nadu vs Kerala)</li>` +
          `<li><em>Where is…?</em> product navigation</li>` +
          `<li>All Maps legend & coverage tips</li>` +
          `</ul>`,
      };
    }

    if (this.match(q, ['thank', 'thanks', 'bye', 'goodbye'])) {
      return {
        text: `You're welcome — stay weather-wise. Varsha is here whenever you need a rainfall briefing.`,
      };
    }

    return {
      text:
        `I didn't catch a precise match, but here's what usually helps:` +
        `<ul class="rain-list">` +
        `<li>Ask for <em>today’s rainfall</em>, <em>last 7 days</em>, or <em>seasonal</em></li>` +
        `<li>Or <em>deficient / excess districts</em>, <em>compare states</em></li>` +
        `<li>Or <em>Where is monsoon activity?</em> / other product pages</li>` +
        `<li>Current mode: <strong>${this.dataMode}</strong>` +
        (this.fromDate && this.toDate
          ? ` · dates <strong>${this.fromDate}</strong> → <strong>${this.toDate}</strong>`
          : '') +
        `</li>` +
        `</ul>`,
    };
  }

  private match(q: string, keys: string[]): boolean {
    return keys.some((k) => q.includes(k));
  }
}
