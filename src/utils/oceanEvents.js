export const OceanEvent = {
  typing: () => window.dispatchEvent(new CustomEvent('kurage:typing')),
  pulse: () => window.dispatchEvent(new CustomEvent('kurage:pulse')),
  dim: () => window.dispatchEvent(new CustomEvent('kurage:dim')),
  setTarget: (x, y) => window.dispatchEvent(new CustomEvent('kurage:set-target', { detail: { x, y } })),
};
