// Profile IDs are semantics; their names and wording belong to language modules.
const temperaments=['warm','reserved','curious','dry','lively'];
export function characterFromProfile(profile){
  if(!profile||typeof profile.id!=='string'||!profile.id)throw new Error('Profile needs an id');
  if(profile.temperament!==undefined&&!temperaments.includes(profile.temperament))throw new Error('Unknown temperament');
  if(profile.pursuits!==undefined&&(!Array.isArray(profile.pursuits)||profile.pursuits.some(p=>typeof p!=='string'||!p)))throw new Error('Pursuits must be semantic IDs');
  for(const key of ['bodyKind','ageGroup','home'])if(profile[key]!==undefined&&(typeof profile[key]!=='string'||!profile[key]))throw new Error(`Invalid profile ${key}`);
  const p={temperament:'warm',pursuits:[],...structuredClone(profile)};
  p.pursuits=[...new Set(p.pursuits)];
  return {id:p.id,voice:'generated',profile:p,personality:{detail:1,testimony:'strict',affiliation:p.temperament==='warm'?.9:.5}};
}
