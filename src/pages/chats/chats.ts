import { PlanCreatePage } from './../plan-create/plan-create';
import {Component} from "@angular/core";
import {IonicPage, NavController, NavParams} from "ionic-angular";
import {UserInterface} from "../../models/user";
import {Chat} from "../../models/chat";
import {AuthService} from "../../providers/pidge-client/auth-service";
import {ChatService} from "../../providers/pidge-client/chat-service";
import {UserMetaInfoService} from "../../providers/pidge-client/user-meta-info-service";
import {ChatCreatePage} from "../chat-create/chat-create";
import {ChatPage} from "../chat/chat";
import {AnalyticsLogger} from "../../providers/services/analytics-logger";
import {LoadingStacker} from "../../providers/stacker/loading-stacker";
import {StandardResponseAlert} from "../../providers/services/standard-response-alert";


@IonicPage({})
@Component({
  selector: "page-chats",
  templateUrl: "chats.html",
})
export class ChatsPage {

  protected user: UserInterface;

  protected chats: Chat[] = [];
  protected pendingTeams:Array<any>=[];

  protected loaded = false;

  public constructor(protected navCtrl: NavController,
                     protected navParams: NavParams,
                     protected auth: AuthService,
                     protected chatService: ChatService,
                     protected loadingStacker: LoadingStacker,
                     protected userMeta: UserMetaInfoService,
                     protected standardAlert: StandardResponseAlert,
                     protected analytics: AnalyticsLogger) {

    this.user = this.auth.currentUser;
    
    // this.chatService.subscribe(refreshed => {
    //   this.chats = refreshed;
    //   this.loaded = true;
    // });
    this.loaded = this.userMeta.info().successLoads > 0;
    // this.chats = this.chatService.getChats();
    Promise.resolve(this.loadingStacker.add())
    .then(()=>this.getAllTeam())
    .then(()=>this.loadingStacker.pop());

    Promise.resolve(this.loadingStacker.add())
    .then(() => this.getTeamUserInvitation())
    .then(() => this.loadingStacker.pop());

   
  
    
  }


  ionViewDidEnter() {
    this.analytics.ga().then(ga => ga.trackView('Teams List Page'));
  }
  protected getTeamUserInvitation()
  {
    
    this.chatService.getTeamUserInvitation()
    .then(res=>{
      this.pendingTeams=res;
  })
    .catch(err=>{

    })
  }

  protected getAllTeam(){
    this.chatService.getAllTeams()
    .then(res=>{
     this.chats = res;
     this.loaded = true;
  
    })
    .catch(err=>{

    })
  }
  protected acceptUserInTeam(affliateUqid,userUqid)
  {
    Promise.resolve(this.loadingStacker.add())
    .then(()=>{
    this.chatService.acceptUserInTeam(affliateUqid,userUqid)
    .then(res=>{
      this.standardAlert.showSuccess("you were added in team");
      this.getTeamUserInvitation();
      this.loadingStacker.pop();
    })
    .catch(err=>{
      this.standardAlert.showError(err);
     this.loadingStacker.pop()
    })
  })
  }
   protected rejectUserInTeam(affliateUqid,userUqid)
  {
    Promise.resolve(this.loadingStacker.add())
    .then(()=>{
    this.chatService.rejectUserInTeam(affliateUqid,userUqid)
    .then(res=>{
      this.standardAlert.showSuccess("you were removed from team");
      this.getTeamUserInvitation();
      this.loadingStacker.pop();
    })
    .catch(err=>{
      this.standardAlert.showError(err);
     this.loadingStacker.pop()
    })
  })

 // Promise.resolve(this.loadingStacker.add())
 //    .then(()=>{
 //    this.chatService.rejectUserInTeam(affliateUqid,userUqid)
 //    .then(res=>{
 //      this.standardAlert.showSuccess("you were removed from team");
 //      this.getTeamUserInvitation();
 //      this.loadingStacker.pop()
 //    })
 //    .catch(err=>{
 //      this.standardAlert.showError(err);
 //      this.loadingStacker.pop()
 //    })
 //  })

  }

  protected createChatPage() {
    return this.navCtrl.push(ChatCreatePage, {
      then: (data: { chat: Chat }) => this.showChat(data.chat)
    });
  }

  protected createPlanPage() {
    return this.navCtrl.push(PlanCreatePage, {
      then: (data: { chat: Chat }) => this.showChat(data.chat)
    });
  }

  protected showChat(chat: Chat) {

    return Promise.resolve(this.loadingStacker.add())
      .then(() => this.navCtrl.push(ChatPage, {chat: chat, uqid: chat.uqid, id: chat.uqid}))
      .then(() => this.loadingStacker.pop());
  }

  protected refreshChats(refresher) {
    this.getAllTeam();
    refresher.complete()
    // this.chatService.refreshChats()
    // .then(() => refresher.complete(), () => refresher.complete())
    // .catch(() => refresher.complete());
  }

  protected abbr(text: string) {
    let result = [];
    let modified = text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(' ');
    for (let word of modified) {
      result.push(word.substr(0, 1));
      if (result.length == 2) {
        break;
      }
    }
    if (result.length === 1 && modified[0].length > 1) {
      result.push(modified[0].substr(1, 1));
    }
    return result.join("").toUpperCase();
  }

}
