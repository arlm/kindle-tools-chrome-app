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

  bookByDate: crossfilter.Dimension<Book, Date>;
  bookByTitle: crossfilter.Dimension<Book, string>;

  booksByMonth: crossfilter.Group<Book, Date, crossfilter.NaturallyOrderedValue>;

  booksByMonthValues;
  booksByYearValues;
  booksByTitleValues;

  values;
  lastYearSelection;

  displayedColumns = ['book', 'author', 'highlights'];

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
        x: (d) => d.key,
        y: (d) => d.value.count,
        showValues: true,
        valueFormat: (d) => d3.format(',.0f')(d),
        duration: 500,
        xAxis: {
          axisLabel: 'Month',
          rotateLabels: 30,
          axisLabelDistance: -30,
          tickFormat: (d) => moment(d).format('MMM')
        },
        yAxis: {
          axisLabel: 'Books read',
          axisLabelDistance: -10,
          tickFormat: (d) => d3.format(',.0f')(d),
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
        x: (d) => d.key,
        y: (d) => d.value.count,
        showValues: true,
        valueFormat: (d) => d3.format(',.0f')(d),
        duration: 500,
        xAxis: {
          axisLabel: 'Year',
          axisLabelDistance: 30,
          tickPadding: 10,
          tickFormat: (d) => moment(d).year()
        },
        yAxis: {
          axisLabel: 'Books read',
          axisLabelDistance: -10,
          tickFormat: (d) => d3.format(',.0f')(d),
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

    this.bookByDate = data.dimension((d) => d.date);
    this.bookByTitle = data.dimension((d) => d.book);

    this.updateMonthlyData(null, null);
    this.updateYearlyData();
    this.updateTable(null);

    window.setTimeout(() => {
      this.monthly.updateSize();
      this.monthly.chart.update();
      this.yearly.updateSize();
      this.yearly.chart.update();
      this.loadCharts();
    }, 1);
  }

  private updateTable(filterFunc: (d: any) => boolean) {
    const booksByTitle = this.bookByTitle.group();
    this.booksByTitleValues = booksByTitle.reduce(this.add, this.remove, this.init);
    this.values = filterFunc ? this.booksByTitleValues.all().filter(filterFunc) : this.booksByTitleValues.all();
    console.log(this.values);
    console.log(this.monthlyData[0].values);
  }

  private updateYearlyData() {
    const booksByYear = this.bookByDate.group(d3.time.year);
    this.booksByYearValues = booksByYear.reduce(this.addGraph, this.removeGraph, this.initGraph);

    this.yearlyData = [
      {
        key: 'Books by Year',
        values: this.booksByYearValues.all()
      }
    ];
  }

  private updateMonthlyData(filterFunc: (d: any) => boolean, label: string) {
    this.booksByMonth = this.bookByDate.group(d3.time.month);
    this.booksByMonthValues = this.booksByMonth.reduce(this.addGraph, this.removeGraph, this.initGraph);
    const data = filterFunc ? this.booksByMonthValues.all().filter(filterFunc) : this.booksByMonthValues.all();
    label = !label ? 'Months' : label;

    window.setTimeout(() => {
      if (filterFunc) {
        this.monthly.chart.xAxis.tickFormat((d) => moment(d).format('MMM'));
        this.monthly.chart.xAxis.rotateLabels(30);
      } else {
        this.monthly.chart.xAxis.tickFormat((d) => moment(d).format('MMM YYYY'));
        this.monthly.chart.xAxis.rotateLabels(45);
      }

      this.monthly.chart.xAxis.axisLabel(label);
      this.monthly.chart.update();
    }, 1);

    this.monthlyData = [
      {
        key: 'Books by Year',
        values: data
      }
    ];

  }

  loadCharts() {
    const monthlyG = this.monthly.svg.select('g');

    const monthlyReset = this.addResetButton(monthlyG, (button) => {
      this.lastYearSelection ?
        this.updateTable((d) => d.value.book in this.lastYearSelection.data.value.books) :
        this.updateTable(null);
      button.style('display', 'none');
    });

    this.monthly.chart.discretebar.dispatch.on('elementClick', (e) => {
      this.updateTable((d) => d.value.book in e.data.value.books);
      monthlyReset.style('display', 'block');
    });

    const yearlyG = this.yearly.svg.select('g');

    const yearlyReset = this.addResetButton(yearlyG, (button) => {
      this.updateMonthlyData(null, null);
      this.updateTable(null);
      this.lastYearSelection = null;
      button.style('display', 'none');
      monthlyReset.style('display', 'none');
    });

    this.yearly.chart.discretebar.dispatch.on('elementClick', (e) => {
      this.lastYearSelection = e;
      const date = new Date(e.data.key);
      this.updateMonthlyData((d) => d.key.getFullYear() === date.getFullYear(), `Months (${date.getFullYear()})`);
      this.updateTable((d) => d.value.book in e.data.value.books);
      yearlyReset.style('display', 'block');
    });
  }

  updateYearlyChart(g: d3.Selection<any>) {
    const reset = g.selectAll('.reset');

  }

  updateMonthlyChart(g: d3.Selection<any>) {
    const reset = g.selectAll('.reset');
  }

  addResetButton(g: d3.Selection<any>, onClick: (button: any) => void): any {
    const reset = g.append('text')
      .attr('class', 'reset')
      .attr('y', 10)
      .attr('x', 20)
      .style('display', 'none')
      .text('reset')
      .on('click', () => onClick(reset));

    return reset;
  }

  add(p: any, d) {
    p.highlights++;
    p.book = d.book;
    p.author = d.author;
    p.date = d.date;

    return p;
  }

  remove(p: any, d) {
    p.highlights--;

    return p;
  }

  init(): any {
    return { highlights: 0, book: '', author: '', date: Date };
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
