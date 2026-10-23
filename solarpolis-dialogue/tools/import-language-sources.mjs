/** Reproducible, selected lexical data import. Node 20+, no npm dependencies.
 * node tools/import-language-sources.mjs [--download] [--check]
 * LANGUAGE_SOURCE_CACHE overrides the temporary download cache.
 * Does not execute upstream code or interpret lexical content as instructions.
 */
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join, dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {inflateRawSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('../', import.meta.url));
const cache = process.env.LANGUAGE_SOURCE_CACHE || join(tmpdir(), 'solarpolis-language-sources');
const download = process.argv.includes('--download');
const check = process.argv.includes('--check');
const wnRelease = '2025-edition';
const wnCommit = '45fdb60396dc804526b85f21a23c59983c2c396a';
const vnCommit = 'ae8e9cfdc2c0d3414b748763612f1a0a34194cc1';
const wnArchiveHash = '7d749f6e2c39e6970e4997839dcf6e42fd281f3c2fae0171d2192bae8cfa4b51';
const sources = [];
const hash = b => createHash('sha256').update(b).digest('hex');
let previousManifest;
try { previousManifest = JSON.parse(await readFile(join(root, 'dist/data/source-manifest.json'), 'utf8')); } catch {}

async function input(name, url, expectedHash) {
  const path = join(cache, name);
  let bytes;
  try { bytes = await readFile(path); }
  catch {
    if (!download) throw Error(`Missing ${path}; run with --download to fetch the pinned public source.`);
    const response = await fetch(url);
    if (!response.ok) throw Error(`${response.status}: ${url}`);
    bytes = Buffer.from(await response.arrayBuffer());
    await mkdir(cache, {recursive:true});
    await writeFile(path, bytes);
  }
  const sha256 = hash(bytes);
  const lockedHash = expectedHash || previousManifest?.inputs.find(s => s.url === url)?.sha256;
  if (lockedHash) assert.equal(sha256, lockedHash, `Source changed: ${url}`);
  sources.push({file:name, url, sha256, bytes:bytes.length});
  return bytes;
}

// Read central directory entries; accept only the ZIP features of this official
// release. Nothing is extracted to disk and no archive paths are trusted.
function unzipJSON(bytes) {
  let end = bytes.length - 22;
  while (end >= Math.max(0, bytes.length - 65557) && bytes.readUInt32LE(end) !== 0x06054b50) end--;
  assert(end >= 0, 'ZIP end-of-directory missing');
  let pos = bytes.readUInt32LE(end + 16);
  const result = new Map();
  for (let n = 0; n < bytes.readUInt16LE(end + 10); n++) {
    assert.equal(bytes.readUInt32LE(pos), 0x02014b50);
    const method = bytes.readUInt16LE(pos + 10);
    const size = bytes.readUInt32LE(pos + 20);
    const rawSize = bytes.readUInt32LE(pos + 24);
    const nameSize = bytes.readUInt16LE(pos + 28);
    const extraSize = bytes.readUInt16LE(pos + 30);
    const commentSize = bytes.readUInt16LE(pos + 32);
    const offset = bytes.readUInt32LE(pos + 42);
    const name = bytes.subarray(pos + 46, pos + 46 + nameSize).toString('utf8');
    const start = offset + 30 + bytes.readUInt16LE(offset + 26) + bytes.readUInt16LE(offset + 28);
    assert(rawSize < 50000000, 'Unexpected oversized archive member');
    const compressed = bytes.subarray(start, start + size);
    const data = method === 0 ? compressed : method === 8 ? inflateRawSync(compressed) : null;
    assert(data, 'Unsupported ZIP method');
    assert.equal(data.length, rawSize);
    if (name.endsWith('.json')) result.set(name, JSON.parse(data.toString('utf8')));
    pos += 46 + nameSize + extraSize + commentSize;
  }
  return result;
}

// The compact XML reader deliberately supports only the simple source dialect.
// It never fetches DTDs/entities. All source frame trees are preserved, including
// argument restrictions and negative semantic predicates.
const unescapeXML = text => text.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, v) => {
  if (v[0] === '#') return String.fromCodePoint(parseInt(v.slice(v[1] === 'x' ? 2 : 1), v[1] === 'x' ? 16 : 10));
  return {amp:'&', lt:'<', gt:'>', quot:'"', apos:"'"}[v];
});
function parseXML(xml) {
  const document = {tag:'document', attributes:{}, children:[]};
  const stack = [document];
  for (const token of xml.match(/<!--[\s\S]*?-->|<[^>]+>|[^<]+/g) || []) {
    if (/^<(!|\?)/.test(token)) continue;
    if (token.startsWith('</')) {
      assert.equal(stack.pop().tag, token.slice(2, -1).trim());
    } else if (token.startsWith('<')) {
      const tag = /^<([^\s/>]+)/.exec(token)[1];
      const attributes = Object.fromEntries([...token.matchAll(/([^\s=]+)\s*=\s*"([^"]*)"/g)].map(m => [m[1], unescapeXML(m[2])]));
      const node = {tag, attributes, children:[]};
      stack.at(-1).children.push(node);
      if (!token.endsWith('/>')) stack.push(node);
    } else if (token.trim()) stack.at(-1).children.push(unescapeXML(token.trim()));
  }
  assert.equal(stack.length, 1, 'Unclosed XML element');
  return document.children[0];
}
const child = (node, tag) => node?.children.find(c => c.tag === tag);
const children = (node, tag) => node?.children.filter(c => c.tag === tag) || [];

// These links are application-author decisions after checking the definitions.
// They are not claims made by WordNet/VerbNet. Approved lemmas are deliberately
// narrower than all synonyms, and require a matching grammatical construction.
const selections = [
  ['knowledge.know', '00596016-v', ['know'], ['cognize-85']],
  ['knowledge.familiar', '00595732-v', ['know'], []],
  ['knowledge.believe', '00685199-v', ['believe','think'], ['conjecture-29.5']],
  ['knowledge.learn', '00600349-v', ['learn','hear','find out'], ['learn-14']],
  ['knowledge.remember', '00609334-v', ['remember','recall'], []],
  ['knowledge.evidence', '05832256-n', ['evidence'], []],
  ['communication.inform', '00954556-v', ['tell'], ['tell-37.2']],
  ['communication.say', '01011267-v', ['say'], ['say-37.7']],
  ['communication.ask', '00786389-v', ['ask','inquire'], ['inquire-37.1.2']],
  ['communication.request', '00754499-v', ['ask','request'], ['beg-58.2']],
  ['communication.promise', '00885532-v', ['promise','pledge'], ['promise-37.13']],
  ['communication.deny', '00818217-v', ['deny'], []],
  ['communication.agree', '00807038-v', ['agree'], []],
  ['communication.accept', '00766267-v', ['agree','accept'], []],
  ['communication.disagree', '00806464-v', ['disagree'], []],
  ['possession.own', '02209474-v', ['own','possess','have'], ['own-100.1']],
  ['possession.give', '02204104-v', ['give','hand','pass'], ['give-13.1']],
  ['possession.trade', '02263812-v', ['trade','exchange'], ['exchange-13.6.1']],
  ['motion.move', '01839438-v', ['move','go','travel'], ['run-51.3.2']],
  ['motion.leave', '02013448-v', ['leave','depart','go away'], ['leave-51.2']],
  ['motion.arrive', '02009962-v', ['arrive','reach'], ['escape-51.1']],
  ['perception.see', '02133754-v', ['see'], ['see-30.1']],
  ['perception.hear', '02174146-v', ['hear'], []],
  ['social.trust', '00690278-v', ['trust'], []],
  ['social.help', '02553283-v', ['help','assist'], ['help-72.1']],
  ['goal.want', '01829179-v', ['want','desire'], ['want-32.1']],
  ['goal.need', '01191258-v', ['need'], []],
  ['authority.rule', '02592711-v', ['rule','govern'], ['captain-29.8']],
  ['authority.permit', '00803980-v', ['allow','permit'], ['allow-64.1']],
  ['authority.forbid', '00797525-v', ['forbid','prohibit'], ['forbid-64.4']],
  ['authority.power', '05203850-n', ['authority'], []],
  ['authority.government', '08067430-n', ['government'], []],
  ['authority.law', '08458195-n', ['law'], []],
  ['authority.right', '05182180-n', ['right'], []],
  ['cognition.mind', '05619057-n', ['mind'], []],
  ['cognition.memory', '05943778-n', ['memory'], []],
  ['cognition.memoryCapacity', '05659244-n', ['memory'], []],
  ['location.place', '08682181-n', ['place','location'], []],
  ['explanation.cause', '07341157-n', ['cause'], []],
  ['comparison.compare', '00654571-v', ['compare'], []],
];

const archiveURL = `https://github.com/globalwordnet/english-wordnet/releases/download/${wnRelease}/english-wordnet-2025-json.zip`;
const archive = unzipJSON(await input('oewn-2025.zip', archiveURL, wnArchiveHash));
const allEntries = {};
const allSynsets = {};
for (const [name, data] of archive) Object.assign(name.startsWith('entries-') ? allEntries : allSynsets, data);
const selectedIDs = new Set(selections.map(x => x[1]));
for (const id of selectedIDs) assert(allSynsets[id], `Missing selected sense ${id}`);
// One level of hypernyms supplies broader concepts without recursive explosion.
for (const id of [...selectedIDs]) for (const target of allSynsets[id].hypernym || []) selectedIDs.add(target);
const relationNames = ['hypernym','hyponym','antonym','similar','entails','causes','also','attribute','domain_topic'];
const synsets = [...selectedIDs].sort().map(id => {
  const s = allSynsets[id];
  return {id, ili:s.ili || null, partOfSpeech:s.partOfSpeech, definitions:s.definition,
    members:s.members, relations:Object.fromEntries(relationNames.filter(k => s[k]).map(k => [k,s[k]])),
    source:'oewn-2025', selection:selections.some(x => x[1] === id) ? 'curated' : 'direct-hypernym'};
});
const entries = [];
for (const [lemma, variants] of Object.entries(allEntries)) for (const [partOfSpeech, e] of Object.entries(variants)) {
  const senses = e.sense?.filter(s => selectedIDs.has(s.synset)).map(s => ({id:s.id, synset:s.synset, subcategorization:s.subcat || []}));
  if (senses?.length) entries.push({lemma,partOfSpeech,forms:e.form || [],senses,source:'oewn-2025'});
}
entries.sort((a,b) => a.lemma.localeCompare(b.lemma, 'en') || a.partOfSpeech.localeCompare(b.partOfSpeech));

const classes = [];
for (const id of [...new Set(selections.flatMap(x => x[3]))].sort()) {
  const filename = `${id}.xml`;
  const url = `https://raw.githubusercontent.com/cu-clear/verbnet/${vnCommit}/verbnet3.4/${filename}`;
  const node = parseXML((await input(`vn-${filename}`, url)).toString('utf8'));
  function visit(n, parentId = null) {
    const classID = n.attributes.ID;
    assert(classID, `Class ID missing in ${filename}`);
    classes.push({id:classID,parentId,source:'verbnet-3.4',sourceFile:filename,
      members:children(child(n,'MEMBERS'),'MEMBER').map(m => m.attributes),
      roles:child(n,'THEMROLES')?.children || [],
      frames:children(child(n,'FRAMES'),'FRAME').map((frame,index) => ({id:`${classID}/frame/${index+1}`, ...frame})),
      inheritance:'Parent roles and frames remain available; subclass restrictions may refine them.'});
    for (const sub of children(child(n,'SUBCLASSES'),'VNSUBCLASS')) visit(sub, classID);
  }
  visit(node);
}

const notices = [
  ['Open-English-WordNet-LICENSE.md', `https://raw.githubusercontent.com/globalwordnet/english-wordnet/${wnCommit}/LICENSE.md`],
  ['Princeton-WordNet-LICENSE.txt', `https://raw.githubusercontent.com/globalwordnet/english-wordnet/${wnCommit}/WNDB_License.txt`],
  ['VerbNet-3.X-LICENSE.txt', 'https://verbs.colorado.edu/~mpalmer/projects/verbnet/license.3.0.txt'],
];
const noticeBytes = [];
for (const [name,url] of notices) noticeBytes.push([name,await input(name,url)]);

const conceptMappings = selections.map(([concept,synset,approvedLemmas,verbnetClasses]) => ({
  concept, wordnetSynsets:[synset], verbnetClasses, approvedLemmas,
  origin:'authored-integration-mapping',
  use:'candidate-only: grammatical construction, argument types, negation and context must still be checked',
}));
const pack = {
  schemaVersion:1, language:'en',
  description:'Selected lexical evidence; not an autonomous parser, inference engine or synonym substitution list.',
  wordnet:{source:'oewn-2025',synsets,entries},
  verbnet:{source:'verbnet-3.4',classes},
  conceptMappings,
};

const allSenseIDs = entries.flatMap(e => e.senses.map(s => s.id));
assert.equal(new Set(allSenseIDs).size, allSenseIDs.length, 'Duplicate sense IDs');
assert(entries.every(e => e.senses.every(s => selectedIDs.has(s.synset))), 'Dangling imported sense');
assert.equal(new Set(classes.map(c => c.id)).size, classes.length, 'Duplicate verb class');
assert(classes.every(c => !c.parentId || classes.some(p => p.id === c.parentId)), 'Missing parent verb class');
assert(conceptMappings.every(m => m.verbnetClasses.every(id => classes.some(c => c.id === id))), 'Missing mapped verb class');
assert(classes.every(c => c.frames.every(f => f.children.some(n => n.tag === 'SYNTAX'))), 'Frame syntax missing');
assert(classes.some(c => c.id === 'give-13.1') && entries.some(e => e.lemma === 'know'));
assert(conceptMappings.filter(m => m.approvedLemmas.includes('ask')).length >= 2, 'Ask ambiguity must remain explicit');
assert(conceptMappings.filter(m => m.approvedLemmas.includes('hear')).length >= 2, 'Hear ambiguity must remain explicit');
// Keep the runtime resource small; the importer and manifest remain readable.
const serialized = JSON.stringify(pack) + '\n';
const manifest = {
  schemaVersion:1,
  sources:[
    {id:'oewn-2025',name:'Open English WordNet',release:wnRelease,metadataCommit:wnCommit,
      homepage:'https://en-word.net/', repository:'https://github.com/globalwordnet/english-wordnet',
      licenses:['CC-BY-4.0','Princeton-WordNet'], notices:['Open-English-WordNet-LICENSE.md','Princeton-WordNet-LICENSE.txt'],
      modifications:'Selected synsets and senses; selected relations; one level of hypernyms; normalized JSON fields; authored concept links.'},
    {id:'verbnet-3.4',name:'University of Colorado VerbNet',version:'3.4',commit:vnCommit,
      homepage:'https://verbs.colorado.edu/verbnet/',repository:'https://github.com/cu-clear/verbnet',
      licenses:['LicenseRef-VerbNet-3.X'],notices:['VerbNet-3.X-LICENSE.txt'],
      citation:'Karin Kipper, Anna Korhonen, Neville Ryant, Martha Palmer. A Large-scale Classification of English Verbs. Language Resources and Evaluation 42(1), 21–40, 2008.',
      modifications:'Selected class files, preserving subclass inheritance, members, role restrictions, syntax and semantic trees; added deterministic frame locators and authored concept links.'},
  ],
  inputs:sources,
  runtime:{file:'lexical-pack.json',sha256:hash(serialized),bytes:Buffer.byteLength(serialized),
    counts:{synsets:synsets.length,lexicalEntries:entries.length,senses:allSenseIDs.length,
      verbClasses:classes.length,verbMembers:classes.reduce((s,c)=>s+c.members.length,0),
      verbFrames:classes.reduce((s,c)=>s+c.frames.length,0),authoredMappings:conceptMappings.length}},
  integrity:'Input hashes lock the exact converted bytes. Frame IDs are generated locators, not upstream global frame IDs. WordNet sense and synset IDs and VerbNet class IDs are preserved verbatim.',
};
for (const [name, content] of [['dist/data/lexical-pack.json',serialized],['dist/data/source-manifest.json',JSON.stringify(manifest,null,2)+'\n'],...noticeBytes.flatMap(([name,content]) => [[`vendor-notices/${name}`,content],[`dist/vendor-notices/${name}`,content]])]) {
  const path = join(root,name);
  if (check) assert.equal(hash(await readFile(path)),hash(content),`Generated file differs: ${name}`);
  else { await mkdir(dirname(path),{recursive:true}); await writeFile(path,content); }
}
console.log(JSON.stringify({mode:check?'verified':'generated',...manifest.runtime},null,2));
