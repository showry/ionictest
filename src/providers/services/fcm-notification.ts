import { FCM } from '@ionic-native/fcm';
import {Injectable} from "@angular/core";
import {StandardResponseAlert} from "../../providers/services/standard-response-alert";

@Injectable()
export class FcmNotifications {

  constructor(protected fcm: FCM,
              protected standardAlert: StandardResponseAlert,
) {

  }
  public initializeFirebaseAndroid(callback) {
    this.fcm.getToken()
    .catch((e) => {
      console.error(e);
      callback(e)
    })
    .then(token => {
      console.log("This Android device's token is ${token}"+ token);
      callback(token)
    });
}

  public subscribeToPushNotifications(callback) {
    // handle incoming push notifications
    this.fcm.onNotification().subscribe(data => {
      if (data.wasTapped) {
        // this.standardAlert.showSuccess(data.body);

     // background received
        callback(data);
      } else {
        // foreground received
        // this.standardAlert.showSuccess(data.body);
      callback(data);
      }
    }, e => {

      console.error(e);
      callback(e);
    });
  }


}
