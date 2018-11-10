import {Component, ViewChild} from "@angular/core";
import {AlertController, IonicPage, NavController, NavParams} from "ionic-angular";
import {UserInterface} from "../../models/user";
import {HomePage} from "../home/home";
import {
  AuthApiFailedResponseInterface, AuthService, RegisterModelInterface,
  UserMembershipInvitationInterface
} from "../../providers/pidge-client/auth-service";
import {AnalyticsLogger} from "../../providers/services/analytics-logger";
import {LoadingStacker} from "../../providers/stacker/loading-stacker";
import {FormControl, FormGroup, NgForm, Validators} from "@angular/forms";
import {LoginPage} from "../login/login";
import {StandardResponseAlert} from "../../providers/services/standard-response-alert";
import {StandardToast} from "../../providers/services/standard-toast";
import { UserService } from './../../providers/pidge-client/user-service';
import {Countries} from "../../shared/countries";

@IonicPage({})
@Component({
  selector: "page-register",
  templateUrl: "register.html",
})
export class RegisterPage {

  @ViewChild('registerForm') registerForm: NgForm;
  protected userCountryCode={};
  protected credentials = {email: "", password: "", name: "", from_email: "",country:"",mobile:"",phone_number:""};
  protected user: UserInterface;
  protected invitation: UserMembershipInvitationInterface;
  protected countries:Array<any>=Countries;
   constructor(protected nav: NavController,
              protected navParams: NavParams,
              protected auth: AuthService,
              protected alertCtrl: AlertController,
              protected analytics: AnalyticsLogger,
              protected standardAlert: StandardResponseAlert,
              protected standardToast: StandardToast,
              protected loadingStacker: LoadingStacker,
              protected userService:UserService) {
              this.setDefaultCountryCode();
              this.invitation = this.navParams.get('invitation');
              if (this.invitation) {
                this.credentials.email = this.invitation.email.email;
                this.credentials.from_email = this.invitation.email.email;
                this.credentials.name = this.invitation.data && this.invitation.data.name ? this.invitation.data.name : "";
              }
  }

  ionViewDidLoad() {
    
  }
  setDefaultCountryCode(){
    this.auth.getCountry()
                .then(res=>{
                  this.credentials.country=res.dial_code;
                })
                .catch(err=>{})
  }

  ionViewDidEnter() {
    this.analytics.ga().then(ga => ga.trackView('Register Page'));
    this.registerForm.form.controls.name.setValidators([]);
    this.registerForm.form.controls.email.setValidators([Validators.email]);
    this.registerForm.form.controls.password.setValidators([Validators.required, Validators.minLength(6)]);
    this.registerForm.form.controls.country.setValidators([]);
    this.registerForm.form.controls.mobile.setValidators([Validators.minLength(10),Validators.maxLength(12)]);
      }

  public loginToAccount() {
    return this.nav.push(LoginPage)
      .then(() => this.nav.length() > 2 ? this.nav.remove(1, 1) : null);
  }

  public normalizePhone(phone:string){
    return phone.replace(/\s/g, "");
  
  }
  public register() {
    this.credentials.mobile=this.normalizePhone(this.credentials.mobile);
     if(this.credentials.mobile!=""){
       this.credentials.phone_number= this.credentials.country + this.credentials.mobile;
      // this.credentials.phone_number=this.credentials.mobile;
 
    }
    this.loadingStacker.add();
    this.auth.register(this.credentials as RegisterModelInterface)
      .then((user: UserInterface) => this.user = user)
      .then(() => this.nav.setRoot(HomePage, {user: this.user}))
      .catch((error: AuthApiFailedResponseInterface) => error.hint && error.hint === 'Resend verification email' ? this.showRegistrationDone(error) : this.showError(error.message))
      .then(() => this.loadingStacker.pop());
  }

  protected showError(error) {
    return this.standardAlert.showError(error);
  }

  private showRegistrationDone(e) {
    return this.standardToast.showSuccess(e.message)
      .then(() => this.loginToAccount());
  }
}

function confirm(confirm: FormControl) {
  if (confirm.value !== (confirm.root as FormGroup).controls.password.value) {
    return {"confirm": "Password confirmation is incorrect"};
  }
  return null;
}
