import { Component, OnInit, ViewChild } from '@angular/core';

import * as crossfilter from 'crossfilter2';
import * as d3 from 'd3';

import { Book } from '../book';
import { NvD3Component } from 'ng2-nvd3';

@Component({
  selector: 'app-clippings',
  templateUrl: './clippings.component.html',
  styleUrls: [
    './clippings.component.css',
    '../../../node_modules/nvd3/build/nv.d3.css'
  ]
})

export class ClippingsComponent implements OnInit {
  clippings_file = null;
  processed = false;

  @ViewChild('nvd3') nvd3: NvD3Component;
  data;
  values;
  options;

  displayedColumns = ['book', 'author', 'highlights', 'month', 'year'];

  constructor() { }

  ngOnInit() {
    this.options = {
      chart: {
        type: 'discreteBarChart',
        height: 450,
        width: 1400,
        margin: {
          top: 20,
          right: 20,
          bottom: 50,
          left: 55
        },
        x: function (d) { return d.key; },
        y: function (d) { return d.value; },
        showValues: true,
        valueFormat: function (d) {
          return d3.format(',.4f')(d);
        },
        duration: 500,
        xAxis: {
          axisLabel: 'X Axis'
        },
        yAxis: {
          axisLabel: 'Y Axis',
          axisLabelDistance: -10
        }
      }
    };
    this.data = [
      {
        key: 'Books by Year',
        values: []
      }
    ];
  }

  process(file: File) {
    if (file.name.startsWith('My Clippings') && file.name.endsWith('.txt')) {
      this.clippings_file = file;
    } else {
      return;
    }

    const reader = new FileReader();
    reader.onload = loadEvent => { this.processClippings(reader.result); };
    reader.readAsText(file, 'utf8');
  }

  private processClippings(clippings: string) {
    const books = this.parse(clippings);
    this.processed = true;

    this.processData(books);
  }

  private parse(clippings: string): Book[] {
    const chuncks = this.split(clippings);
    const entries: Book[] = [];

    for (const chunck of chuncks) {
      if (!chunck) {
        continue;
      }

      const line1 = /^(.*?)\s*(\(([^\(]*)\))?\s*$/g.exec(chunck[0]);
      const line1Groups = { Book: 1, Author: 3 };

      // tslint:disable-next-line:max-line-length
      const line2 = /^\s*-\s*Your (Highlight|Note|Bookmark)\s*on\s*[Pp]age ([xivlcm\d-]*)?(\s*\|)?\s*([Ll]ocation|[Ll]oc\. )\s*([xivlcm\d-]*)?\s*\|\s*Added on ([^\r\n]*)/g.exec(chunck[1]);
      const line2Groups = { Type: 1, Page: 2, Location: 5, Date: 6 };

      const timestamp = line2 ? new Date(line2[line2Groups.Date]) : null;

      const line3 = chunck.length >= 3 ? /^\s*(.*?)$/g.exec(chunck[2]) : null;
      const line3Groups = { Text: 1 };

      const entry = {
        book: line1[line1Groups.Book],
        author: line1[line1Groups.Author],
        type: line2 ? line2[line2Groups.Type] : null,
        page: line2 ? line2[line2Groups.Page] : null,
        location: line2 ? Number(line2[line2Groups.Location]) : null,
        date: timestamp,
        text: line3 ? line3[line3Groups.Text] : null
      };

      entries.push(entry);
    }

    return entries;
  }

  private split(clippings: string): string[][] {
    const delimiter = '==========';
    const chuncks: string[][] = [];
    let current_chunck: string[] = [];

    for (const line of clippings.split('\n')) {
      const has_delimiter = line.startsWith(delimiter);
      if (has_delimiter && current_chunck.length > 0) {
        chuncks.push(current_chunck);
        current_chunck = [];
      }

      if (!has_delimiter && line.length > 0 && line !== '\n' && line !== '\r') {
        current_chunck.push(line);
      }
    }

    return chuncks;
  }

  private processData(books: Book[]) {
    const data = crossfilter(books);
    const all = data.groupAll();

    const date = data.dimension(function (d) { return d.date; });
    const byMonth = date.group(function (d) { return d ? d.getMonth() + '.' + d.getFullYear() : ''; });
    const byYear = date.group(function (d) { return d ? d.getFullYear() : ''; });

    // tslint:disable-next-line:max-line-length
    const bookMonth = data.dimension(function (d) { return (d.date ? + d.date.getFullYear() + '.' + d.date.getMonth() + ' ' : '9999.99 ') + d.book; });
    const booksByMonth = bookMonth.group();

    // tslint:disable-next-line:max-line-length
    const bookMonthGraph = data.dimension(function (d) { return (d.date ? + d.date.getFullYear() + '.' + d.date.getMonth() + ' ' : '9999.99 '); });
    const booksByMonthGraph = bookMonthGraph.group();

    const booksByMonthValues = booksByMonth.reduce(this.add, this.remove, this.init).all();
    const booksByMonthGraphValues = booksByMonthGraph.reduceCount().all();

    this.data = this.data = [
      {
        key: 'Books by Year',
        values: booksByMonthGraphValues
      }
    ];

    console.log(booksByMonthGraphValues);

    this.values = booksByMonthValues;
  }

  add(p: any, d) {
    p.highlights++;
    p.book = d.book;
    p.author = d.author;
    p.month = d.date ? d.date.getMonth() : 0;
    p.year = d.date ? d.date.getFullYear() : 0;
    return p;
  }

  remove(p: any, d) {
    p.highlights--;
    return p;
  }

  init(): any {
    return { highlights: 0, book: '', author: '', month: 0, year: 0 };
  }

  addGraph(p: any, d) {
    p.count++;
    p.label = d.date ? d.date.getMonth + '.' + d.date.getFullYear() : '';
    p.month = d.date ? d.date.getMonth() : 0;
    p.year = d.date ? d.date.getFullYear() : 0;
    return p;
  }

  removeGraph(p: any, d) {
    p.count--;
    return p;
  }

  initGraph(): any {
    return { count: 0, label: '', month: 0, year: 0 };
  }

}

export interface Element {
  book: string;
  author: string;
  highlights: number;
  year: number;
}
