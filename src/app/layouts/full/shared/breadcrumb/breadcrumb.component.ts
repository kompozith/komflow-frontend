import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { Router, NavigationEnd, ActivatedRoute, Data } from '@angular/router';
import { filter, map, mergeMap } from 'rxjs/operators';
import { TablerIconsModule } from 'angular-tabler-icons';

@Component({
    selector: 'app-breadcrumb',
    imports: [RouterModule, TablerIconsModule],
    templateUrl: './breadcrumb.component.html',
    styleUrls: ['./breadcrumb.component.scss']
})
export class AppBreadcrumbComponent {
  // @Input() layout;
  pageInfo: Data | any = Object.create(null);
  myurl: any = this.router.url.slice(1).split('/');
  private routeParams: Record<string, string> = {};

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private titleService: Title
  ) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .pipe(map(() => this.activatedRoute))
      .pipe(
        map((route) => {
          while (route.firstChild) {
            route = route.firstChild;
          }
          return route;
        })
      )
      .pipe(filter((route) => route.outlet === 'primary'))
      .pipe(mergeMap((route) => {
        // Collect all params from the route hierarchy
        let r: ActivatedRoute | null = route;
        const params: Record<string, string> = { ...route.snapshot.params };
        while (r) {
          Object.assign(params, r.snapshot.params);
          r = r.parent;
        }
        this.routeParams = params;
        return route.data;
      }))
      // tslint:disable-next-line - Disables all
      .subscribe((event) => {
        // tslint:disable-next-line - Disables all
        this.titleService.setTitle(event['title'] + ' - Komflow');
        this.pageInfo = event;
      });
  }

  /** Résout les segments dynamiques (:param) dans une URL de breadcrumb. */
  resolveUrl(url: string | undefined): string {
    if (!url) return '';
    return url.replace(/:([a-zA-Z_]+)/g, (_, key) => this.routeParams[key] ?? '');
  }
}
