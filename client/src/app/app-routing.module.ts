import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'vector-viewer',
    loadChildren: () =>
      import('./vector-module/vector-viewer.module').then((m) => m.VectorViewerModule),
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'vector-viewer',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
