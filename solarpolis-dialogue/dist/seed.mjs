// Stable 32-bit keyed choices. No clock, global RNG, or engine-dependent sort.
export function seedNumber(...parts){
  let h=2166136261;
  for(const c of JSON.stringify(parts)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}
  h^=h>>>16;h=Math.imul(h,0x7feb352d);h^=h>>>15;
  return (h^h>>>16)>>>0;
}
export function validateSeed(value,label='seed'){
  if(typeof value!=='string'&&!(typeof value==='number'&&Number.isFinite(value)))throw new Error(`${label} must be a string or finite number`);
}
