import {NgModule} from '@angular/core';
import {IonicPageModule} from 'ionic-angular';
import {PlanCreatePage} from "./plan-create";

@NgModule({
  declarations: [
    PlanCreatePage
  ],
  imports: [
    IonicPageModule.forChild(PlanCreatePage),
  ],
  exports: [
    PlanCreatePage
  ]
})
export class PlanCreatePageModule {
}
