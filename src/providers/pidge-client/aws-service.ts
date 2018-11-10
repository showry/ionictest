
import {Injectable} from '@angular/core';
import { FileTransfer, FileUploadOptions, FileTransferObject } from '@ionic-native/file-transfer';
import { File } from '@ionic-native/file';
import {PidgeApiService} from "./pidge-api-service";
import {AuthService} from "./auth-service";
import {pidgeApiUrl} from "./pidge-url";
const GET_PRESIGNED_URL: string = "/get-presigned-url";
var fileTransfer: FileTransferObject ;

@Injectable() 
export class AwsService {
    constructor(protected auth: AuthService,
        protected apis: PidgeApiService,
        protected transfer: FileTransfer,
        protected file: File) {
             fileTransfer = this.transfer.create();

}

    //  get  S3 Url to upload image 
    public getSignedUploadRequest():Promise<string>
    {
        let url = pidgeApiUrl(GET_PRESIGNED_URL, {},null,true);
        return new Promise((resolve,reject)=>{
            this.apis.get(this.auth.currentUser,url,{})
            .then(requestUrl=>{
               // alert(requestUrl);
                resolve(requestUrl.url)})
            .catch(error=>{
                alert(error);
                reject(error)})
        })
    }

      //  get  S3 Url to upload image 
      public ulpoadImageToAWS3(preSignedUrl,file):Promise<string>
      {
          return new Promise((resolve,reject)=>{
            var headerImage={'Content-Type':'image/png'}
            this.apis.publicPut(preSignedUrl,headerImage,file)
            .then(res=>{resolve(res)})
            .catch(err=>{reject(err)})
          })
         
      }
    // upload to s3
    // public uploadToAWS(url):Promise<any>{
    //     return new Promise((resolve,reject)=>{
    //         let options: FileUploadOptions = {
    //             fileKey: 'file',
    //             fileName: "badge",
    //             mimeType: 'image/jpeg',
    //             chunkedMode: false,
    //             httpMethod:'PUT',
    //             headers: {
    //               'Content-Type': 'image/png'
    //             }
    //          }
    //        alert("File transfer upload");
    //         fileTransfer.upload('../../assets/images/badge.png',encodeURI(url) , options,true)
    //           .then(data => {
    //               alert("SSSS "+JSON.stringify(data));
    //               resolve(data);
    //             // success
    //           }).catch(err=> {
    //               alert("EEEE "+JSON.stringify(err));
    //               reject(err);
    //             // error
    //           })

          

    //         //   var ft = new FileTransfer();
    //         //   ft.upload(this.file.dataDirectory + fileName, uploadLink, function () {
    //         //     console.log("image uploaded");
    //         //   }, function (err) {
    //         //     console.log(err);
    //         //   }, options);
    //     //     const headers = new Headers({'Content-Type': 'image/jpeg'});
    //     //     this.apis.put(this.auth.currentUser,url,"/assets/images/badge.png",headers)    
    //     //   //  this.apis.publicPut(url,headers,"/assets/images/badge.png")
    //     //         .then(res=>{alert("Successful res "+res);resolve(res)})
    //     //         .catch(err=>{alert("error "+JSON.stringify(err));reject(err)})
       
       
       
    //         })
    // }

    


}