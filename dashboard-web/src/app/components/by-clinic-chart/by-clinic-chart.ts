import { Component, computed, input, signal } from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

interface TicketByClinic {
  clinic: string;
  tickets: number;
}

@Component({
  selector: 'app-by-clinic-chart',
  imports: [BaseChartDirective],
  templateUrl: './by-clinic-chart.html',
  styles: ``,
})
export class ByClinicChart {
  public ticketsByClinic = input<TicketByClinic[]>([]);

  public barChartData = computed<ChartData<'bar'>>(() => ({
    labels: this.ticketsByClinic().map((r) => r.clinic),
    datasets: [
      {
        data: this.ticketsByClinic().map((r) => r.tickets),
        backgroundColor: '#14b8a6',
        borderRadius: 8,
        label: 'Turnos Atendidos',
      },
    ],
  }));

  public barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { position: 'bottom', display: false },
      tooltip: {
        backgroundColor: '#fff',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        titleColor: '#111827',
        bodyColor: '#6b7280',
      },
    },
    scales: {
      x: {
        grid: { color: '#e5e7eb' },
        ticks: { color: '#6b7280' },
      },
      y: {
        grid: { color: '#e5e7eb' },
        ticks: { color: '#6b7280' },
      },
    },
  };
}
