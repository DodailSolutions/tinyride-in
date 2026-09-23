import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PaymentsService } from './payments.service';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { AuditService } from '../audit/audit.service';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let mockServiceClient: {
    from: jest.Mock;
  };
  let mockAuditService: { record: jest.Mock };
  let mockConfigService: { get: jest.Mock };

  beforeEach(async () => {
    mockServiceClient = {
      from: jest.fn(),
    };

    mockAuditService = {
      record: jest.fn().mockResolvedValue(undefined),
    };

    mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'RAZORPAY_KEY_ID') return 'rzp_test_123';
        if (key === 'RAZORPAY_WEBHOOK_SECRET') return 'secret_test_key_123';
        return null;
      }),
    };

    const mockSupabaseService = {
      getServiceRoleClient: jest.fn().mockReturnValue(mockServiceClient),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: AuditService, useValue: mockAuditService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  describe('createPaymentOrder', () => {
    it('creates an online order for an awaiting booking', async () => {
      mockServiceClient.from.mockImplementation((table: string) => {
        if (table === 'parents') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { id: 'parent-1', user_id: 'user-1' },
            }),
          };
        }
        if (table === 'bookings') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: {
                id: 'booking-1',
                parent_id: 'parent-1',
                amount_minor: 450000,
                currency: 'INR',
                state: 'awaiting_payment',
              },
            }),
          };
        }
        if (table === 'payments') {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: 'pay-1',
                    booking_id: 'booking-1',
                    amount_minor: 450000,
                    currency: 'INR',
                    status: 'created',
                  },
                }),
              }),
            }),
          };
        }
        return { select: jest.fn().mockReturnThis() };
      });

      const res = await service.createPaymentOrder('user-1', {
        bookingId: 'booking-1',
      });

      expect(res.paymentId).toBe('pay-1');
      expect(res.orderId).toBeDefined();
      expect(res.amountMinor).toBe(450000);
      expect(res.keyId).toBe('rzp_test_123');
      expect(mockAuditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'insert',
          tableName: 'payments',
          recordId: 'pay-1',
          reasonCode: 'PAYMENT_ORDER_CREATED',
        }),
      );
    });

    it('rejects if booking is already confirmed or cancelled', async () => {
      mockServiceClient.from.mockImplementation((table: string) => {
        if (table === 'parents') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { id: 'parent-1', user_id: 'user-1' },
            }),
          };
        }
        if (table === 'bookings') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: {
                id: 'booking-1',
                parent_id: 'parent-1',
                state: 'confirmed',
              },
            }),
          };
        }
        return { select: jest.fn().mockReturnThis() };
      });

      await expect(
        service.createPaymentOrder('user-1', {
          bookingId: 'booking-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('handleWebhook', () => {
    it('processes payment.captured and writes balanced double-entry ledger entries', async () => {
      let insertedLedgerEntries: any[] = [];

      mockServiceClient.from.mockImplementation((table: string) => {
        if (table === 'payment_webhooks') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: null }),
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: { id: 'wh-1' } }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          };
        }
        if (table === 'payments') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: {
                id: 'pay-1',
                booking_id: 'booking-1',
                parent_id: 'parent-1',
                amount_minor: 500000, // ₹5,000
                provider_order_id: 'order_123',
                status: 'created',
              },
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          };
        }
        if (table === 'bookings') {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      id: 'booking-1',
                      seat_hold_id: 'hold-1',
                      routes: { owner_id: 'owner-1' },
                    },
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'seat_holds') {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          };
        }
        if (table === 'ledger_accounts') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            is: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockImplementation(() => {
              return Promise.resolve({ data: { id: 'acct-' + Math.random().toString(36).substring(7) } });
            }),
          };
        }
        if (table === 'ledger_transactions') {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'tx-1' },
                }),
              }),
            }),
          };
        }
        if (table === 'ledger_entries') {
          return {
            insert: jest.fn().mockImplementation((entries) => {
              insertedLedgerEntries = entries;
              return Promise.resolve({ data: entries, error: null });
            }),
          };
        }
        return { select: jest.fn().mockReturnThis() };
      });

      const payload = {
        event: 'payment.captured',
        event_id: 'evt_test_123',
        payload: {
          payment: {
            entity: {
              id: 'pay_rzp_test_999',
              order_id: 'order_123',
              amount: 500000,
            },
          },
        },
      };

      const rawBody = JSON.stringify(payload);
      const signature = crypto
        .createHmac('sha256', 'secret_test_key_123')
        .update(rawBody)
        .digest('hex');

      const res = await service.handleWebhook(rawBody, signature, payload);
      expect(res.status).toBe('processed');
      expect(res.event).toBe('payment.captured');

      // Verify Balanced Ledger Entries: sum must be exactly 0
      expect(insertedLedgerEntries).toHaveLength(3);
      const sum = insertedLedgerEntries.reduce((acc, curr) => acc + curr.amount_minor, 0);
      expect(sum).toBe(0);

      // Verify 15% platform fee and 85% owner payable
      const clearingEntry = insertedLedgerEntries.find((e) => e.amount_minor > 0);
      const feeEntry = insertedLedgerEntries.find((e) => e.amount_minor === -75000); // 15% of 500,000 = 75,000
      const ownerEntry = insertedLedgerEntries.find((e) => e.amount_minor === -425000); // 85% of 500,000 = 425,000

      expect(clearingEntry.amount_minor).toBe(500000);
      expect(feeEntry).toBeDefined();
      expect(ownerEntry).toBeDefined();
    });

    it('rejects webhook with invalid signature', async () => {
      const payload = { event: 'payment.captured', event_id: 'evt_123' };
      const rawBody = JSON.stringify(payload);

      await expect(
        service.handleWebhook(rawBody, 'invalid_signature_hash', payload),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('returns already_processed on duplicate event replay', async () => {
      mockServiceClient.from.mockImplementation((table: string) => {
        if (table === 'payment_webhooks') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: {
                id: 'wh-1',
                processed_at: '2026-09-23T00:00:00.000Z',
              },
            }),
          };
        }
        return { select: jest.fn().mockReturnThis() };
      });

      const payload = { event: 'payment.captured', event_id: 'evt_repeat' };
      const rawBody = JSON.stringify(payload);
      const signature = crypto
        .createHmac('sha256', 'secret_test_key_123')
        .update(rawBody)
        .digest('hex');

      const res = await service.handleWebhook(rawBody, signature, payload);
      expect(res.status).toBe('already_processed');
    });
  });
});
