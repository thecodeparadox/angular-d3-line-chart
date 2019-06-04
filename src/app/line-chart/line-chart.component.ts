import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  ViewChild,
  ViewEncapsulation,
  HostListener
} from '@angular/core';
import * as d3 from 'd3';
import { DataModel } from 'src/app/line-chart/data.model';
import { schemeDark2 } from 'd3';

@Component({
  selector: 'app-line-chart',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.scss']
})
export class LineChartComponent implements OnChanges {
  @ViewChild('lineChart')
  private chartContainer: ElementRef;

  @Input() chartMode = 'daily';
  @Input()
  chartData;

  margin = { top: 50, right: 50, bottom: 50, left: 50 };
  offTheChart = [];

  constructor() {}

  ngOnChanges(): void {
    if (!this.chartData) {
      return;
    }

    const activeData: DataModel[] = JSON.parse(JSON.stringify(this.chartData));
    this.offTheChart = activeData.map(d => d.name);
    this.createChart(activeData);
  }

  onResize() {
    const activeData: DataModel[] = JSON.parse(JSON.stringify(this.chartData));
    this.offTheChart = activeData.map(d => d.name);
    this.createChart(activeData);
  }

  private createChart(activeData: DataModel[], activeIndex?: number): void {
    d3.select('svg').remove();

    // const width = 500;
    // const height = 300;
    const margin = 50;
    const duration = 250;

    const lineOpacity = '0.5';
    const lineOpacityHover = '0.85';
    const otherLinesOpacityHover = '0.1';
    const lineStroke = '1.5px';
    const lineStrokeHover = '2.5px';

    const circleOpacity = '0.85';
    const circleOpacityOnLineHover = '0.25';
    const circleRadius = 4;
    const circleRadiusHover = 6;

    const element = this.chartContainer.nativeElement;
    const width = element.offsetWidth - this.margin.left - this.margin.right;
    const height = element.offsetHeight - this.margin.top - this.margin.bottom;
    const SELF = this;

    /* Add SVG */
    const svg = d3
      .select(element)
      .append('svg')
      .attr('width', width + margin)
      .attr('height', height + margin)
      .append('g')
      .attr('transform', `translate(${margin}, ${margin})`);

    /* Format Data */
    let timeFormat = '%Y-%m-%d';
    switch (this.chartMode) {
      case 'weekly':
        timeFormat = '%W';
        break;

      case 'hourly':
        timeFormat = '%H:%M:%S';
        break;
    }
    const parseDate = d3.timeParse(timeFormat);

    const data: DataModel[] = JSON.parse(JSON.stringify(activeData));
    const lineColors = data.map(d => d.color);
    data.forEach(d => {
      d.values.forEach(val => {
        val.date = parseDate(val.date);
        val.label = d.name;
      });
    });

    /* Scale */
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(data[0].values, d => d.date))
      .range([0, width - margin]);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data[0].values, d => +d.value)])
      .range([height - margin, 0]);

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    /* Add Legends */
    const legends = this.chartData.map(d => d.name);
    const legend = svg
      .selectAll('g')
      .data(legends)
      .enter()
      .append('g')
      .attr('class', d => {
        let cls = ['legend'];
        if (this.offTheChart.length && !this.offTheChart.includes(d)) {
          cls.push('hidden');
        }
        return cls.join(' ');
      })
      .attr('id', name => {
        return `legend-${name.toString().toLowerCase()}`;
      })
      .on('click', function(name, index, groups) {
        const is_exists = SELF.offTheChart.indexOf(name);
        if (is_exists > -1) {
          SELF.offTheChart.splice(is_exists, 1);
        } else {
          SELF.offTheChart.push(name);
        }
        let data = SELF.chartData;
        if (SELF.offTheChart.length) {
          data = SELF.chartData.filter(
            d => SELF.offTheChart.indexOf(d.name.toString()) > -1
          );
        }
        SELF.createChart(data, index);
      });

    legend
      .append('rect')
      .attr('x', width - 100)
      .attr('y', (_, i) => {
        return i * 20;
      })
      .attr('width', 10)
      .attr('height', 10)
      .style('fill', (_, i) => {
        return color(i.toString());
      });

    legend
      .append('text')
      .attr('class', 'label')
      .attr('x', width - 85)
      .attr('y', (_, i) => {
        return i * 20 + 9;
      })
      .style('font-size', '12px')
      .text(name => name.toString());

    /* Add line into SVG */
    const line = d3
      .line()
      .x(d => xScale((<any>d).date))
      .y(d => yScale((<any>d).value));

    let lines = svg.append('g').attr('class', 'lines');

    lines
      .selectAll('.line-group')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'line-group')
      .attr('id', d => {
        return `line-${d.name.toLowerCase()}`;
      })
      .append('path')
      .attr('class', 'line')
      .attr('d', d => line(d.values as any))
      .style('stroke', (d, i) => lineColors[i])
      .style('opacity', lineOpacity);


    /* Add circles in the line */
    lines
      .selectAll('circle-group')
      .data(data)
      .enter()
      .append('g')
      .style('fill', (d, i) => lineColors[i])
      .selectAll('circle')
      .data(d => d.values)
      .enter()
      .append('g')
      .attr('class', 'circle')
      .on('mouseover', function(d) {
        let label = d.label;
        let text = d.value;

        if (label.toLocaleLowerCase() === 'spend') {
          text = `\$${text}`;
        } else {
          text = Number(text).toLocaleString();
        }

        d3.select(this)
          .style('cursor', 'pointer')
          .append('text')
          .attr('class', 'text')
          .text(`${text}`)
          .attr('x', d => xScale((<any>d).date))
          .attr('y', d => yScale((<any>d).value) - 10);
      })
      .on('mouseout', function(d) {
        d3.select(this)
          .style('cursor', 'none')
          .transition()
          .duration(duration)
          .selectAll('.text')
          .remove();
      })
      .append('circle')
      .attr('cx', d => xScale(d.date))
      .attr('cy', d => yScale(d.value))
      .attr('r', circleRadius)
      // .style('opacity', circleOpacity)
      .on('mouseover', function(d) {
        d3.select(this)
          .transition()
          .duration(duration)
          .attr('r', circleRadiusHover);
      })
      .on('mouseout', function(d) {
        d3.select(this)
          .transition()
          .duration(duration)
          .attr('r', circleRadius);
      });

    /* Add Axis into SVG */
    const xAxis = d3.axisBottom(xScale); //.ticks(10);
    const yAxis = d3
      .axisLeft(yScale)
      .ticks(this.offTheChart.length === 3 ? 0 : 10);

    svg
      .append('g')
      .attr('class', 'x axis')
      .attr('transform', `translate(0, ${height - margin})`)
      .call(xAxis);

    svg
      .append('g')
      .attr('class', 'y axis')
      .call(yAxis)
      .append('text')
      .attr('y', 15)
      .attr('transform', 'rotate(-90)')
      .attr('fill', '#000');
  }
}
