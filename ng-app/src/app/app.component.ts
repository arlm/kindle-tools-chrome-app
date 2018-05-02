import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Kindle Tool Angular App';
  connected = false;
  buttonText = 'Connect to Kindle device';

  constructor(public snackBar: MatSnackBar) {}

  connectKindle = function () {
    navigator.usb.requestDevice({filters: [{ vendorId: 0x1949 }]}).then(device => {
        this.connected = true;
        this.buttonText = 'Connected to Kindle device';
        if (device.productId === 0x0002 || device.productId === 0x0004) {
          this.snackBar.open(`Connected to the "${device.productName}" device!`, 'OK', {
            duration: 2000,
          });
        } else {
          this.connected = false;
          this.buttonText = 'Connect to Kindle device';
          this.snackBar.open(`The device "${device.productName}" is not supported!`, 'OK', {
            duration: 10000,
          });
        }
    });
  };
}

declare global {
  interface Navigator {
      usb: {
        requestDevice(filters: any): any;
      };
  }
}
