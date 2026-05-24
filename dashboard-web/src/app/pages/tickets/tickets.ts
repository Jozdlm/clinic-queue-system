import { Component, computed, effect, inject, OnDestroy, OnInit, signal } from '@angular/core';
import {
  LucideActivity,
  LucideDynamicIcon,
  LucideEye,
  LucideHeart,
  LucideLogOut,
  LucideStethoscope,
  LucideCircleCheckBig,
  LucideCircleX,
  LucideBell,
} from '@lucide/angular';
import { AuthService } from '../../modules/auth/auth-service';
import { Subscription } from 'rxjs';
import { QueueService } from '../../modules/tickets/queue-service';
import { Ticket } from '../../modules/tickets/ticket-dto';
import { WebsocketService } from '../../modules/network/websocket-service';

interface NavItem {
  id: number;
  name: string;
  icon: any;
  queue: number;
}

@Component({
  selector: 'app-tickets',
  imports: [LucideLogOut, LucideDynamicIcon, LucideCircleCheckBig, LucideCircleX, LucideBell],
  templateUrl: './tickets.html',
  styles: ``,
})
export class Tickets implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private queueService = inject(QueueService);
  private webSocketService = inject(WebsocketService);

  public webSocketSubscription = new Subscription();

  public navItemIcons = [LucideStethoscope, LucideEye, LucideActivity, LucideEye, LucideHeart];
  public navItems = signal<NavItem[]>([]);

  public selectedClinic = signal<number>(1);
  public clinicTickets = signal<Ticket[]>([]);

  public currentTicket = computed(() => {
    return this.clinicTickets().find((t) => t.ticket.status === 'IN_ATTENTION') ?? null;
  });
  public waitingTickets = computed(() => {
    return this.clinicTickets().filter((t) => t.ticket.status === 'WAITING');
  });
  public constructor() {
    effect(() => {
      this.loadClinicTickets();
    });
  }

  public ngOnInit(): void {
    this.loadQueueState();
    this.loadClinicTickets();
    this.webSocketSubscription.add(
      this.webSocketService.messages$.subscribe({
        next: (value) => {
          this.navItems.update((items) =>
            items.map((clinic) => {
              if (clinic.id === value.clinic_id) {
                clinic.queue = value.waiting_count;
              }
              return clinic;
            }),
          );

          if (value.clinic_id === this.selectedClinic()) {
            this.loadClinicTickets();
          }
        },
      }),
    );
  }

  public ngOnDestroy(): void {
    this.webSocketSubscription.unsubscribe();
  }

  public loadQueueState(): void {
    this.queueService.getQueueSnapshot().subscribe({
      next: (res) => {
        const items = res.map((item, index) => {
          return {
            id: item.clinic_id,
            name: item.clinic_name,
            icon: this.navItemIcons[index],
            queue: item.waiting_count,
          } as NavItem;
        });

        this.navItems.set(items);
      },
    });
  }

  public loadClinicTickets() {
    this.queueService.getQueueByClinic(this.selectedClinic()).subscribe({
      next: (val) => {
        this.clinicTickets.set(val.queue);
      },
    });
  }

  public handleCallNext() {
    this.queueService
      .callNextTicket(this.selectedClinic())
      .subscribe({ next: () => this.loadClinicTickets() });
  }

  public handleAttend(ticketId: number) {
    this.queueService.markAsAttend(ticketId).subscribe({
      next: () => this.loadClinicTickets(),
    });
  }

  public handleCancel(ticketId: number) {
    this.queueService.markAsCancel(ticketId).subscribe({
      next: () => this.loadClinicTickets(),
    });
  }

  public onLogOut() {
    this.authService.logout();
  }

  public getClinicTabClass(clinicId: number): string {
    const base =
      'flex-1 min-w-[180px] px-6 py-4 flex items-center justify-center gap-3 transition-colors border-b-2';
    return this.selectedClinic() === clinicId
      ? `${base} bg-teal-50 text-teal-600 border-teal-600`
      : `${base} text-gray-600 hover:bg-gray-50 border-transparent`;
  }
}
