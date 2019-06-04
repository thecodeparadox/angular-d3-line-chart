import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DataModel } from 'src/app/line-chart/data.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  data: Observable<DataModel>;
  chartMode = 'weekly';
  
  constructor(private http: HttpClient) {
    this.data = this.http
      .get<DataModel>('./assets/data.json')
      .pipe(map(d => (<any>d)[this.chartMode]));
  }
}
