import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NUT_TYPES } from '../logic/constants';
import { LEVELS } from '../logic/levels';
import type { Layout } from '../logic/types';
import { MIN_NOTCH_PX, NutBoard } from './NutBoard';

const LAYOUT: Layout = [[0, 1, 1], [1, 0], [], [1, 0, 0, 1]];

const nutsOf = (container: HTMLElement) => [...container.querySelectorAll<SVGGElement>('[data-nut]')];

describe('NutBoard', () => {
  it('renders one button per bolt and selects on click and Enter', () => {
    const onSelect = vi.fn();
    render(<NutBoard layout={LAYOUT} lifted={null} shake={null} look="neon" onSelectBolt={onSelect} />);
    const bolts = screen.getAllByRole('button');
    expect(bolts).toHaveLength(4);
    fireEvent.click(bolts[2]);
    expect(onSelect).toHaveBeenLastCalledWith(2);
    fireEvent.keyDown(bolts[3], { key: 'Enter' });
    expect(onSelect).toHaveBeenLastCalledWith(3);
    fireEvent.keyDown(bolts[0], { key: ' ' });
    expect(onSelect).toHaveBeenLastCalledWith(0);
  });

  it('labels bolts with count and top type for screen readers', () => {
    render(<NutBoard layout={LAYOUT} lifted={0} shake={null} look="neon" onSelectBolt={() => {}} />);
    const label = screen.getAllByRole('button')[0].getAttribute('aria-label');
    expect(label).toBe(`Bolt 1: 3 nuts, top type 2 (${NUT_TYPES[1].name}, ${NUT_TYPES[1].notches} notches), lifted`);
    expect(screen.getAllByRole('button')[2].getAttribute('aria-label')).toBe('Bolt 3: empty');
  });

  it('ignores clicks while disabled', () => {
    const onSelect = vi.fn();
    render(<NutBoard layout={LAYOUT} lifted={null} shake={null} look="neon" disabled onSelectBolt={onSelect} />);
    for (const bolt of screen.getAllByRole('button')) {
      fireEvent.click(bolt);
      fireEvent.keyDown(bolt, { key: 'Enter' });
    }
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('draws the lifted nut above its bolt', () => {
    const { container } = render(<NutBoard layout={LAYOUT} lifted={0} shake={null} look="neon" onSelectBolt={() => {}} />);
    const onBolt0 = nutsOf(container).filter((n) => n.dataset.bolt === '0');
    const lifted = onBolt0.find((n) => n.dataset.lifted === 'true');
    const rest = onBolt0.filter((n) => n.dataset.lifted !== 'true');
    expect(lifted).toBeDefined();
    expect(rest).toHaveLength(2);
    const boltTop = Number(container.querySelector<SVGElement>('[data-rod="0"]')?.dataset.top);
    expect(Number(lifted?.dataset.y)).toBeLessThan(boltTop);
    for (const nut of rest) expect(Number(nut.dataset.y)).toBeGreaterThan(Number(lifted?.dataset.y));
  });

  it('keeps the moved nut element so it can glide to its new bolt', () => {
    const props = { shake: null, look: 'neon' as const, onSelectBolt: () => {} };
    const { container, rerender } = render(<NutBoard layout={LAYOUT} lifted={0} {...props} />);
    const moving = nutsOf(container).find((n) => n.dataset.lifted === 'true');
    rerender(<NutBoard layout={[[0, 1], [1, 0], [1], [1, 0, 0, 1]]} lifted={null} {...props} />);
    expect(moving?.isConnected).toBe(true);
    expect(moving?.dataset.bolt).toBe('2');
    expect(moving?.dataset.lifted).toBeUndefined();
  });

  it('cuts as many notches as the type defines, in both looks', () => {
    for (const look of ['neon', 'glass'] as const) {
      const { container, unmount } = render(
        <NutBoard layout={LEVELS[19].layout} lifted={null} shake={null} look={look} onSelectBolt={() => {}} />,
      );
      const nuts = nutsOf(container);
      expect(nuts).toHaveLength(32);
      for (const nut of nuts) {
        const type = Number(nut.dataset.type);
        expect(Number(nut.dataset.notches)).toBe(NUT_TYPES[type].notches);
        expect(nut.querySelectorAll('[data-notch]')).toHaveLength(NUT_TYPES[type].notches);
      }
      unmount();
    }
  });

  it('keeps every notch at least MIN_NOTCH_PX wide on 10 bolts', () => {
    const { container } = render(
      <NutBoard layout={LEVELS[19].layout} lifted={0} shake={null} look="neon" onSelectBolt={() => {}} />,
    );
    const notches = [...container.querySelectorAll<SVGRectElement>('[data-notch]')];
    expect(notches.length).toBeGreaterThan(0);
    expect(MIN_NOTCH_PX).toBeGreaterThanOrEqual(8);
    for (const notch of notches) expect(Number(notch.getAttribute('width'))).toBeGreaterThanOrEqual(MIN_NOTCH_PX);
  });

  it('keeps notches apart inside the nut', () => {
    const { container } = render(
      <NutBoard layout={LEVELS[19].layout} lifted={null} shake={null} look="neon" onSelectBolt={() => {}} />,
    );
    for (const nut of nutsOf(container)) {
      const xs = [...nut.querySelectorAll('[data-notch]')].map((n) => Number(n.getAttribute('x'))).sort((a, b) => a - b);
      for (let i = 1; i < xs.length; i++) expect(xs[i] - xs[i - 1]).toBeGreaterThanOrEqual(MIN_NOTCH_PX * 1.5);
    }
  });
});
