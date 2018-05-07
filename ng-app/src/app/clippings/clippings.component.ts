import { Component, OnInit, ViewChild } from '@angular/core';

import * as crossfilter from 'crossfilter2';
import * as timeformat from 'd3-time-format';
import * as moment from 'moment';

import { Book } from '../book';
import { NvD3Component } from 'ng2-nvd3';
import { timeout } from 'q';
import { ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-clippings',
  templateUrl: './clippings.component.html',
  styleUrls: [
    './clippings.component.css',
    '../../../node_modules/nvd3/build/nv.d3.css'
  ],
  encapsulation: ViewEncapsulation.None
})

export class ClippingsComponent implements OnInit {
  clippings_file = null;
  processed = false;

  @ViewChild('monthly') monthly: NvD3Component;
  @ViewChild('yearly') yearly: NvD3Component;

  monthlyData;
  monthlyOptions;

  yearlyData;
  yearlyOptions;

  values;

  displayedColumns = ['book', 'author', 'highlights', 'month', 'year'];

  constructor() { }

  ngOnInit() {
    this.monthlyOptions = {
      chart: {
        type: 'discreteBarChart',
        height: 450,
        margin: {
          top: 20,
          right: 50,
          bottom: 75,
          left: 55
        },
        x: function (d) { return d.key; },
        y: function (d) { return d.value.count; },
        showValues: true,
        valueFormat: function (d) {
          return d3.format(',.0f')(d);
        },
        duration: 500,
        xAxis: {
          axisLabel: 'Month',
          rotateLabels: 30,
          axisLabelDistance: -30,
          tickFormat: function (d) {
            const parseTime = timeformat.timeParse('%y.%m');
            const date = parseTime(d.trim());
            return d3.time.format('%b %y')(date);
          }
        },
        yAxis: {
          axisLabel: 'Books read',
          axisLabelDistance: -10,
          tickFormat: function (d) {
            return d3.format(',.0f')(d);
          },
          showMaxMin: false
        },
        title: {
          enable: true,
          text: 'Books read monthly',
          className: 'h4',
          css: {
            textAlign: 'center'
          }
        },
        subtitle: {
          enable: true,
          text: 'Extracted from the Kindle highlights',
          css: {
            textAlign: 'center'
          }
        }
      }
    };

    this.yearlyOptions = {
      chart: {
        type: 'discreteBarChart',
        height: 450,
        margin: {
          top: 20,
          right: 50,
          bottom: 75,
          left: 55
        },
        x: function (d) { return d.key; },
        y: function (d) { return d.value.count; },
        showValues: true,
        valueFormat: function (d) {
          return d3.format(',.0f')(d);
        },
        duration: 500,
        xAxis: {
          axisLabel: 'Year',
          axisLabelDistance: 30,
          tickPadding: 10
        },
        yAxis: {
          axisLabel: 'Books read',
          axisLabelDistance: -10,
          tickFormat: function (d) {
            return d3.format(',.0f')(d);
          },
          showMaxMin: false
        },
        title: {
          enable: true,
          text: 'Books read yearly',
          className: 'h4',
          css: {
            textAlign: 'center'
          }
        },
        subtitle: {
          enable: true,
          text: 'Extracted from the Kindle highlights',
          css: {
            textAlign: 'center'
          }
        }
      }
    };
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
      const line2 = /^\s*-\s*Your (Highlight|Note|Bookmark)\s*on\s*([Pp]age )?([xivlcm\d-]*)?(\s*\|)?\s*([Ll]ocation|[Ll]oc\. )\s*([xivlcm\d-]*)?\s*\|\s*Added on ([^\r\n]*)/g.exec(chunck[1]);
      const line2Groups = { Type: 1, Page: 2, Location: 6, Date: 7 };

      const timestamp = line2 ? new Date(moment(line2[line2Groups.Date], 'dddd, MMMM DD, YYYY h:mm:ss A').toDate()) : null;

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

    // tslint:disable-next-line:max-line-length
    const bookMonthGraph = data.dimension(function (d) { return (d.date ? moment(d.date).format('YY.MM') + ' ' : '99.99 '); });
    const booksByMonthGraph = bookMonthGraph.group();

    const booksByMonthGraphValues = booksByMonthGraph.reduce(this.addGraph, this.removeGraph, this.initGraph).all();

    this.monthlyData = [
      {
        key: 'Books by Year',
        values: booksByMonthGraphValues
      }
    ];

    // tslint:disable-next-line:max-line-length
    const bookYearGraph = data.dimension(function (d) { return (d.date ? moment(d.date).format('YYYY') + ' ' : '9999 '); });
    const booksByYearGraph = bookYearGraph.group();

    const booksByYearGraphValues = booksByYearGraph.reduce(this.addGraph, this.removeGraph, this.initGraph).all();

    this.yearlyData = [
      {
        key: 'Books by Year',
        values: booksByYearGraphValues
      }
    ];

    // tslint:disable-next-line:max-line-length
    const bookMonth = data.dimension(function (d) { return (d.date ? d.date.getFullYear() + '.' + d.date.getMonth() + ' ' : '9999.99 ') + d.book; });
    const booksByMonth = bookMonth.group();

    const booksByMonthValues = booksByMonth.reduce(this.add, this.remove, this.init).all();

    this.values = booksByMonthValues;

    window.setTimeout(() => {
      this.monthly.updateSize();
      this.monthly.chart.update();
      this.yearly.updateSize();
      this.yearly.chart.update();
    }, 1);
  }

  add(p: any, d) {
    p.highlights++;
    p.book = d.book;
    p.author = d.author;
    p.month = d.date ? moment(d.date).format('MMM') : '';
    p.year = d.date ? moment(d.date).format('YYYY') : '';

    return p;
  }

  remove(p: any, d) {
    p.highlights--;

    return p;
  }

  init(): any {
    return { highlights: 0, book: '', author: '', month: '', year: '' };
  }

  addGraph(p: any, d) {
    if (d.book in p.books) {
      p.books[d.book]++;
    } else {
      p.books[d.book] = 1;
    }

    p.label = d.date ? moment(d.date).format('MMM YY') : '';
    p.month = d.date ? d.date.getMonth() : 0;
    p.year = d.date ? d.date.getFullYear() : 0;
    p.count = Object.keys(p.books).length;

    return p;
  }

  removeGraph(p: any, d) {
    p.books[d.book]--;
    if (p.books[d.book] === 0) {
      delete p.books[d.book];
    }

    p.count = Object.keys(p.books).length;

    return p;
  }

  initGraph(): any {
    return { books: {}, count: 0, label: '', month: 0, year: 0 };
  }

}

export interface Element {
  book: string;
  author: string;
  highlights: number;
  year: number;
}
