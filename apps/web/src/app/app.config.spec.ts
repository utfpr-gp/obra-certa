import { XhrFactory } from '@angular/common';
import {
  FetchBackend,
  HttpBackend,
  HttpClient,
  HttpErrorResponse,
  HttpEvent,
  HttpEventType,
  HttpXhrBackend,
} from '@angular/common/http';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { appConfig } from './app.config';
import { config as serverConfig } from './app.config.server';
import { Auth } from './core/services/auth';

describe('Application HTTP transport', () => {
  let auth: jasmine.SpyObj<Auth>;

  beforeEach(() => {
    auth = jasmine.createSpyObj<Auth>('Auth', ['getToken', 'logout']);
    auth.getToken.and.returnValue('upload-token');
  });

  describe('browser', () => {
    let xhr: XMLHttpRequest;
    let requestHeaders: jasmine.Spy;

    beforeEach(() => {
      // Keep Angular's real backend; control only the browser transport boundary.
      xhr = new XMLHttpRequest();
      spyOn(xhr, 'open');
      spyOn(xhr, 'send');
      spyOn(xhr, 'abort');
      spyOn(xhr, 'getAllResponseHeaders').and.returnValue('Content-Type: application/json');
      requestHeaders = spyOn(xhr, 'setRequestHeader');
      // A regression to Fetch must fail without issuing a real network request.
      spyOn(globalThis, 'fetch').and.returnValue(new Promise<Response>(() => {}));

      TestBed.configureTestingModule({
        providers: [
          ...appConfig.providers,
          { provide: Auth, useValue: auth },
          { provide: XhrFactory, useValue: { build: () => xhr } },
        ],
      });
    });

    function respond(status: number): void {
      Object.defineProperties(xhr, {
        status: { value: status },
        statusText: { value: status === 200 ? 'OK' : 'Unauthorized' },
        response: { value: '{}' },
        readyState: { value: XMLHttpRequest.DONE },
      });
      xhr.dispatchEvent(new ProgressEvent('load'));
    }

    it('selects the real XHR backend for upload progress', () => {
      expect(TestBed.inject(HttpBackend)).toBeInstanceOf(HttpXhrBackend);
    });

    it('emits intermediate upload progress before the response and preserves Bearer authentication', () => {
      const body = new FormData();
      body.append('file', new Blob(['receipt'], { type: 'application/pdf' }), 'receipt.pdf');
      const events: HttpEvent<unknown>[] = [];
      const subscription = TestBed.inject(HttpClient).put('/api/expenses/expense-id/receipt', body, {
        observe: 'events',
        reportProgress: true,
      }).subscribe((event) => events.push(event));

      try {
        xhr.upload.dispatchEvent(new ProgressEvent('progress', {
          lengthComputable: true,
          loaded: 25,
          total: 100,
        }));

        expect(xhr.send).toHaveBeenCalledWith(body);
        expect(requestHeaders).toHaveBeenCalledWith('Authorization', 'Bearer upload-token');
        expect(events).toContain(jasmine.objectContaining({
          type: HttpEventType.UploadProgress,
          loaded: 25,
          total: 100,
        }));
        expect(events.some((event) => event.type === HttpEventType.Response)).toBeFalse();

        respond(200);
        expect(events.some((event) => event.type === HttpEventType.Response)).toBeTrue();
      } finally {
        subscription.unsubscribe();
      }
    });

    it('keeps the authentication interceptor logout on an upload returning 401', () => {
      let failure: HttpErrorResponse | undefined;
      const subscription = TestBed.inject(HttpClient).put('/api/expenses/expense-id/receipt', new FormData())
        .subscribe({ error: (error: HttpErrorResponse) => failure = error });

      try {
        respond(401);
        expect(failure?.status).toBe(401);
        expect(auth.logout).toHaveBeenCalledTimes(1);
      } finally {
        subscription.unsubscribe();
      }
    });
  });

  describe('server', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          ...serverConfig.providers,
          { provide: PLATFORM_ID, useValue: 'server' },
          { provide: Auth, useValue: auth },
        ],
      });
    });

    it('keeps Fetch for server rendering', () => {
      expect(TestBed.inject(HttpBackend)).toBeInstanceOf(FetchBackend);
    });

    it('preserves the authentication interceptor on server Fetch requests', async () => {
      const fetch = spyOn(globalThis, 'fetch').and.resolveTo(new Response('{}', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }));

      await firstValueFrom(TestBed.inject(HttpClient).get('https://example.test/api/expenses'));

      expect(fetch).toHaveBeenCalledTimes(1);
      const options = fetch.calls.mostRecent().args[1];
      expect(new Headers(options?.headers).get('Authorization')).toBe('Bearer upload-token');
    });
  });
});
