// Contract test double, NOT a shipped general German implementation.
// Deliberately uses a different resource shape and imports no English code.
export const germanResources={bezeichnungen:{ada:'Ada',moss:'Moss',lantern:'die Laterne',workshop:'der Werkstatt',greenhouse:'dem Gewächshaus',fair:'das Dorffest'}};
export const germanProbe={apiVersion:1,locale:'de',
  validateResources(resources,schema){
    for(const id of Object.keys(schema.entities))if(!resources.bezeichnungen?.[id])throw new Error(`Fehlende Bezeichnung: ${id}`);
  },
  create({resources}){
    const name=id=>resources.bezeichnungen[id]??id;
    return {locale:'de',name,
      interpret(text,context){
        if(text==='Wie geht es dir?')return {function:'social',topic:'wellbeing'};
        const subject=text==='Wo ist die Laterne?'?'lantern':text==='Wo ist sie?'?context.focus:null;
        if(subject)return {function:'ask',query:{predicate:'kept_at',args:{subject,place:{$var:'place'}}}};
        if(text==='Die Laterne ist im Gewächshaus.')return {function:'assert',content:{predicate:'kept_at',args:{subject:'lantern',place:'greenhouse'},polarity:true}};
        if(text==='Woher weißt du das?')return {function:'ask_evidence'};
        return {function:'clarify',reason:'unsupported'};
      },
      realize(plan){
        if(plan.social)return plan.social.topic==='farewell'?'Bis bald.':'Gut, danke.';
        if(plan.function==='assert')return 'Ich merke mir deine Aussage.';
        const evidence=plan.results[0]?.primary;
        if(!evidence)return 'Das weiß ich nicht.';
        if(plan.function==='ask_evidence')return evidence.certainty==='reported'?'Das hast du mir erzählt.':'Das habe ich aus einer Mitteilung.';
        return `Die Laterne ist in ${name(evidence.atom.args.place)}.`;
      },
      label(){return 'Wo ist die Laterne?';},
      npcLine(key,actor,args){return ({opening:`Hallo, ${args.partner}. Wie geht es dir?`,question:args.question,source:'Woher weißt du das?',verified:'Danke, ich habe die Mitteilung gelesen.',conflict:'Das widerspricht meiner Mitteilung.',reported:'Danke für die Auskunft.',unknown:'Vielleicht erfahren wir es später.'})[key];}
    };
  }
};
