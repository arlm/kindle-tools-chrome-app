import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { MomentModule } from 'ngx-moment';

import { NvD3Module } from 'ng2-nvd3';
import 'd3';
import 'nvd3';

import { AppComponent } from './app.component';
import { BooksComponent } from './books/books.component';
import { ClippingsComponent } from './clippings/clippings.component';


@NgModule({
  declarations: [
    AppComponent,
    BooksComponent,
    ClippingsComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    MatSnackBarModule,
    BrowserAnimationsModule,
    MomentModule,
    NvD3Module
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
