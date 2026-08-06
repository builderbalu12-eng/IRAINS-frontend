import { Injectable } from "@angular/core";

export interface CapturedFile {
  name: string;
  blob: Blob;
}

/**
 * Diverts browser downloads into memory so a batch can be zipped instead of
 * landing as dozens of separate files.
 *
 * The existing statistics services save directly — jsPDF calls `doc.save()`
 * and the Excel path calls `FileSaver.saveAs()`. Neither hands back the bytes,
 * and both are shared with other pages, so rather than change all seven this
 * intercepts the two things they both end up doing: minting an object URL and
 * clicking an anchor that carries a `download` attribute.
 *
 * While capture is active nothing reaches the disk. Anything the interception
 * misses still downloads normally — worst case a file lands beside the zip
 * instead of inside it, which is visible rather than silent.
 */
@Injectable({ providedIn: "root" })
export class DownloadCaptureService {
  private active = false;
  private files: CapturedFile[] = [];
  private blobsByUrl = new Map<string, Blob>();

  private realCreateObjectURL?: typeof URL.createObjectURL;
  private realClick?: () => void;
  private realDispatch?: (event: Event) => boolean;

  get isActive(): boolean {
    return this.active;
  }

  /** begin diverting downloads */
  start(): void {
    if (this.active) return;
    this.active = true;
    this.files = [];
    this.blobsByUrl.clear();

    // Remember every blob behind an object url so the anchor's href can be
    // resolved back to bytes without a fetch round trip.
    this.realCreateObjectURL = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (obj: any): string => {
      const url = this.realCreateObjectURL!(obj);
      if (obj instanceof Blob) this.blobsByUrl.set(url, obj);
      return url;
    };

    const capture = (anchor: HTMLAnchorElement): boolean => {
      const name = anchor.getAttribute("download");
      if (!name) return false; // not a download — leave it alone
      const href = anchor.href || "";
      const blob = this.blobsByUrl.get(href);
      if (blob) {
        this.files.push({ name, blob });
        return true;
      }
      if (href.startsWith("data:")) {
        this.files.push({ name, blob: this.dataUrlToBlob(href) });
        return true;
      }
      return false; // unknown source: let it download normally
    };

    // file-saver dispatches a synthetic MouseEvent; jsPDF and our own code
    // call .click(). Both routes are covered.
    const self = this;
    this.realClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
      if (self.active && capture(this)) return;
      return self.realClick!.apply(this);
    };

    this.realDispatch = HTMLAnchorElement.prototype.dispatchEvent;
    HTMLAnchorElement.prototype.dispatchEvent = function (
      this: HTMLAnchorElement,
      event: Event
    ) {
      if (self.active && event?.type === "click" && capture(this)) return true;
      return self.realDispatch!.call(this, event);
    };
  }

  /** stop diverting and hand back what was collected */
  stop(): CapturedFile[] {
    if (!this.active) return [];
    this.active = false;

    if (this.realCreateObjectURL) URL.createObjectURL = this.realCreateObjectURL;
    if (this.realClick) HTMLAnchorElement.prototype.click = this.realClick;
    if (this.realDispatch) HTMLAnchorElement.prototype.dispatchEvent = this.realDispatch;

    const files = this.files;
    this.files = [];
    this.blobsByUrl.clear();
    return files;
  }

  /** add a file we produced ourselves (the rendered map sheets) */
  add(name: string, blob: Blob): void {
    this.files.push({ name, blob });
  }

  dataUrlToBlob(dataUrl: string): Blob {
    const [head, body] = dataUrl.split(",");
    const mime = /:(.*?);/.exec(head)?.[1] || "application/octet-stream";
    const binary = atob(body);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }
}
