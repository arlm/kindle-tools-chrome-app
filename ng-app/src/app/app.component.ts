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

  constructor(public snackBar: MatSnackBar) {
    navigator.usb.getDevices({filters: [{ vendorId: 0x1949 }]}).then(devices => {
      if (devices.length === 1) {
        const device = devices[0];
        if (device.productId === 0x0002 || device.productId === 0x0004) {
          this.connected = true;
          this.buttonText = `Connected to the ${device.productName}`;
            this.snackBar.open(`Connected to the "${device.productName}" device!`, 'OK', {
            duration: 2000,
          });
        } else {
          this.connected = false;
          this.buttonText = 'Connect to Kindle device';
        }
      }
    });
  }

  connectKindle = function () {
    navigator.usb.requestDevice({filters: [{ vendorId: 0x1949 }]}).then(device => {
        if (device.productId === 0x0002 || device.productId === 0x0004) {
          this.connected = true;
          this.buttonText = `Connected to the ${device.productName}`;
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
        getDevices(filters: any): any;
      };
  }
}
