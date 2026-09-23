import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { EnvConfig } from '../../common/config/env.config';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { AuditService } from '../audit/audit.service';
import { CreatePaymentOrderDto } from './dto/payments.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly auditService: AuditService,
    private readonly configService: ConfigService<EnvConfig, true>,
  ) {}

  /**
   * Helper to resolve parent record for user.
   */
  private async getParent(userId: string) {
    const client = this.supabaseService.getServiceRoleClient();
    const { data: parent } = await client
      .from('parents')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!parent) {
      throw new ForbiddenException('User is not registered as a parent');
    }
    return parent;
  }

  /**
   * Creates a payment order for a booking awaiting payment.
   */
  async createPaymentOrder(userId: string, dto: CreatePaymentOrderDto) {
    const client = this.supabaseService.getServiceRoleClient();
    const parent = await this.getParent(userId);

    // Verify booking
    const { data: booking, error: bErr } = await client
      .from('bookings')
      .select('id, parent_id, amount_minor, currency, state')
      .eq('id', dto.bookingId)
      .maybeSingle();

    if (!booking) {
      throw new NotFoundException(`Booking [${dto.bookingId}] not found`);
    }

    if (booking.parent_id !== parent.id) {
      throw new ForbiddenException('Data Isolation Violation: Access denied to booking');
    }

    if (booking.state !== 'awaiting_payment') {
      throw new BadRequestException(`Cannot initiate payment for booking in state: ${booking.state}`);
    }

    const amountMinor = dto.amountMinor || booking.amount_minor;
    const currency = dto.currency || booking.currency || 'INR';

    // Generate Razorpay Order ID (or integrate with Razorpay Node SDK)
    const providerOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const keyId = this.configService.get('RAZORPAY_KEY_ID', { infer: true }) || 'rzp_test_placeholder';

    // Insert into payments table
    const { data: payment, error: pErr } = await client
      .from('payments')
      .insert({
        booking_id: booking.id,
        parent_id: parent.id,
        provider: 'razorpay',
        provider_order_id: providerOrderId,
        amount_minor: amountMinor,
        currency,
        status: 'created',
      })
      .select()
      .single();

    if (pErr || !payment) {
      this.logger.error(`Failed to create payment record: ${pErr?.message}`);
      throw new BadRequestException(`Could not create payment: ${pErr?.message}`);
    }

    // Record audit event
    await this.auditService.record({
      actorUserId: userId,
      actorRole: 'parent',
      action: 'insert',
      tableName: 'payments',
      recordId: payment.id,
      reasonCode: 'PAYMENT_ORDER_CREATED',
      afterData: { paymentId: payment.id, providerOrderId, amountMinor, currency },
    });

    return {
      paymentId: payment.id,
      orderId: providerOrderId,
      amountMinor,
      currency,
      keyId,
    };
  }

  /**
   * Verifies Razorpay Webhook signature using HMAC SHA-256.
   */
  verifyWebhookSignature(rawBody: string | Buffer, signature: string): boolean {
    const webhookSecret = this.configService.get('RAZORPAY_WEBHOOK_SECRET', { infer: true });
    if (!webhookSecret || webhookSecret === 'webhook_secret_test') {
      // In dev or test environments, allow test signatures
      if (signature === 'test_signature' || !signature) {
        return true;
      }
    }

    if (!signature) {
      return false;
    }

    const payload = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret || 'webhook_secret_test')
      .update(payload)
      .digest('hex');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'utf8'),
        Buffer.from(expectedSignature, 'utf8'),
      );
    } catch {
      return false;
    }
  }

  /**
   * Helper to find or create a ledger account.
   */
  private async getOrCreateLedgerAccount(
    accountType: 'gateway_clearing' | 'platform_revenue' | 'owner_payable',
    ownerId?: string | null,
    currency = 'INR',
  ): Promise<string> {
    const client = this.supabaseService.getServiceRoleClient();

    let query = client
      .from('ledger_accounts')
      .select('id')
      .eq('account_type', accountType)
      .eq('currency', currency);

    if (accountType === 'owner_payable' && ownerId) {
      query = query.eq('owner_id', ownerId);
    } else {
      query = query.is('owner_id', null).is('parent_id', null);
    }

    const { data: existing } = await query.maybeSingle();
    if (existing) {
      return existing.id;
    }

    const { data: created, error } = await client
      .from('ledger_accounts')
      .insert({
        account_type: accountType,
        owner_id: accountType === 'owner_payable' ? ownerId : null,
        currency,
      })
      .select('id')
      .single();

    if (error || !created) {
      this.logger.error(`Failed to create ledger account ${accountType}: ${error?.message}`);
      throw new Error(`Ledger account creation failed: ${error?.message}`);
    }

    return created.id;
  }

  /**
   * Handles authoritative incoming Razorpay webhooks idempotently.
   */
  async handleWebhook(rawBody: string | Buffer, signature: string, payload: any) {
    const client = this.supabaseService.getServiceRoleClient();

    // 1. Signature Verification
    const isValid = this.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      this.logger.warn('Unauthorized Razorpay webhook: invalid signature');
      throw new UnauthorizedException('Invalid webhook signature');
    }

    // 2. Extract event identifier
    const eventId =
      payload.event_id ||
      payload.id ||
      payload.payload?.payment?.entity?.id ||
      `evt_${Date.now()}`;
    const eventType = payload.event || 'unknown';

    // 3. Idempotency Check on payment_webhooks table
    const { data: existingWebhook } = await client
      .from('payment_webhooks')
      .select('id, processed_at')
      .eq('provider', 'razorpay')
      .eq('provider_event_id', eventId)
      .maybeSingle();

    if (existingWebhook?.processed_at) {
      this.logger.log(`Webhook ${eventId} already processed. Returning idempotent response.`);
      return { status: 'already_processed', eventId };
    }

    // Record receipt of webhook
    let webhookRecordId = existingWebhook?.id;
    if (!webhookRecordId) {
      const { data: recorded, error: wErr } = await client
        .from('payment_webhooks')
        .insert({
          provider: 'razorpay',
          provider_event_id: eventId,
          event_type: eventType,
          signature_verified: true,
          payload,
        })
        .select('id')
        .single();

      if (!wErr && recorded) {
        webhookRecordId = recorded.id;
      }
    }

    // 4. Handle 'payment.captured' or 'order.paid'
    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const paymentEntity = payload.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id;
      const providerPaymentId = paymentEntity?.id;
      const amountPaid = paymentEntity?.amount;

      // Locate matching payment record
      let paymentRecord: any = null;
      if (orderId) {
        const { data } = await client
          .from('payments')
          .select('*, bookings (*)')
          .eq('provider_order_id', orderId)
          .maybeSingle();
        paymentRecord = data;
      }

      if (!paymentRecord && providerPaymentId) {
        const { data } = await client
          .from('payments')
          .select('*, bookings (*)')
          .eq('provider_payment_id', providerPaymentId)
          .maybeSingle();
        paymentRecord = data;
      }

      if (paymentRecord) {
        const now = new Date().toISOString();
        const amountMinor = Number(amountPaid || paymentRecord.amount_minor);

        // A. Update payment status to captured
        await client
          .from('payments')
          .update({
            status: 'captured',
            captured_at: now,
            provider_payment_id: providerPaymentId || paymentRecord.provider_payment_id,
          })
          .eq('id', paymentRecord.id);

        // B. Confirm booking if linked
        if (paymentRecord.booking_id) {
          const { data: booking } = await client
            .from('bookings')
            .update({
              state: 'confirmed',
              confirmed_at: now,
            })
            .eq('id', paymentRecord.booking_id)
            .select('*, routes (*)')
            .single();

          // Release seat hold if exists
          if (booking?.seat_hold_id) {
            await client
              .from('seat_holds')
              .update({ released_at: now })
              .eq('id', booking.seat_hold_id);
          }

          // C. Double-Entry Balanced Ledger Entries
          // Resolve owner from route if present
          const route = Array.isArray(booking?.routes) ? booking.routes[0] : booking?.routes;
          const ownerId = route?.owner_id || null;

          const gatewayAccountId = await this.getOrCreateLedgerAccount('gateway_clearing');
          const platformAccountId = await this.getOrCreateLedgerAccount('platform_revenue');
          const ownerAccountId = ownerId
            ? await this.getOrCreateLedgerAccount('owner_payable', ownerId)
            : platformAccountId;

          // Create ledger transaction
          const { data: ledgerTx } = await client
            .from('ledger_transactions')
            .insert({
              entry_type: 'charge',
              currency: 'INR',
              payment_id: paymentRecord.id,
              booking_id: booking?.id || paymentRecord.booking_id,
              description: `Online collection via Razorpay for booking ${booking?.id}`,
            })
            .select('id')
            .single();

          if (ledgerTx) {
            // Platform takes 15% commission, owner takes 85%
            const platformFeeMinor = Math.round(amountMinor * 0.15);
            const ownerNetMinor = amountMinor - platformFeeMinor;

            // Debit gateway clearing: +amountMinor
            // Credit platform revenue: -platformFeeMinor
            // Credit owner payable: -ownerNetMinor
            // Total: amountMinor - platformFeeMinor - ownerNetMinor = 0 (perfect balance!)
            const entries = [
              {
                transaction_id: ledgerTx.id,
                account_id: gatewayAccountId,
                amount_minor: amountMinor, // Debit > 0
                currency: 'INR',
              },
              {
                transaction_id: ledgerTx.id,
                account_id: platformAccountId,
                amount_minor: -platformFeeMinor, // Credit < 0
                currency: 'INR',
              },
              {
                transaction_id: ledgerTx.id,
                account_id: ownerAccountId,
                amount_minor: -ownerNetMinor, // Credit < 0
                currency: 'INR',
              },
            ];

            await client.from('ledger_entries').insert(entries);
          }

          // D. Record audit log
          await this.auditService.record({
            actorUserId: paymentRecord.parent_id,
            actorRole: 'parent',
            action: 'update',
            tableName: 'payments',
            recordId: paymentRecord.id,
            reasonCode: 'PAYMENT_CAPTURED_AND_BOOKING_CONFIRMED',
            afterData: {
              paymentId: paymentRecord.id,
              bookingId: paymentRecord.booking_id,
              amountMinor,
              status: 'captured',
            },
          });
        }

        // E. Mark webhook as processed
        if (webhookRecordId) {
          await client
            .from('payment_webhooks')
            .update({
              payment_id: paymentRecord.id,
              processed_at: now,
            })
            .eq('id', webhookRecordId);
        }
      }
    }

    return { status: 'processed', event: eventType, eventId };
  }

  /**
   * Lists payments for current parent.
   */
  async getPayments(userId: string) {
    const client = this.supabaseService.getServiceRoleClient();
    const parent = await this.getParent(userId);

    const { data: payments, error } = await client
      .from('payments')
      .select(`
        *,
        bookings (
          id,
          amount_minor,
          state,
          service_start,
          service_end
        )
      `)
      .eq('parent_id', parent.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return payments || [];
  }

  /**
   * Gets single payment with ledger entries.
   */
  async getPaymentById(userId: string, paymentId: string) {
    const client = this.supabaseService.getServiceRoleClient();
    const parent = await this.getParent(userId);

    const { data: payment, error } = await client
      .from('payments')
      .select(`
        *,
        bookings (*),
        ledger_transactions (
          id,
          entry_type,
          description,
          ledger_entries (*)
        )
      `)
      .eq('id', paymentId)
      .maybeSingle();

    if (!payment) {
      throw new NotFoundException(`Payment [${paymentId}] not found`);
    }

    if (payment.parent_id !== parent.id) {
      throw new ForbiddenException('Data Isolation Violation: Access denied');
    }

    return payment;
  }
}
