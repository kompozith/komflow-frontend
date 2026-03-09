import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

function applyFaviconVersion(version: string): void {
  const favicon = document.querySelector<HTMLLinkElement>('link#app-favicon, link[rel*="icon"]');
  if (!favicon) {
    return;
  }

  favicon.href = `favicon.ico?v=${encodeURIComponent(version || '1.0.0')}`;
}

applyFaviconVersion(environment.appVersion || '1.0.0');

bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err)
);
