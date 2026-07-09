import { buildItems, dateBucket, fmtDuration, type TimelineEvent } from './timelineGrouping';

const ev = (p: Partial<TimelineEvent> & { id: string; timestamp: string }): TimelineEvent => ({
  type: 'ORDER_STATUS', title: p.id, description: '', ...p,
});

describe('buildItems — order collapsing', () => {
  it('collapses all events of one order into a single expandable card', () => {
    // newest-first (as the API returns)
    const events: TimelineEvent[] = [
      ev({ id: 'del', type: 'ORDER_DELIVERED', timestamp: '2026-06-30T12:00:00Z', orderId: 'A', canReorder: true,
           summary: { pharmacyName: 'Ezaby', rating: 4.8, meds: [{ name: 'Panadol', quantity: 1 }], medicineCount: 1, deliveryFee: 20, total: 180, durationMinutes: 18 } }),
      ev({ id: 'prep', type: 'ORDER_PREPARING', timestamp: '2026-06-30T11:50:00Z', orderId: 'A' }),
      ev({ id: 'acc', type: 'OFFER_ACCEPTED', timestamp: '2026-06-30T11:40:00Z', orderId: 'A' }),
      ev({ id: 'created', type: 'ORDER_CREATED', timestamp: '2026-06-30T11:30:00Z', orderId: 'A' }),
    ];
    const items = buildItems(events);
    expect(items).toHaveLength(1);
    const card = items[0];
    expect(card.kind).toBe('order');
    if (card.kind === 'order') {
      expect(card.orderId).toBe('A');
      expect(card.events).toHaveLength(4);          // all 4 lifecycle events collapsed
      expect(card.ts).toBe('2026-06-30T12:00:00Z');  // positioned at the NEWEST event
      expect(card.canReorder).toBe(true);            // captured from delivered event
      expect(card.summary?.total).toBe(180);         // summary captured
      expect(card.summary?.durationMinutes).toBe(18);
    }
  });

  it('keeps non-order events as standalone singles', () => {
    const items = buildItems([
      ev({ id: 'fav', type: 'FAVORITE_ADDED', timestamp: '2026-06-30T10:00:00Z' }),
      ev({ id: 'rx', type: 'PRESCRIPTION_UPLOADED', timestamp: '2026-06-29T10:00:00Z', prescriptionId: 'P1' }),
      ev({ id: 'basket', type: 'BASKET_CREATED', timestamp: '2026-06-28T10:00:00Z', basketId: 'B1' }),
    ]);
    expect(items.map((i) => i.kind)).toEqual(['single', 'single', 'single']);
  });

  it('preserves chronological order across different orders + singles', () => {
    const items = buildItems([
      ev({ id: 'o2', type: 'ORDER_DELIVERED', timestamp: '2026-06-30T12:00:00Z', orderId: 'B' }),
      ev({ id: 'fav', type: 'FAVORITE_ADDED', timestamp: '2026-06-30T11:00:00Z' }),
      ev({ id: 'o1a', type: 'ORDER_DELIVERED', timestamp: '2026-06-29T12:00:00Z', orderId: 'A' }),
      ev({ id: 'o1b', type: 'ORDER_CREATED', timestamp: '2026-06-29T10:00:00Z', orderId: 'A' }),
    ]);
    // order B card, favorite single, order A card — newest-first, one card per order
    expect(items).toHaveLength(3);
    expect(items[0].kind === 'order' && items[0].orderId).toBe('B');
    expect(items[1].kind).toBe('single');
    expect(items[2].kind === 'order' && items[2].orderId).toBe('A');
  });

  it('is stable as older sub-events accrete on later pages (infinite scroll)', () => {
    const page1: TimelineEvent[] = [ev({ id: 'del', type: 'ORDER_DELIVERED', timestamp: '2026-06-30T12:00:00Z', orderId: 'A' })];
    const page2: TimelineEvent[] = [ev({ id: 'created', type: 'ORDER_CREATED', timestamp: '2026-06-30T11:00:00Z', orderId: 'A' })];
    const after = buildItems([...page1, ...page2]);
    expect(after).toHaveLength(1);             // still one card, not two
    expect(after[0].ts).toBe('2026-06-30T12:00:00Z'); // position unchanged
    expect(after[0].kind === 'order' && after[0].events).toHaveLength(2);
  });
});

describe('fmtDuration', () => {
  it.each([
    [18, '18 mins'],
    [1, '1 min'],
    [59, '59 mins'],
    [60, '1h'],
    [90, '1h 30m'],
    [125, '2h 5m'],
  ])('%i => %s', (mins, out) => expect(fmtDuration(mins)).toBe(out));
  it('undefined => null', () => expect(fmtDuration(undefined)).toBeNull());
});

describe('dateBucket', () => {
  const now = new Date('2026-06-30T15:00:00Z');
  it('Today / Yesterday / dated', () => {
    expect(dateBucket('2026-06-30T09:00:00Z', now)).toBe('Today');
    expect(dateBucket('2026-06-29T09:00:00Z', now)).toBe('Yesterday');
    expect(dateBucket('2026-06-25T09:00:00Z', now)).toMatch(/Jun 25/);
    expect(dateBucket('2025-06-25T09:00:00Z', now)).toMatch(/2025/);
  });
});
