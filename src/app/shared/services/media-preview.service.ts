import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class MediaPreviewService {
  openInNewTab(url?: string | null): boolean {
    if (!url) {
      return false;
    }

    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    return Boolean(newWindow);
  }
}
