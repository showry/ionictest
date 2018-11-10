import {Component} from '@angular/core';
import {IonicPage, NavController, NavParams} from 'ionic-angular';
import {NotificationService} from "../../providers/pidge-client/notification-service";
import {ChatService} from "../../providers/pidge-client/chat-service";
import {UserEventsListService} from "../../providers/pidge-client/user-event-list-service";
import {CalendarPage} from "../calendar/calendar";
import {ChatsPage} from "../chats/chats";
import {DashboardPage} from "../dashboard/dashboard";
import {InitPidge} from "../../providers/services/init-pidge";

@IonicPage({
  priority: 'high'
})
@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
})
export class HomePage {

  protected tab1Root = DashboardPage;
  protected tab2Root = ChatsPage;
  protected tab3Root = CalendarPage;

  private notifications: number = 0;
  private chats: number = 0;
  private events: number = 0;

  constructor(protected navCtrl: NavController,
              protected notificationService: NotificationService,
              protected chatService: ChatService,
              protected eventsListService: UserEventsListService,
              protected navParams: NavParams,
              protected initPidge: InitPidge) {
    this.initPidge.subscribe(ready => ready ? this.init() : null);
  }

  protected init() {
 

    this.notificationService.getNotificationSummary().subscribe(res=>{
      this.notifications=res.unread_notification_count;}
      ,err=>{
      }
    )
 

   this.chatService.getTeamSummary().subscribe(res=>{
   })
 

  this.eventsListService.getCalendarSummary().subscribe(res=>{
    this.events=res.total_events_count;

  })

  }

}
