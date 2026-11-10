import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment';

bootstrapApplication(App, appConfig)
  .then(() => {
    if (environment.production && 'serviceWorker' in navigator) {
      return navigator.serviceWorker.register('obra-sw.js');
    }
    return undefined;
  })
  .catch((err) => console.error(err));
