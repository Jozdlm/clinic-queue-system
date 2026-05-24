import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { StatusLabelPipe } from '../../modules/reports/status-label-pipe';

interface TicketByStatus {
  status: string;
  value: number;
  color: string;
}

@Component({
  selector: 'app-by-status-chart',
  imports: [BaseChartDirective, CommonModule, StatusLabelPipe],
  providers: [StatusLabelPipe],
  templateUrl: './by-status-chart.html',
  styles: ``,
})
export class ByStatusChart {
  private statusLabelPipe = inject(StatusLabelPipe);
  public ticketsByStatus = input<TicketByStatus[]>([]);

  public pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom', display: false },
      tooltip: { enabled: true },
    },
  };

  public pieChartData = computed<ChartData<'pie'>>(() => ({
    labels: this.ticketsByStatus().map((r) => this.statusLabelPipe.transform(r.status)),
    datasets: [
      {
        data: this.ticketsByStatus().map((r) => r.value),
        backgroundColor: this.ticketsByStatus().map((r) => r.color),
      },
    ],
  }));
}
