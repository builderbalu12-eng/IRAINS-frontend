import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environment/environment';

@Injectable({ providedIn: 'root' })
export class AllAWSDataService {
  private base = environment.baseUrl;

  constructor(private http: HttpClient) {}

  // ── UP AWS ────────────────────────────────────────────────────────────────
  fetchUpAwsSlot(body: any): Observable<any>       { return this.post('/api/v1/up-aws/slot', body); }
  fetchUpAwsHourly(body: any): Observable<any>     { return this.post('/api/v1/up-aws/hourly', body); }
  fetchUpAwsDaily(body: any): Observable<any>      { return this.post('/api/v1/up-aws/daily', body); }
  fetchUpAwsCumulative(body: any): Observable<any> { return this.post('/api/v1/up-aws/cumulative', body); }

  // ── NHP AWS ───────────────────────────────────────────────────────────────
  fetchNhpAwsSlot(body: any): Observable<any>       { return this.post('/api/v1/nhp-aws/slot', body); }
  fetchNhpAwsHourly(body: any): Observable<any>     { return this.post('/api/v1/nhp-aws/hourly', body); }
  fetchNhpAwsDaily(body: any): Observable<any>      { return this.post('/api/v1/nhp-aws/daily', body); }
  fetchNhpAwsCumulative(body: any): Observable<any> { return this.post('/api/v1/nhp-aws/cumulative', body); }

  // ── ZOMATO AWS ────────────────────────────────────────────────────────────
  fetchZomatoAwsSlot(body: any): Observable<any>       { return this.post('/api/v1/zomato-aws/slot', body); }
  fetchZomatoAwsHourly(body: any): Observable<any>     { return this.post('/api/v1/zomato-aws/hourly', body); }
  fetchZomatoAwsDaily(body: any): Observable<any>      { return this.post('/api/v1/zomato-aws/daily', body); }
  fetchZomatoAwsCumulative(body: any): Observable<any> { return this.post('/api/v1/zomato-aws/cumulative', body); }

  // ── MEGHALAYA AWS ─────────────────────────────────────────────────────────
  fetchMeghalayaAwsSlot(body: any): Observable<any>       { return this.post('/api/v1/meghalaya-aws/slot', body); }
  fetchMeghalayaAwsHourly(body: any): Observable<any>     { return this.post('/api/v1/meghalaya-aws/hourly', body); }
  fetchMeghalayaAwsDaily(body: any): Observable<any>      { return this.post('/api/v1/meghalaya-aws/daily', body); }
  fetchMeghalayaAwsCumulative(body: any): Observable<any> { return this.post('/api/v1/meghalaya-aws/cumulative', body); }

  // ── MIZORAM AWS ───────────────────────────────────────────────────────────
  fetchMizoramAwsSlot(body: any): Observable<any>       { return this.post('/api/v1/mizoram-aws/slot', body); }
  fetchMizoramAwsHourly(body: any): Observable<any>     { return this.post('/api/v1/mizoram-aws/hourly', body); }
  fetchMizoramAwsDaily(body: any): Observable<any>      { return this.post('/api/v1/mizoram-aws/daily', body); }
  fetchMizoramAwsCumulative(body: any): Observable<any> { return this.post('/api/v1/mizoram-aws/cumulative', body); }

  // ── TAMILNADU AWS ─────────────────────────────────────────────────────────
  fetchTamilnaduAwsSlot(body: any): Observable<any>       { return this.post('/api/v1/tamilnadu-aws/slot', body); }
  fetchTamilnaduAwsHourly(body: any): Observable<any>     { return this.post('/api/v1/tamilnadu-aws/hourly', body); }
  fetchTamilnaduAwsDaily(body: any): Observable<any>      { return this.post('/api/v1/tamilnadu-aws/daily', body); }
  fetchTamilnaduAwsCumulative(body: any): Observable<any> { return this.post('/api/v1/tamilnadu-aws/cumulative', body); }

  // ── UTTARAKHAND AWS ───────────────────────────────────────────────────────
  fetchUttarakhandAwsSlot(body: any): Observable<any>       { return this.post('/api/v1/uttarakhand-aws/slot', body); }
  fetchUttarakhandAwsHourly(body: any): Observable<any>     { return this.post('/api/v1/uttarakhand-aws/hourly', body); }
  fetchUttarakhandAwsDaily(body: any): Observable<any>      { return this.post('/api/v1/uttarakhand-aws/daily', body); }
  fetchUttarakhandAwsCumulative(body: any): Observable<any> { return this.post('/api/v1/uttarakhand-aws/cumulative', body); }

  // ── TELANGANA AWS ─────────────────────────────────────────────────────────
  fetchTelanganaAwsSlot(body: any): Observable<any>       { return this.post('/api/v1/telangana-aws/slot', body); }
  fetchTelanganaAwsHourly(body: any): Observable<any>     { return this.post('/api/v1/telangana-aws/hourly', body); }
  fetchTelanganaAwsDaily(body: any): Observable<any>      { return this.post('/api/v1/telangana-aws/daily', body); }
  fetchTelanganaAwsCumulative(body: any): Observable<any> { return this.post('/api/v1/telangana-aws/cumulative', body); }

  // ── KARNATAKA AWS ─────────────────────────────────────────────────────────
  fetchKarnatakaAwsSlot(body: any): Observable<any>       { return this.post('/api/v1/karnataka-aws/slot', body); }
  fetchKarnatakaAwsHourly(body: any): Observable<any>     { return this.post('/api/v1/karnataka-aws/hourly', body); }
  fetchKarnatakaAwsDaily(body: any): Observable<any>      { return this.post('/api/v1/karnataka-aws/daily', body); }
  fetchKarnatakaAwsCumulative(body: any): Observable<any> { return this.post('/api/v1/karnataka-aws/cumulative', body); }

  // ── IITM MUMBAI ───────────────────────────────────────────────────────────
  fetchIitmMumbaiSlot(body: any): Observable<any>       { return this.post('/api/v1/iitm-mumbai/slot', body); }
  fetchIitmMumbaiHourly(body: any): Observable<any>     { return this.post('/api/v1/iitm-mumbai/hourly', body); }
  fetchIitmMumbaiDaily(body: any): Observable<any>      { return this.post('/api/v1/iitm-mumbai/daily', body); }
  fetchIitmMumbaiCumulative(body: any): Observable<any> { return this.post('/api/v1/iitm-mumbai/cumulative', body); }

  // ── Convenience: all 10 sources for a given granularity ──────────────────
  fetchAllByGranularity(granularity: '15min' | '1hour' | 'daily' | 'cumulative', body: any): Observable<any>[] {
    const safe = (obs: Observable<any>) => obs.pipe(catchError(() => of({ data: [] })));
    const pick = (slot: Observable<any>, hourly: Observable<any>, daily: Observable<any>, cum: Observable<any>) => {
      if (granularity === '15min')      return safe(slot);
      if (granularity === '1hour')      return safe(hourly);
      if (granularity === 'cumulative') return safe(cum);
      return safe(daily);
    };

    return [
      pick(this.fetchUpAwsSlot(body),          this.fetchUpAwsHourly(body),          this.fetchUpAwsDaily(body),          this.fetchUpAwsCumulative(body)),
      pick(this.fetchNhpAwsSlot(body),          this.fetchNhpAwsHourly(body),          this.fetchNhpAwsDaily(body),          this.fetchNhpAwsCumulative(body)),
      pick(this.fetchZomatoAwsSlot(body),       this.fetchZomatoAwsHourly(body),       this.fetchZomatoAwsDaily(body),       this.fetchZomatoAwsCumulative(body)),
      pick(this.fetchMeghalayaAwsSlot(body),    this.fetchMeghalayaAwsHourly(body),    this.fetchMeghalayaAwsDaily(body),    this.fetchMeghalayaAwsCumulative(body)),
      pick(this.fetchMizoramAwsSlot(body),      this.fetchMizoramAwsHourly(body),      this.fetchMizoramAwsDaily(body),      this.fetchMizoramAwsCumulative(body)),
      pick(this.fetchTamilnaduAwsSlot(body),    this.fetchTamilnaduAwsHourly(body),    this.fetchTamilnaduAwsDaily(body),    this.fetchTamilnaduAwsCumulative(body)),
      pick(this.fetchUttarakhandAwsSlot(body),  this.fetchUttarakhandAwsHourly(body),  this.fetchUttarakhandAwsDaily(body),  this.fetchUttarakhandAwsCumulative(body)),
      pick(this.fetchTelanganaAwsSlot(body),    this.fetchTelanganaAwsHourly(body),    this.fetchTelanganaAwsDaily(body),    this.fetchTelanganaAwsCumulative(body)),
      pick(this.fetchKarnatakaAwsSlot(body),    this.fetchKarnatakaAwsHourly(body),    this.fetchKarnatakaAwsDaily(body),    this.fetchKarnatakaAwsCumulative(body)),
      pick(this.fetchIitmMumbaiSlot(body),      this.fetchIitmMumbaiHourly(body),      this.fetchIitmMumbaiDaily(body),      this.fetchIitmMumbaiCumulative(body)),
    ];
  }

  // ── Actual-Departure endpoints ────────────────────────────────────────────
  fetchKarnatakaActualDeparture(body: any): Observable<any>   { return this.post('/api/v1/karnataka-aws/actual-departure', body); }
  fetchUpActualDeparture(body: any): Observable<any>          { return this.post('/api/v1/up-aws/actual-departure', body); }
  fetchTamilnaduActualDeparture(body: any): Observable<any>   { return this.post('/api/v1/tamilnadu-aws/actual-departure', body); }
  fetchUttarakhandActualDeparture(body: any): Observable<any> { return this.post('/api/v1/uttarakhand-aws/actual-departure', body); }
  fetchTelanganaActualDeparture(body: any): Observable<any>   { return this.post('/api/v1/telangana-aws/actual-departure', body); }
  fetchMeghalayaActualDeparture(body: any): Observable<any>   { return this.post('/api/v1/meghalaya-aws/actual-departure', body); }
  fetchMizoramActualDeparture(body: any): Observable<any>     { return this.post('/api/v1/mizoram-aws/actual-departure', body); }
  fetchNhpActualDeparture(body: any): Observable<any>         { return this.post('/api/v1/nhp-aws/actual-departure', body); }
  fetchIitmMumbaiActualDeparture(body: any): Observable<any>  { return this.post('/api/v1/iitm-mumbai/actual-departure', body); }
  fetchZomatoActualDeparture(body: any): Observable<any>      { return this.post('/api/v1/zomato-aws/actual-departure', body); }

  fetchAllActualDeparture(body: any): Observable<any>[] {
    const safe = (obs: Observable<any>) => obs.pipe(catchError(() => of({ data: [] })));
    return [
      safe(this.fetchKarnatakaActualDeparture(body)),
      safe(this.fetchUpActualDeparture(body)),
      safe(this.fetchTamilnaduActualDeparture(body)),
      safe(this.fetchUttarakhandActualDeparture(body)),
      safe(this.fetchTelanganaActualDeparture(body)),
      safe(this.fetchMeghalayaActualDeparture(body)),
      safe(this.fetchMizoramActualDeparture(body)),
      safe(this.fetchNhpActualDeparture(body)),
      safe(this.fetchIitmMumbaiActualDeparture(body)),
      safe(this.fetchZomatoActualDeparture(body)),
    ];
  }

  private post(path: string, body: any): Observable<any> {
    return this.http.post<any>(`${this.base}${path}`, body);
  }
}
