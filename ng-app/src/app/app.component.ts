import { Component, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ClippingsComponent } from './clippings/clippings.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Kindle Tool Angular App';
  connected = false;
  processed = false;
  buttonText = 'Connect to Kindle device';
  @ViewChild(ClippingsComponent) clippings: ClippingsComponent;

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
          this.errorState();
        }
      }
    });
  }

  connectKindle() {
    navigator.usb.requestDevice({filters: [{ vendorId: 0x1949 }]}).then(device => {
        if (device.productId === 0x0002 || device.productId === 0x0004) {
          this.connected = true;
          this.buttonText = `Connected to the ${device.productName}`;
            this.snackBar.open(`Connected to the "${device.productName}" device!`, 'OK', {
              duration: 2000,
            });
      } else {
        this.errorState(device.productName);
      }
    }, data => {
      this.errorState();
    });
  }

  processClippingsFile(changeEvent) {
    this.processed = true;
    const file = changeEvent.target.files[0];
    this.clippings.process(file);
  }

  private errorState(message: string = null) {
    this.connected = false;
    this.buttonText = 'Connect to Kindle device';

    if (message != null) {
      this.snackBar.open(`The device "${message}" is not supported!`, 'OK', {
        duration: 10000,
      });
    }
  }
}

declare global {
  interface Navigator {
      usb: {
        requestDevice(filters: any): any;
        getDevices(filters: any): any;
      };
  }
}
