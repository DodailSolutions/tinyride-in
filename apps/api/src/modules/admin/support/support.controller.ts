import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SupportService, SupportTicketSummary } from './support.service';
import { CreateTicketDto, UpdateTicketDto } from './dto/support.dto';
import { SupabaseAuthGuard } from '../../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@tinyride/shared-types';

@ApiTags('Admin Operations')
@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Controller('admin/support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('tickets')
  @Roles('admin', 'operator', 'support_agent')
  @ApiOperation({
    summary: 'Support Tickets Queue',
    description: 'Retrieves all support tickets with requester profile and assignment details.',
  })
  @ApiResponse({ status: 200, description: 'List of support tickets' })
  async getTickets(
    @Query('state') state?: string,
  ): Promise<SupportTicketSummary[]> {
    return this.supportService.getTickets(state);
  }

  @Post('tickets')
  @ApiOperation({
    summary: 'Create Support Ticket',
    description: 'Creates a new support inquiry ticket.',
  })
  @ApiResponse({ status: 201, description: 'Ticket created' })
  async createTicket(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTicketDto,
  ) {
    return this.supportService.createTicket(user.userId, dto);
  }

  @Patch('tickets/:id')
  @Roles('admin', 'operator', 'support_agent')
  @ApiOperation({
    summary: 'Update Support Ticket',
    description: 'Assigns agent, updates ticket state, or appends internal notes.',
  })
  @ApiResponse({ status: 200, description: 'Ticket updated' })
  async updateTicket(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) ticketId: string,
    @Body() dto: UpdateTicketDto,
  ) {
    return this.supportService.updateTicket(ticketId, user.userId, dto);
  }
}
