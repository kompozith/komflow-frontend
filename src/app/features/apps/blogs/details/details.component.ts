import { Component, OnInit, signal, inject } from '@angular/core';
import { blogService } from 'src/app/services/apps/blog/blog.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';


@Component({
  selector: 'app-blog-details',
  imports: [
    MatCardModule,
    MatChipsModule,
    TablerIconsModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
],
  templateUrl: './details.component.html',
})
export class AppBlogDetailsComponent implements OnInit {
  router = inject(Router);
  blogService = inject(blogService);

  title = signal<string | any>(null);
  blogDetail = signal<any>(null);
  istoggleReply = signal<boolean>(true);
  activeRoute: any = this.router.url.split('/').pop();

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {
    const activatedRouter = inject(ActivatedRoute);

    this.title.set(activatedRouter.snapshot.paramMap.get('id'));
  }

  ngOnInit(): void {
    const posts = this.blogService.getBlog();
    this.blogDetail.set(posts.find((post) => post.title === this.title()));
  }
  toggleReply() {
    this.istoggleReply.set(!this.istoggleReply());
  }
}
