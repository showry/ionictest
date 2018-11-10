import { AwsService } from './../../providers/pidge-client/aws-service';
import { PidgeApiService } from './../../providers/pidge-client/pidge-api-service';
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { AuthService } from '../../providers/pidge-client/auth-service';



/**
 * Generated class for the TestAws3Page page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-test-aws3',
  templateUrl: 'test-aws3.html',
})
export class TestAws3Page {
// Initialize AWS
// window: any = window;
// AWS: any = this.window.AWS;
  constructor(protected awsService:AwsService,protected auth:AuthService,protected apis:PidgeApiService,public navCtrl: NavController, public navParams: NavParams) {
  //  alert("before");
  //   var s3 = new this.AWS.S3();
  //   alert("after ");
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad TestAws3Page');
  }
//   fileEvent(){
//        alert("fileEvent");
//     var AWSService = this.window.AWS;
//     var upload = document.getElementById('upload');
//     var file = upload.files[0];
//     // var file = fileInput.target.files[0];
//     alert("file "+file);
//     AWSService.config.accessKeyId = 'AKIAIVI2N3IS2RIPGD3A';

//     AWSService.config.secretAccessKey = 'Ck3WZEVGpGPelttT9S8XXkAApiApr6OPpAj4Ru5';

//     var bucket = new AWSService.S3({params: {Bucket: 'co.pidge'}});

//     var params = {Key: "public/profiles/"+file.name, Body: file};

//     bucket.upload(params, function (err, data) {

//         console.log(err, data);

//     });   
// }

  // testaws3(){
  //   this.awsService.getSignedUploadRequest()
  //   .then(url=>{
  //     alert("URLL "+url);
  //     var upload = document.getElementById('upload');
  //     var file = upload.files[0];
  //     alert(file);
  //     this.apis.publicPut(url,{'Content-Type':'image/png'},file)
  //     .then(res=>{})
  //     .catch(err=>{})
  //   })
  //   .catch(urlerr=>{alert("wrong url"+JSON.stringify(urlerr))})
  // }
}
