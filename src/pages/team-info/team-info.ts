import {Component} from '@angular/core';
import {AlertController, App, IonicPage, NavController, NavParams, Platform} from 'ionic-angular';
import {Clipboard} from '@ionic-native/clipboard';
import {SocialSharing} from '@ionic-native/social-sharing';
import { Stripe } from '@ionic-native/stripe';
import {AuthService} from "../../providers/pidge-client/auth-service";
import {User, UserInterface} from "../../models/user";
import {ChatService, PuplicUrl} from "../../providers/pidge-client/chat-service";
import {Chat, ChatParticipant, ChatUser} from "../../models/chat";
import {LoadingStacker} from "../../providers/stacker/loading-stacker";
import {StandardResponseAlert} from "../../providers/services/standard-response-alert";
import {ChatParticipantInfoPage} from "../chat-participant-info/chat-participant-info";
import {RegularEvent} from "../../models/regular-event";
import {EventFormPage} from "../event-form/event-form";
import {Standardize} from "../../providers/pidge-client/standardize";
import {ProfileImageProcessor} from "../../providers/services/profile-image-processor";
import {ChatCreatePage} from "../chat-create/chat-create";
import {dayShortName, monthShortName} from "../../shared/time";
import {addOrderSuffix} from "../../shared/misc";
import {ChatsPage} from "../chats/chats";
import {UserMetaInfoService} from "../../providers/pidge-client/user-meta-info-service";
import {EventService} from "../../providers/pidge-client/event-service";
import {ContactListEmailPage} from "../contact-list-email/contact-list-email";
import {IContact} from "../../providers/services/DeviceContacts";
import {config} from "../../providers/config/config";
import {StandardToast} from "../../providers/services/standard-toast";
import {JoinTeamWithUrlPage} from "../join-team-with-url/join-team-with-url";
import { PendingInvitedMembersPage } from '../pending-invited-members/pending-invited-members';
import { AwsService } from './../../providers/pidge-client/aws-service';
import { TestAws3Page } from './../test-aws3/test-aws3';
import { PlanCreatePage } from '../plan-create/plan-create';

@IonicPage()
@Component({
  selector: 'page-team-info',
  templateUrl: 'team-info.html',
})
export class TeamInfoPage {

  protected currentUser: UserInterface;
  protected team: Chat;
  protected currentSection: string;
  protected you: ChatParticipant;
  protected doneCallback: any;
  protected publicUrls: PuplicUrl[];
  protected prefixPublicUrl: string;
  protected deeplinkPublicUrl:string;
  protected requestedMember:Array<any>=[];
  protected showUrl: boolean = false;

  constructor(protected platform: Platform,
              protected socialSharing: SocialSharing,
              protected toastCtrl: StandardToast,
              protected clipboard: Clipboard,
              protected navCtrl: NavController,
              protected navParams: NavParams,
              protected authService: AuthService,
              protected chatService: ChatService,
              protected loadingStacker: LoadingStacker,
              protected standardAlert: StandardResponseAlert,
              protected scheduleService: EventService,
              protected app: App,
              protected alertCtrl: AlertController,
              protected profileProcessor: ProfileImageProcessor,
              protected userMeta: UserMetaInfoService,
              protected awsService:AwsService,
              protected stripe: Stripe
                        ) {

    this.prefixPublicUrl = config.app_url + "public-url/";
    this.deeplinkPublicUrl=config.deeplink_url+"public-url/";
    let teamUqid = this.navParams.get('uqid');
    this.doneCallback = this.navParams.get('then');
    // this.app.getRo
    Promise.resolve(this.loadingStacker.add())
      .then(() => this.authService.whenUserAuthenticated())
      .then(user => this.currentUser = user)
      .then(() => this.loadChatInfo(teamUqid))
      .then(() => this.loadingStacker.pop())
    ;
  }
  
  protected getRequestedMember(team)
  {
    this.chatService.getRequestedMembers(team)
    .then(res=>{
      this.requestedMember=res;
      console.log("Request Member sucess "+JSON.stringify(res));
    })
    .catch(err=>{
      console.log("Request Member err "+JSON.stringify(err));
    })
  }
  protected acceptTeamMember(user:any)
  {
    this.chatService.acceptTeamMember(this.team,user)
    .then(res=>{
      
      // this.standardAlert.showInfo("accepted Done");
      this.toastCtrl.showSuccess("user accepted");
      this.getRequestedMember(this.team);
    })
    .catch(err=>{
      // this.standardAlert.showError(err);
      this.toastCtrl.showError(err);
    })
  } 
    protected rejectTeamMember(user:any)
  {
    this.chatService.rejectTeamMember(this.team,user)
    .then(res=>{
      this.standardAlert.showInfo("rejected Done");
      this.getRequestedMember(this.team);
    })
    .catch(err=>{
      this.standardAlert.showError(err);
    })
  } 
  testAws3()
  {
    this.navCtrl.push(TestAws3Page);
  }
  protected toggleCurrentSection(section: string) {
    this.currentSection = this.currentSection === section ? '' : section;
  }

  protected participantInfo(user: ChatUser) {
    let page = this;
    return this.navCtrl.push(ChatParticipantInfoPage, {
      chat: this.team, user: user, you: this.you, then: (updatedUser?: ChatUser) => {
        page.updateChatInfoPage(updatedUser);
      },
    });
  }

  public updateChatInfoPage(updatedUser?: ChatUser) {
    if (!updatedUser) {
      this.loadChatInfo();
      return true;
    }
    for (let userIndex in this.team.users) {
      let user = this.team.users[userIndex];
      if (user.id === updatedUser.id) {
        this.team.users[userIndex] = updatedUser;
        return;
      }
    }
  }

  protected publicInvitationPage() {
    this.app.getRootNav().setRoot('PublicTeamInvitationPage', {uqid: this.team.uqid});
  }

  protected loadChatInfo(uqid?: string) {
    return Promise.resolve(this.loadingStacker.add())
      .then(() => this.chatService.chatInfo(uqid || this.team.uqid))
      .then(team => {this.setChatInfo(team);
        this.getRequestedMember(team);});
  }
  protected setChatInfo(team: Chat) {
    return Promise.resolve(this.team = team)
      .then(() => {this.setTeamMember();
       this.getPublicUrls();
     })
      .catch(error => this.fatalError(error))
      .then(() => {
        this.loadingStacker.pop();
       
      })
      ;
  }

  protected setTeamMember() {
    if (this.team && this.team.you && this.team.you.user) {
      let user = this.currentUser instanceof User ? this.currentUser : Standardize.user(this.currentUser);
      this.team.you.user = user as UserInterface;
      this.you = this.team.you;
      return this.you;
    } else {
      return this.standardAlert.throwStandardError("Team info is not fully loaded");
    }
  }

  protected fatalError(error) {
    return this.standardAlert.showError(error)
      .then(() => this.navCtrl.pop());
  }

  protected addEvent() {
    return this.navCtrl.push(EventFormPage, {
      uqid: this.team.uqid,
      then: event => this.loadChatInfo()
    });
  }

//change photo
  protected changePhoto() {
    if (!this.you.isAdmin) {
      return;
    }
    return Promise.resolve()
      .then(() => this.profileProcessor.changePhoto())
      .then(img => img ? this.chatService.changePhoto(this.team, img)
        .then(team => this.team.image = team.image)
        .then(() => this.updateNavPusherPage()) : null)
      .catch(e => {})
      .then(() => {})
      ;
  }

  protected checkpublicUrlLength() {
    this.publicUrls.length > 0 ? this.showUrl = true : this.showUrl = false;
  }

  protected updateNavPusherPage() {
    // return this.doneCallback && this.doneCallback(this.team);
  }

  protected removeRegularEvent(regularEvent: RegularEvent) {
    return this.alertCtrl.create({
      title: 'Sure to remove?',
      message: 'Are you sure you want to remove the regular event titled "' + regularEvent.title + '"?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
          }
        },
        {
          text: 'Delete All Occurrences',
          role: 'cancel',
          handler: () => this.confirmRemoveRegularEvent(regularEvent, true) || true
        },
        {
          text: 'Delete Schedule Only',
          role: 'cancel',
          handler: () => this.confirmRemoveRegularEvent(regularEvent, false) || true
        }
      ]
    }).present();
  }

  protected confirmRemoveRegularEvent(event: RegularEvent, cascade: boolean = false) {
    return Promise.resolve(this.loadingStacker.add())
      .then(() => this.scheduleService.removeSchedule(this.team, event, true))
      .then(() => this.standardAlert.showSuccess("Team schedule removed successfully!"))
      .then(() => this.userMeta.refresh())
      .then(() => this.loadChatInfo(this.team.uqid))
      .catch(error => this.standardAlert.showError(error))
      .then(() => this.loadingStacker.pop());
  }

  protected editChat() {
    if(this.team.type=='Plan'){
      return this.navCtrl.push(PlanCreatePage, {
        chat: this.team,
        then: (data: { chat: Chat }) => {
          this.team = data.chat;
          this.loadChatInfo();
        }
      });
     
    }
    else{
      return this.navCtrl.push(ChatCreatePage, {
        chat: this.team,
        then: (data: { chat: Chat }) => {
          this.team = data.chat;
          this.loadChatInfo();
        }
      });
    }
  
  }
protected SubscribeTeam(){
  this.stripe.setPublishableKey('pk_test_4bp6WmVcITtDJMbqYJMwdeTW');
        let card = {
        number: '4242424242424242',
        expMonth: 12,
        expYear: 2020,
        cvc: '220'
        };

        this.stripe.createCardToken(card)
          .then(token => {

            // alert("Token is "+JSON.stringify(token));
            this.chatService.TeamSubscription(this.team,token)
            .then(res=>{
              // alert("RESS "+JSON.stringify(res));
            })
            .catch(err=>{
              // alert("Catch "+JSON.stringify(err));
            })
          })
          .catch(error => {});
}
  protected displayMonth(month: number): string {
    return monthShortName(month);
  }

  protected isFuture(dt: Date) {
    return dt.getTime() > new Date().getTime();
  }

  protected alert(message, type: string = "Info") {
    return this.standardAlert.showInfo(message);
  }

  protected leaveChat() {
    let alert = this.alertCtrl.create({
      title: 'Sure to leave?',
      message: 'Are you sure you want to leave this chat?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
          }
        },
        {
          text: 'Leave',
          handler: () => {
            Promise.resolve(this.loadingStacker.add())
              .then(() => this.chatService.leaveChat(this.team))
              .then(() => this.standardAlert.showSuccess("You have left the chat successfully!"))
              .then(() => this.userMeta.refresh())
              .then(() => this.navCtrl.setRoot(ChatsPage))
              .catch(error => this.standardAlert.showError(error))
              .then(() => this.loadingStacker.pop());
          }
        }
      ]
    });
    alert.present();
  }
protected setCountryCode()
{
  return this.alertCtrl.create({
      title: "set Country Code ",
      message: "Please type your country code.",
      enableBackdropDismiss: true,
      inputs: [
        {
          name: "countryCode",
          placeholder: "country Code"
        }
      ],
      buttons: [
        {
          text: "Cancel",
          role: "cancel"
        },
        {
          text: "Ok",
          role: "cancel",
          handler: data => {
            let countryCode = data.countryCode;
            if (!countryCode) {
              alert("The countryCode is required");
              return false;
            }
             this.addFromContacts(countryCode);

            return true;
          }
        }
      ]
    }).present();
}
public normalizePhone(phone:string){
  return phone.replace(/\s/g, "");

}
  protected addUser() {
    return this.alertCtrl.create({
      title: "Add user",
      message: "Please enter the email or mobile of the user.",
      enableBackdropDismiss: true,
      inputs: [
        {
          name: "email",
          placeholder: "Email/Country Code + Mobile Number"
        }
      ],
      buttons: [
        {
          text: "Cancel",
          role: "cancel"
        },
        {
          text: "Add",
          role: "cancel",
          handler: data => {
            let email =this.normalizePhone(data.email);
            
            if (!email) {
              alert("The email address or  mobile  is required");
              return false;
            }
            this.addChatParticipantByEmail(email);
            return true;
          }
        },
        {
          text: "Select from Contacts",
          role: "cancel",
          handler: () => {
            
            this.authService.getCountry()
            .then(res=>{
              this.addFromContacts(res.dial_code);
              // this.credentials.country=res.dial_code;
            })
            .catch(err=>{})
            return true;
          }
        }
      ]
    }).present();
  }

  protected getPublicUrls() {
    if (this.you.isAdmin) {
      Promise.resolve(this.chatService.getPublicUrls(this.team))
        .then(publicUrls => {
          this.publicUrls = publicUrls;
          this.checkpublicUrlLength();
        })
        .catch(error => this.standardAlert.showError(error))
    }

  }

  protected addUrl() {
    Promise.resolve(this.chatService.createPublicUrls(this.team))
      .then(publicUrl => {
        this.getPublicUrls();
      })
      .catch(error => this.standardAlert.showError(error))
  }

  protected copyToClipboard(urlKey) {
    if (this.platform.is("cordova")) {
      
      this.clipboard.copy("Join Team from web   "+this.prefixPublicUrl + urlKey+"  or from device    "+this.deeplinkPublicUrl+urlKey).then(() => this.toastCtrl.showSuccess('copied'));
    }
  }

  protected shareUrl(urlKey) {
    if (this.platform.is("cordova")) {
      let share:string="Join Team from web "+this.prefixPublicUrl + urlKey+"  or from device    "+this.deeplinkPublicUrl+urlKey;

      this.socialSharing.share(share, 'SHARE', '', '')
      .then(() => {
      });
    

    }
  }
  protected shareUrlViaMail(urlKey)
  {
    if (this.platform.is("cordova")) {
      let share:string=" web : "+this.prefixPublicUrl + urlKey+"   device : "+this.deeplinkPublicUrl+urlKey;

     // Check if sharing via email is supported
    this.socialSharing.canShareViaEmail().then(() => {
      // Sharing via email is possible
      // Share via email
      this.socialSharing.shareViaEmail(share, 'Join Team', ['recipient@example.org']).then(() => {
        // Success!
      }).catch(() => {
        // Error!
      });
    }).catch(() => {
      // Sharing via email is not possible
    });

    

    }
  }
  protected deleteUrl(url) {
    Promise.resolve(this.chatService.deletePublicUrls(this.team, url))
      .then(res => {
        this.getPublicUrls();
      })
      .catch(error => this.standardAlert.showError(error))
  }

  protected addChatParticipantByEmail(email: any) {
    return Promise.resolve(this.loadingStacker.add())
      .then(() => this.chatService.inviteEmailToChat(this.team, email))
      .then(res => this.standardAlert.showSuccess(" invitation sent"))
      .then(() => this.loadChatInfo())
      .catch(error => this.standardAlert.showError(error))
      .then(() => this.loadingStacker.pop())
      ;
  } 

  protected editRegularEvent(event: any) {
    return Promise.resolve(this.loadingStacker.add())
      .then(() => this.navCtrl.push(EventFormPage, {uqid: this.team.uqid, event_uqid: event.event.uqid}))
      .then(() => this.loadingStacker.pop())
      ;
  }
  protected abeerclick(){
    // alert("Hello");
  }
  protected acceptRecurringEvents(event){
    console.log("EVENT ",event);
    if(event.event.chat_regular_event_id==null){
      // alert("non recurring event"); 
      this.scheduleService.acceptEventInvitation(event)
      .then(res=>{
        this.toastCtrl.showSuccess('  Event accepted');
      })
      .catch(err=>{
        this.toastCtrl.showError(' event not accepted');
      })
    }
    else{
   
    this.chatService.acceptRecurringEvents(event)
    .then(res=>{
      this.toastCtrl.showSuccess(' recurring Event accepted');
    })
    .catch(err=>{
      this.toastCtrl.showError('recurring event not accepted');
    })
  }
  }     

  protected rejectRecurringEvents(event:RegularEvent){
    this.chatService.rejectRecurringEvents(event)
    .then(res=>{
      this.toastCtrl.showSuccess(' recurring Event rejected');

    })
    .catch(err=>{
      this.toastCtrl.showError(' recurring Event not rejected');

    })
  }
  protected addNumberSuffix(num: number) {
    return addOrderSuffix(num);
  }

  protected dayName(day: number) {
    return dayShortName(day);
  }

  protected addFromContacts(countryCode) {
    let succeeded = 0, failed = 0;
    let message = (index, success) => {
      succeeded += success ? 1 : 0;
      failed += success ? 0 : 1;
      return (index + 1) + ` processed, ${succeeded} sent, ${failed} failed`;
    };

    let invite = (contact: IContact, index) => {
      if (contact.phone!=undefined||contact.phone!=null){
        return this.chatService.inviteEmailToChat(this.team, contact.phone, {})
        .then(() => this.loadingStacker.setMessage(message(index, true)))
        .catch(() => this.loadingStacker.setMessage(message(index, false)));
      }
      else{
        return this.chatService.inviteEmailToChat(this.team, contact.email, {})
        .then(() => this.loadingStacker.setMessage(message(index, true)))
        .catch(() => this.loadingStacker.setMessage(message(index, false)));
      }
       
    
      };

    return this.navCtrl.push(ContactListEmailPage, {
      okText: 'Invite',
      okIcon: 'send',
      countryCode:countryCode,
      callback: (selected: IContact[]) => {
        return Promise.resolve(this.loadingStacker.add("Inviting " + selected.length))
          .then(() => Promise.all(selected.map(invite)))
          .then(() => this.loadingStacker.pop())
          .then(() => this.standardAlert.showSuccess(succeeded + " invitations sent, " + failed + " failed"))
      }
    });
  }
protected pendingInvitedMembers()
{
  return this.navCtrl.push(PendingInvitedMembersPage,{'team':this.team});
}
  protected openUrl(url) {
    return this.navCtrl.push(JoinTeamWithUrlPage, {'urlKey': url});
  }

}
