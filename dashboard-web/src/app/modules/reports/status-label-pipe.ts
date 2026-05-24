import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'statusLabel',
})
export class StatusLabelPipe implements PipeTransform {
  private labels: Record<string, string> = {
    WAITING: 'En espera',
    'IN ATTENTION': 'En atención',
    ATTENDED: 'Atendido',
    CANCELLED: 'Cancelado',
  };

  transform(status: string): string {
    return this.labels[status] ?? status;
  }
}
