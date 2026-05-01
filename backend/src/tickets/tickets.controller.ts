import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { Ticket } from '../entities/ticket.entity';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post('book')
  async bookTicket(@Body() bookingData: { activityId: number; userId: number }): Promise<Ticket> {
    return this.ticketsService.bookTicket(bookingData.activityId, bookingData.userId);
  }

  @Post('book/async')
  async asyncBookTicket(@Body() bookingData: { activityId: number; userId: number }): Promise<{ message: string }> {
    return this.ticketsService.asyncBookTicket(bookingData.activityId, bookingData.userId);
  }

  @Get('by-number/:ticketNumber')
  async getTicketByNumber(@Param('ticketNumber') ticketNumber: string): Promise<Ticket> {
    return this.ticketsService.getTicketByNumber(ticketNumber);
  }

  @Get('user/:userId')
  async getUserTickets(@Param('userId', ParseIntPipe) userId: number): Promise<Ticket[]> {
    return this.ticketsService.getUserTickets(userId);
  }
}
