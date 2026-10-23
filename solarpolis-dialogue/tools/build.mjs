import {build} from 'esbuild';
// Separate entry bundles prove the second page never loads Solarpolis resources.
for(const [entry,outfile] of [['bootstrap.mjs','browser.js'],['willowbrook-app.mjs','willowbrook.js']]){
  await build({entryPoints:[`dist/${entry}`],outfile:`dist/${outfile}`,bundle:true,format:'esm',target:'es2022',minify:true,logLevel:'info'});
}
