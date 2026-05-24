import { inject, Injectable, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { ClinicState } from './clinic-state';
import { WS_URL } from '../../di-tokens';

@Injectable({
  providedIn: 'root',
})
export class WebsocketService implements OnDestroy {
  private wsUrl = inject(WS_URL);
  private socket: WebSocket | null = null;
  private messageSubject = new Subject<ClinicState>();
  public messages$ = this.messageSubject.asObservable();

  public constructor() {
    this.connect();
  }

  public connect(): void {
    if (this.socket) return;

    this.socket = new WebSocket(`${this.wsUrl}/waiting-room`);

    this.socket.onmessage = (event) => {
      const state: ClinicState = JSON.parse(event.data);
      this.messageSubject.next(state);
    };

    this.socket.onclose = () => {
      this.socket = null;
      setTimeout(() => {
        this.connect();
      }, 3000);
    };
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  public ngOnDestroy(): void {
    this.disconnect();
  }
}
