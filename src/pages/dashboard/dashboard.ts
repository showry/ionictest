import {Component} from '@angular/core';
import {IonicPage, NavController, NavParams} from 'ionic-angular';
import {LoadingStacker} from "../../providers/stacker/loading-stacker";
import {AuthService} from "../../providers/pidge-client/auth-service";
import {UserInterface} from "../../models/user";
import {Group} from "../../shared/group";
import {Notification} from "../../models/notification";
import {NotificationUIService} from "../../view-models/providers/notification-ui-service";
import {
  NotificationService,
  NotificationsUpdatedResultInterface
} from "../../providers/pidge-client/notification-service";
import {EventService} from "../../providers/pidge-client/event-service";
import {AnalyticsLogger} from "../../providers/services/analytics-logger";
import {Subscription} from "rxjs/Subscription";
import {StandardToast} from "../../providers/services/standard-toast";

@IonicPage({})
@Component({
  selector: 'page-dashboard',
  templateUrl: 'dashboard.html',
})
export class DashboardPage {

  protected user: UserInterface;
  protected notifications: Notification[] = [];
  protected notificationGroups: Group<Notification>;
  protected grouped: boolean = true;
  protected groupDisplayExpandStatus: { [key: string]: boolean } = {};
  protected notificationUiService: NotificationUIService;
  protected firstTimeLoaded: boolean = false;
  protected notificationServiceSubscrition: Subscription;

  constructor(protected navCtrl: NavController,
              protected navParams: NavParams,
              protected auth: AuthService,
              protected toastCtrl: StandardToast,
              protected loadingStacker: LoadingStacker,
              protected notificationService: NotificationService,
              protected eventService: EventService,
              protected analytics: AnalyticsLogger) {

    this.auth.whenUserAuthenticated()
      .then(user => this.user = user)
      .then(() => this.notificationServiceSubscrition = this.notificationService.getNotificationData().subscribe(res => {
        this.firstTimeLoaded = true;
        this.notifications = res;
         this.prepareDisplayedGroup(res);
       })
      );
       
    this.notificationUiService = new NotificationUIService(this.navCtrl, this.notificationService, this.eventService, this.toastCtrl, this.loadingStacker);

  }

  ionViewDidEnter() {
    this.analytics.ga().then(ga => ga.trackView('Dashboard Page'));
  }

  protected successToast(message: string) {
    return this.toastCtrl.showSuccess(message);
  }

  protected errorToast(error: any) {
    return this.toastCtrl.showError(error);
  }

  public toast(message: string, error: boolean = false) {
    return error ? this.errorToast(message) : this.successToast(message);
  }

  public refreshNotifications(refresher) {

    this.notificationService.getNotificationData().subscribe(res => {
      this.firstTimeLoaded = true;
      this.notifications = res;
      this.prepareDisplayedGroup(res);
      refresher.complete()

     })
    // this.notificationService.fetchNewNotifications()
    //   .then(() => refresher.complete())
    //   .catch(() => refresher.complete())
    //   .then(() => this.loadingStacker.pop());
  }

  protected toggleGrouped() {
    this.grouped = !this.grouped;
  }

  protected prepareDisplayedGroup(notifications?: NotificationsUpdatedResultInterface) {
   
    // if (!this.notificationGroups) {
      this.notificationGroups = this.notificationService.group([
        (notification: Notification) => {
          let typeDisplay: string, typeValue: string = notification.type;
          switch (notification.type) {
            case 'EventInvitationAccepted':
              typeDisplay = "Some members are ready for event";
              break;
            case 'EventInvitationSent':
              typeDisplay = "Ready for events?";
              break;
            case 'EventInvitationConfirmed':
              typeDisplay = "Admin confirmed you are going";
              break;
            case 'EventInvitationRejected':
              typeDisplay = "Admin did not confirm your going";
              break;
            case 'Chats':
            case 'EventCreated':
            case 'EventInvitationCancelled':
            case 'EventChanged':
              typeDisplay = "Updates from your teams";
              typeValue = "TeamRelated";
              break;
          }
          return {
            key: 'type',
            value: typeValue,
            display: typeDisplay
          };
        
        },
       
      ],this.notifications);
    // } else {
    //   notifications.new.forEach(notification => this.notificationGroups.index(notification));
    //   notifications.removed.forEach(notification => this.notificationGroups.remove(notification));
    // }
  }

  protected toggleGroup() {
    let expanded = this.expanded();
    let groupDisplayExpandStatus = this.groupDisplayExpandStatus;
    return (group: Group<Notification>) => groupDisplayExpandStatus[group.idKey + ":" + group.id] = !expanded(group);
  }

  protected doInfinite(event){

    this.notificationService.getNotificationData(this.notifications[0].id,this.notifications[this.notifications.length-1].id).subscribe(res=>{
      let tesd:any= this.notifications=this.notifications.concat(res);
      this.prepareDisplayedGroup(tesd);

      event.complete();
    })
  }
  protected expanded() {
    let groupDisplayExpandStatus = this.groupDisplayExpandStatus;
    return (group: Group<Notification>) => groupDisplayExpandStatus.hasOwnProperty(group.idKey + ":" + group.id) && groupDisplayExpandStatus[group.idKey + ":" + group.id];
  }

  protected getViewModel() {
    let notificationUiService = this.notificationUiService;
    return (notification: Notification) => notificationUiService.getViewModel(notification);
  }

}
