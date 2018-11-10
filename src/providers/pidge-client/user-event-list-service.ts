import {Injectable} from "@angular/core";
import {PidgeApiService} from "./pidge-api-service";
import {Subject} from "rxjs/Subject";
import {UserMetaInfoInterface, UserMetaInfoService} from "./user-meta-info-service";
import {AuthService} from "./auth-service";
import {EventInvitation, EventInvitationInterface} from "../../models/event-invitation"
import {Standardize} from "./standardize";
import {pidgeApiUrl} from "./pidge-url";
import { Observable } from 'rxjs/Observable';
import 'rxjs/Rx';
const GET_CALENDAR_SUMMARY="get-calendar-summary";
const GET_USER_CALENDAR="future-event";
const GET_USER_CALENDAR_PAST="past-event";
const GET_EXCLUDE_USER_UPCOMING_CALENDAR="future-event/{EventDate}";
const GET_EXCLUDE_USER_PAST_CALENDAR="past-event/{EventDate}";

@Injectable()
export class UserEventsListService {

  protected events: UserEventsList = {
    pending: [],
    confirmed: [],
    invitations: [],
    done: [],
    rejected: []
  } as UserEventsList;
  protected eventsList: EventInvitation[] = [];
  protected eventsListPast:EventInvitation[]=[];
  protected observableInstance: Subject<UserEventsListInterface>;

  constructor(protected userMeta: UserMetaInfoService,
              protected auth: AuthService,
              protected apis: PidgeApiService) {
    this.observableInstance = new Subject();
    this.auth.subscribe(data => {
      if (!data.loggedIn) {
        this.events = {};
        this.triggerNext();
      }
    });


this.loadData();
   
  
  }

  public loadData()
  {
    this.getUserCalendar().then(resUpcoming=>{
      this.getUserCalendarPast().then(resPast=>{
        this.fetchEvents(resUpcoming,resPast);
      })
    })
  }    

  public getCalendarSummary():Observable<any> { 
    let p=new Promise((resolve, reject) => {
      let url = pidgeApiUrl( GET_CALENDAR_SUMMARY, {}, null, null);
      this.apis.get(this.auth.currentUser, url, {})
        .then(result => {console.log("GET_CALENDAR_SUMMARY :",result);resolve(result);})
        .catch(error => {console.log("error ",error);reject(error)});
    });
    return Observable.fromPromise(p);
   
  }

  public getUserCalendar(EventDate?:Date): Promise<any[]> {
    return new Promise((resolve, reject) => {
      var url; 
      if(EventDate==undefined){
        EventDate=null;
        url = pidgeApiUrl( GET_USER_CALENDAR, {}, null, null);
      }
      else{
        url = pidgeApiUrl( GET_EXCLUDE_USER_UPCOMING_CALENDAR, {EventDate:EventDate.toISOString()}, null, null);
      }
      this.apis.get(this.auth.currentUser, url, {})
        .then(result => {
        resolve(result);})
        .catch(error => {
        });
    });
  }

  public getUserCalendarPast(EventDate?:Date): Promise<any[]> {
    return new Promise((resolve, reject) => {
      var url;
      if(EventDate==undefined){
        EventDate=null;
        url = pidgeApiUrl( GET_USER_CALENDAR_PAST, {}, null, null);}
      else{
       
        url = pidgeApiUrl( GET_EXCLUDE_USER_PAST_CALENDAR,{EventDate:EventDate.toISOString()}, null, null);}
            
      this.apis.get(this.auth.currentUser, url, {})
        .then(result => {resolve(result);})
        .catch(error => {reject(error)});
    });
  }

  public sortEvents(eventSortArray) {
    eventSortArray.sort((a, b) => {
                  if (a.event.date > b.event.date) return -1;
                  else if (a.event.date < b.event.date) return 1;
                  else return 0;
                });
                return eventSortArray;
  }

  public sortEventsPast(eventSortArray) {
    eventSortArray.sort((a, b) => {
                  if (a.event.date < b.event.date) return -1;
                  else if (a.event.date > b.event.date) return 1;
                  else return 0;
                });
                return eventSortArray;
  }
  protected metaFetched(data?: UserMetaInfoInterface) {
    if (!data || !data.successLoads) {
      return;
    }

  
  }

public fetchEvents(upComingEvents,pastEvents){
  // this.sortEvents(upComingEvents);
  // this.sortEventsPast(pastEvents);
  // this.sortEvents(eventsPast);
    this.eventsList=Standardize.eventInvitationsList(upComingEvents);
    this.eventsListPast=Standardize.eventInvitationsList(pastEvents);

    this.triggerNext();
 


}

  


  public static prepareEventInvitations(list: EventInvitation[]) {
    let result = [];
    for (let invitation of list) {
      result.push(invitation);
    }
    return result;
  }

  protected triggerNext() {
    this.observableInstance.next(this.events);
  }

  public observable() {
    return this.observableInstance;
  }

  public subscribe(callable) {
    return this.observableInstance.subscribe(callable);
  }

  public grouped(): UserEventsList {
    return this.events;
  }

  public fetchNewEvents() {
    return this.userMeta.refresh();
  }

  public list(): EventInvitation[] {
    return this.eventsList;
  }
  public listPast(): EventInvitation[] {
    return this.eventsListPast;
  }
}

export class UserEventsList implements UserEventsListInterface {
  pending?: EventInvitation[];
  invitations?: EventInvitation[];
  confirmed?: EventInvitation[];
  cancelled?: EventInvitation[];
  rejected?: EventInvitation[];
  done?: EventInvitation[];
  past?: EventInvitation[];
}

export interface UserEventsListInterface {
  pending?: EventInvitationInterface[];
  invitations?: EventInvitationInterface[];
  confirmed?: EventInvitationInterface[];
  cancelled?: EventInvitationInterface[];
  rejected?: EventInvitationInterface[];
  done?: EventInvitationInterface[];
  past?: EventInvitationInterface[];
}
