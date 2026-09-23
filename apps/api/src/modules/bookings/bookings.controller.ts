import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ParentOwnershipGuard } from '../../common/guards/parent-ownership.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { BookingsService } from './bookings.service';
import { CancelBookingDto, CreateBookingDto, HoldSeatDto } from './dto/bookings.dto';

@ApiTags('Bookings & Reservations')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post('reserve')
  @Roles('parent', 'admin')
  @ApiOperation({ summary: 'Create a 10-minute transactional seat hold on a schedule' })
  @ApiResponse({ status: 201, description: 'Seat hold created successfully' })
  async reserveSeat(
    @CurrentUser('userId') userId: string,
    @Body() dto: HoldSeatDto,
  ) {
    return this.bookingsService.reserveSeat(userId, dto);
  }

  @Post()
  @Roles('parent', 'admin')
  @ApiOperation({ summary: 'Create a formal booking awaiting payment' })
  @ApiResponse({ status: 201, description: 'Booking created successfully' })
  async createBooking(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateBookingDto,
  ) {
    return this.bookingsService.createBooking(userId, dto);
  }

  @Get()
  @Roles('parent', 'admin')
  @ApiOperation({ summary: 'List all bookings for current parent' })
  @ApiResponse({ status: 200, description: 'List of bookings' })
  async getBookings(@CurrentUser('userId') userId: string) {
    return this.bookingsService.getBookings(userId);
  }

  @Get(':bookingId')
  @UseGuards(ParentOwnershipGuard)
  @Roles('parent', 'admin', 'operator')
  @ApiOperation({ summary: 'Get booking details by ID' })
  @ApiResponse({ status: 200, description: 'Booking details' })
  async getBooking(
    @CurrentUser('userId') userId: string,
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
  ) {
    return this.bookingsService.getBookingById(userId, bookingId);
  }

  @Post(':bookingId/cancel')
  @UseGuards(ParentOwnershipGuard)
  @Roles('parent', 'admin', 'operator')
  @ApiOperation({ summary: 'Cancel a booking with a recorded reason code' })
  @ApiResponse({ status: 200, description: 'Booking cancelled' })
  async cancelBooking(
    @CurrentUser('userId') userId: string,
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
    @Body() dto: CancelBookingDto,
  ) {
    return this.bookingsService.cancelBooking(userId, bookingId, dto);
  }
}
