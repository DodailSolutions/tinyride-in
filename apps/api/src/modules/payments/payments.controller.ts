import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreatePaymentOrderDto } from './dto/payments.dto';
import { PaymentsService } from './payments.service';

@ApiTags('Payments & Webhooks')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('order')
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles('parent', 'admin')
  @ApiOperation({ summary: 'Create a Razorpay payment order for an awaiting booking' })
  @ApiResponse({ status: 201, description: 'Order created with provider ID' })
  async createPaymentOrder(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreatePaymentOrderDto,
  ) {
    return this.paymentsService.createPaymentOrder(userId, dto);
  }

  @Post('webhook/razorpay')
  @Public()
  @ApiOperation({ summary: 'Authoritative Razorpay payment webhook endpoint' })
  @ApiResponse({ status: 200, description: 'Webhook processed idempotently' })
  async handleRazorpayWebhook(
    @Headers('x-razorpay-signature') signature: string,
    @Req() req: any,
    @Body() payload: any,
  ) {
    const rawBody = req.rawBody || JSON.stringify(payload);
    return this.paymentsService.handleWebhook(rawBody, signature, payload);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles('parent', 'admin')
  @ApiOperation({ summary: 'List payment history for current parent' })
  @ApiResponse({ status: 200, description: 'List of payments' })
  async getPayments(@CurrentUser('userId') userId: string) {
    return this.paymentsService.getPayments(userId);
  }

  @Get(':paymentId')
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles('parent', 'admin', 'finance_admin')
  @ApiOperation({ summary: 'Get payment details by ID' })
  @ApiResponse({ status: 200, description: 'Payment details and ledger entries' })
  async getPayment(
    @CurrentUser('userId') userId: string,
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
  ) {
    return this.paymentsService.getPaymentById(userId, paymentId);
  }
}
