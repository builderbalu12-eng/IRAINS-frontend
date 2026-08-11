import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timeout } from 'rxjs';
import { environment } from 'src/environment/environment';

export interface OllamaChatRequest {
  question: string;
  /** When true, backend skips the second LLM pass and uses a template answer. */
  skipAnswerLlm?: boolean;
}

export interface OllamaChatAction {
  module?: string;
  api_id?: string;
  method?: string;
  path?: string;
  body?: Record<string, unknown>;
  query?: Record<string, unknown>;
  post_filter?: Record<string, unknown>;
  post_process?: {
    type?: string;
    categories?: string[];
  } | null;
  product_name?: string;
  route_path?: string;
  reason?: string;
}

export interface OllamaChatApiResult {
  ok?: boolean;
  status?: number;
  request?: {
    method?: string;
    url?: string;
    body?: Record<string, unknown>;
    query?: Record<string, unknown>;
  };
  row_count?: number | null;
  note?: string | null;
  usedDate?: string | null;
  data?: any;
}

export interface OllamaChatNavigation {
  product_name?: string | null;
  route_path?: string | null;
}

export interface OllamaChatResponse {
  success: boolean;
  mode?: string;
  model?: string;
  answer?: string;
  answer_mode?: 'ollama' | 'fallback' | string;
  action?: OllamaChatAction;
  navigation?: OllamaChatNavigation | null;
  api?: OllamaChatApiResult;
  stage?: string;
  message?: string;
  llm_plan_raw?: string;
  meta?: any;
  /** Question fell outside the rainfall / navigation catalog. */
  out_of_scope?: boolean;
  /** Example questions to offer when out_of_scope. */
  suggestions?: string[];
}

export interface SampleQuestions {
  rainfall?: string[];
  navigation?: string[];
}

export interface NavigationProduct {
  product_name: string;
  route_path: string;
}

export interface OllamaHealthResponse {
  success: boolean;
  ollama?: {
    up?: boolean;
    models?: string[];
    baseUrl?: string;
    model?: string;
  };
  demo_question?: string;
  sample_questions?: SampleQuestions;
  navigation_products?: NavigationProduct[];
  training_note?: string;
  install_hint?: string[];
}

/** Alias kept for existing imports. */
export type RainfallChatRequest = OllamaChatRequest;
export type RainfallChatResponse = OllamaChatResponse;

@Injectable({
  providedIn: 'root',
})
export class RainfallChatService {
  private baseUrl = environment.baseUrl;
  /** Ollama plan + answer can take a while on local models. */
  private readonly requestTimeoutMs = 120_000;

  constructor(private http: HttpClient) {}

  ask(body: OllamaChatRequest): Observable<OllamaChatResponse> {
    return this.http
      .post<OllamaChatResponse>(`${this.baseUrl}/api/v1/ollama-chat`, body)
      .pipe(timeout(this.requestTimeoutMs));
  }

  health(): Observable<OllamaHealthResponse> {
    return this.http
      .get<OllamaHealthResponse>(`${this.baseUrl}/api/v1/ollama-chat/health`)
      .pipe(timeout(10_000));
  }
}
