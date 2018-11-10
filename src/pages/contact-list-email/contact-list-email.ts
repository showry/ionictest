import {Component} from '@angular/core';
import {AlertController, IonicPage, NavController, NavParams, Platform} from 'ionic-angular';
import {DeviceContacts, IContact} from "../../providers/services/DeviceContacts";
import {LoadingStacker} from "../../providers/stacker/loading-stacker";
import {StandardToast} from "../../providers/services/standard-toast";


@IonicPage()
@Component({
  selector: 'page-contact-list-email',
  templateUrl: 'contact-list-email.html',
})
export class ContactListEmailPage {

  protected allContacts: IContact[] = [];
  protected filteredContacts: IContact[] = [];
  protected selectedContacts: IContact[] = [];

  protected callback: { (emails: IContact[]): void };
  protected okText: string = 'Ok';
  protected okIcon: string = 'send';
  protected _search: string = "";
  protected countryCode:string="";

  constructor(protected deviceContacts: DeviceContacts,
              protected navCtrl: NavController,
              protected navParams: NavParams,
              protected alertCtrl: AlertController,
              protected loadingStacker: LoadingStacker,
              protected standardAlert: StandardToast,
              protected platform: Platform) {
    this.okText = this.navParams.get('okText') || 'Ok';
    this.okIcon = this.navParams.get('okIcon') || 'send';
    this.callback = this.navParams.get('callback');
    this.countryCode=this.navParams.get('countryCode');
   if (this.platform.is("cordova")) {
      this.deviceContacts.subscribe(() => {
      this.deviceContacts.withMailPhone(this.countryCode).then(contacts => {
      this.allContacts = contacts;
    })
      .then(() => this.filterContacts());
    });
      Promise.resolve(this.loadingStacker.add())
        .then(() => this.deviceContacts.refreshContacts())
        .then(() => this.loadingStacker.pop());
    } else {
      this.showError("No native device contact access")
        .then(() => this.navCtrl.pop());
    }
  }

  get search(): string {
    return this._search;
  }

  set search(value: string) {
    this._search = value;
    this.filterContacts();
  }

  protected get saveBtnShow(): boolean {
    return this.selectedContacts.length > 0;
  } 
  public normalizePhone(phone:string){
    // return phone.replace(/[^0-9]/g, "").replace(/^0/, "");
    return phone.replace(/\s/g, "");

  }
  
  protected select(contact: IContact) {
        if (contact.phone!=undefined||contact.phone!=null){
      contact.phone=this.normalizePhone(contact.phone);
       if(contact.phone.length <= 11){
         contact.phone=this.countryCode+contact.phone;
       }
    }
    this.selectedContacts.push(contact);
  }

  protected deselect(contact: IContact) {
      if(contact.email==null ||contact.email==undefined)
    this.selectedContacts.splice(this.findMailSelectedIndex(contact), 1);
    else(contact.phone==null||contact.phone==undefined)
    this.selectedContacts.splice(this.findMobileSelectedIndex(contact), 1);
  }

  protected toggleStatus(contact) {
    if (this.isSelected(contact)) {
      this.deselect(contact);
    } else {
      this.select(contact);
    }
  }

  protected done() {
    return Promise.resolve(this.loadingStacker.add())
      .then(() => this.callback(this.selectedContacts))
      .then(() => this.navCtrl.pop())
      .then(() => this.loadingStacker.pop());
  }

  protected showError(error) {
    return this.standardAlert.showError(error);
  }

  protected isSelected(contact: IContact) {

    if(contact.email==undefined){

    return this.findMailSelectedIndex(contact) !== -1;}
    if(contact.phone==undefined){
      return this.findMobileSelectedIndex(contact) !== -1;
    }
  }

  protected findMailSelectedIndex(contact: IContact) {
    return this.selectedContacts.indexOf(contact);
  }
  protected findMobileSelectedIndex(contact: IContact) {
    return this.selectedContacts.indexOf(contact);
  }
  protected filterContacts() {
    this.filteredContacts = this.search.length ? this.allContacts.filter((contact: IContact) => new RegExp(this.search, 'ig').test(contact.name + '////' + contact.email+'///'+contact.phone)) : this.allContacts;
  }

}
