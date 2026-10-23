import {EnglishLanguage} from './english.mjs';
import {validateResources} from './validate.mjs';
export {EnglishLanguage,validateResources};
export {createEnglishResources,splitBubbles} from './bubbles.mjs';
export const englishModule=Object.freeze({
  apiVersion:1,locale:'en',validateResources,
  create({resources,schema,options={}}){return new EnglishLanguage(resources,{...options,schemas:schema.predicates});}
});
