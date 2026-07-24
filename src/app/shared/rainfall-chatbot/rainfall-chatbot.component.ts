import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { DataService } from 'src/app/data.service';
import { Subscription } from 'rxjs';

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  time: string;
  suggestions?: string[];
}

interface QuickPrompt {
  label: string;
  query: string;
  icon: string;
}

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

  fromDate = '';
  toDate = '';
  dataMode = 'Departure';

  private msgId = 0;
  private typingTimer?: ReturnType<typeof setTimeout>;
  private subs: Subscription[] = [];

  readonly quickPrompts: QuickPrompt[] = [
    { label: 'Read the maps', query: 'What do these four maps show?', icon: 'bi-map' },
    { label: 'Actual vs Departure', query: 'What is the difference between Actual and Departure?', icon: 'bi-arrow-left-right' },
    { label: 'Coverage charts', query: 'How do I check station coverage?', icon: 'bi-bar-chart' },
    { label: 'Colour legend', query: 'Explain the rainfall departure colours', icon: 'bi-palette' },
  ];

  constructor(private dataService: DataService) {}

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

    this.pushAssistant(
      this.welcomeText(),
      this.quickPrompts.map((p) => p.query)
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
    if (this.typingTimer) clearTimeout(this.typingTimer);
  }

  toggle(): void {
    this.open = !this.open;
    if (this.open) {
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

    const delay = 650 + Math.min(1200, text.length * 18);
    this.typingTimer = setTimeout(() => {
      const reply = this.composeReply(text);
      this.isTyping = false;
      this.pushAssistant(reply.text, reply.suggestions);
      this.scrollToBottom();
    }, delay);
  }

  clearChat(): void {
    this.messages = [];
    this.msgId = 0;
    this.pushAssistant(
      this.welcomeText(),
      this.quickPrompts.map((p) => p.query)
    );
  }

  trackById(_: number, msg: ChatMessage): number {
    return msg.id;
  }

  private welcomeText(): string {
    const range =
      this.fromDate && this.toDate
        ? ` for <strong>${this.fromDate}</strong> → <strong>${this.toDate}</strong>`
        : '';
    return (
      `Namaste — I'm <strong>Varsha</strong>, your iRAINS rainfall companion.` +
      `<br><br>You're on the All Maps overview in <strong>${this.dataMode}</strong> mode${range}.` +
      `<br>Ask me about the district, state, subdivision & region maps, legends, coverage, or how to navigate rainfall products.`
    );
  }

  private pushUser(text: string): void {
    this.messages.push({
      id: ++this.msgId,
      role: 'user',
      text,
      time: this.now(),
    });
  }

  private pushAssistant(text: string, suggestions?: string[]): void {
    this.messages.push({
      id: ++this.msgId,
      role: 'assistant',
      text,
      time: this.now(),
      suggestions,
    });
  }

  private now(): string {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      this.messagesEnd?.nativeElement?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 40);
  }

  private composeReply(raw: string): { text: string; suggestions?: string[] } {
    const q = raw.toLowerCase().replace(/\s+/g, ' ').trim();

    if (this.match(q, ['hello', 'hi', 'hey', 'namaste', 'good morning', 'good evening'])) {
      return {
        text:
          `Hello! Varsha here — your rainfall guide on All Maps.<br><br>` +
          `I can walk you through this page: choropleths, departure vs actual rainfall, station coverage, and where to go next in iRAINS.`,
        suggestions: [
          'What do these four maps show?',
          'Explain the rainfall departure colours',
        ],
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
        suggestions: [
          'What is the difference between Actual and Departure?',
          'How do I check station coverage?',
        ],
      };
    }

    if (this.match(q, ['actual', 'departure', 'difference', 'vs', 'versus', 'mode'])) {
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
          `<br><br>Departure maps use categorical colours (large excess → large deficient). Actual maps emphasise rainfall depth.`,
        suggestions: [
          'Explain the rainfall departure colours',
          'How do I change the date range?',
        ],
      };
    }

    if (this.match(q, ['legend', 'colour', 'color', 'category', 'excess', 'deficient', 'normal', 'palette'])) {
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
        suggestions: [
          'What do these four maps show?',
          'How do I download a map?',
        ],
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
        suggestions: [
          'How do I change the date range?',
          'What is the difference between Actual and Departure?',
        ],
      };
    }

    if (this.match(q, ['date', 'period', 'range', 'from', 'to', 'calendar', 'week'])) {
      return {
        text:
          `Set the analysis window from the <strong>header date controls</strong> (From / To).` +
          `<br><br>All four maps and coverage panels refresh together for that window.` +
          (this.fromDate && this.toDate
            ? `<br>Current selection: <strong>${this.fromDate}</strong> → <strong>${this.toDate}</strong>.`
            : `<br>Pick dates above the maps if none are selected yet.`),
        suggestions: [
          'What do these four maps show?',
          'How do I check station coverage?',
        ],
      };
    }

    if (this.match(q, ['download', 'export', 'png', 'image', 'save map', 'print'])) {
      return {
        text:
          `On each map card, use the <strong>Download</strong> control (pill button) to export the current choropleth as an image.` +
          `<br>Fullscreen (if available on the card) is handy before capturing high-resolution figures for briefings.`,
        suggestions: [
          'Explain the rainfall departure colours',
          'Where else can I see rainfall maps?',
        ],
      };
    }

    if (this.match(q, ['district'])) {
      return {
        text:
          `The <strong>District map</strong> is the highest-resolution panel on this page — each polygon is an administrative district coloured by ${this.dataMode.toLowerCase()} rainfall.` +
          `<br><br>Open its coverage button to see how many stations feed each district for the selected dates.`,
        suggestions: [
          'How do I check station coverage?',
          'Explain the rainfall departure colours',
        ],
      };
    }

    if (this.match(q, ['subdivision', 'sub-division', 'sub division'])) {
      return {
        text:
          `<strong>Meteorological subdivisions</strong> are IMD's operational units (broader than states in some cases).` +
          `<br>The subdivision map aggregates rainfall for those units — ideal for monsoon monitoring and regional summaries.`,
        suggestions: [
          'What do these four maps show?',
          'Where is monsoon activity?',
        ],
      };
    }

    if (this.match(q, ['region', 'homogeneous', 'homogenous'])) {
      return {
        text:
          `The <strong>Region / Homogeneous</strong> map shows large climatic regions (e.g. Northwest, Central India, South Peninsula, East & Northeast).` +
          `<br>Use it for a country-scale narrative; drill into district/state maps for detail.`,
        suggestions: [
          'What do these four maps show?',
          'Where else can I see rainfall maps?',
        ],
      };
    }

    if (this.match(q, ['state'])) {
      return {
        text:
          `The <strong>State map</strong> rolls district rainfall up to state boundaries — good for interstate comparison and briefings.` +
          `<br>Coverage shows how many districts within each state have data for the period.`,
        suggestions: [
          'What is the difference between Actual and Departure?',
          'How do I check station coverage?',
        ],
      };
    }

    if (this.match(q, ['monsoon', 'activity'])) {
      return {
        text:
          `For monsoon-focused views, open <strong>Monsoon Activity</strong> from the navigation (` +
          `<code>/monsoon-activity</code>).` +
          `<br>All Maps remains your daily / period overview across district → region scales.`,
        suggestions: [
          'Where else can I see rainfall maps?',
          'What do these four maps show?',
        ],
      };
    }

    if (this.match(q, ['navigate', 'where else', 'other maps', 'daily', 'weekly', 'spatial', 'go to', 'menu'])) {
      return {
        text:
          `Beyond All Maps, iRAINS has specialised products:` +
          `<ul class="rain-list">` +
          `<li><strong>Daily / Weekly / Cumulative</strong> rainfall maps under Rainfall Maps nav</li>` +
          `<li><strong>Spatial</strong> district views & distribution tables</li>` +
          `<li><strong>Block rainfall</strong> for finer admin units</li>` +
          `<li><strong>Station-level data</strong> & statistics for verification</li>` +
          `<li><strong>Monsoon activity</strong> & river basin products</li>` +
          `</ul>` +
          `Use the top navbar to jump — All Maps is the home overview.`,
        suggestions: [
          'How do I change the date range?',
          'What is the difference between Actual and Departure?',
        ],
      };
    }

    if (this.match(q, ['station', 'aws', 'arg', 'observ'])) {
      return {
        text:
          `Rainfall on these maps is built from station observations aggregated to districts and higher units.` +
          `<br>Use the <strong>coverage</strong> buttons here for counts, or open <strong>Station Level Data</strong> / <strong>Station Statistics</strong> for station-wise series and QC.`,
        suggestions: [
          'How do I check station coverage?',
          'Where else can I see rainfall maps?',
        ],
      };
    }

    if (this.match(q, ['help', 'how to use', 'guide', 'what can you', 'features'])) {
      return {
        text:
          `I can help with:` +
          `<ul class="rain-list">` +
          `<li>Understanding the four All Maps panels</li>` +
          `<li>Actual vs Departure products</li>` +
          `<li>Departure colour legend</li>` +
          `<li>Station coverage sidebar</li>` +
          `<li>Dates, download & navigation tips</li>` +
          `</ul>` +
          `Try a quick chip below, or ask in your own words.`,
        suggestions: this.quickPrompts.map((p) => p.query),
      };
    }

    if (this.match(q, ['thank', 'thanks', 'bye', 'goodbye'])) {
      return {
        text: `You're welcome — stay weather-wise. Varsha is here whenever you need a rainfall briefing on All Maps.`,
      };
    }

    return {
      text:
        `I didn't catch a precise match, but here's what usually helps on this page:` +
        `<ul class="rain-list">` +
        `<li>Ask about <em>maps</em>, <em>Actual vs Departure</em>, <em>legend</em>, or <em>coverage</em></li>` +
        `<li>Current mode: <strong>${this.dataMode}</strong>` +
        (this.fromDate && this.toDate
          ? ` · dates <strong>${this.fromDate}</strong> → <strong>${this.toDate}</strong>`
          : '') +
        `</li>` +
        `</ul>` +
        `Pick a suggestion, or rephrase — I'm tuned for iRAINS rainfall workflows.`,
      suggestions: [
        'What do these four maps show?',
        'Explain the rainfall departure colours',
        'How do I check station coverage?',
        'Where else can I see rainfall maps?',
      ],
    };
  }

  private match(q: string, keys: string[]): boolean {
    return keys.some((k) => q.includes(k));
  }
}
