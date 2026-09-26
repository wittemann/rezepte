import { render } from 'preact-render-to-string';
import { describe, expect, it } from 'vitest';
import Maulti, { type MaultiPose } from './Maulti.tsx';

const POSES: MaultiPose[] = ['wave', 'think', 'cook', 'cheer', 'sleep', 'heart', 'alarm', 'lock'];

// Distinctive paths from design/Maskottchen.dc.html
const RIGHT_EYE = 'cx="72"';
const WINK = 'M67 69 Q72 73 77 69';
const CLOSED_EYES = 'M43 70 Q48 74 53 70';
const PADLOCK = 'M106 92 V86';
const CHEFS_HAT = 'cx="60" cy="18" r="12"';

describe('Maulti', () => {
  it.each(POSES)('renders the %s pose as a decorative SVG', (pose) => {
    const svg = render(<Maulti pose={pose} />);
    expect(svg).toMatch(/^<svg[^>]*aria-hidden="true"/);
  });

  it('gives every pose a different drawing', () => {
    const drawings = new Set(POSES.map((pose) => render(<Maulti pose={pose} />)));
    expect(drawings.size).toBe(POSES.length);
  });

  it('waves by default', () => {
    expect(render(<Maulti />)).toBe(render(<Maulti pose="wave" />));
  });

  it('winks and holds a padlock in the lock pose', () => {
    const svg = render(<Maulti pose="lock" />);
    expect(svg).toContain(WINK);
    expect(svg).toContain(PADLOCK);
    expect(svg).not.toContain(RIGHT_EYE);
  });

  it('closes both eyes only when sleeping', () => {
    expect(render(<Maulti pose="sleep" />)).toContain(CLOSED_EYES);
    expect(render(<Maulti pose="wave" />)).not.toContain(CLOSED_EYES);
  });

  it('wears the chef’s hat only when cooking', () => {
    expect(render(<Maulti pose="cook" />)).toContain(CHEFS_HAT);
    expect(render(<Maulti pose="think" />)).not.toContain(CHEFS_HAT);
  });

  it('converts the size from px to rem so it follows the text size', () => {
    expect(render(<Maulti size={120} />)).toContain('width:7.5rem;height:7.5rem');
  });
});
