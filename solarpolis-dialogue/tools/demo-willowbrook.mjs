import {setting} from '../dist/settings/willowbrook/setting.mjs';
import {createSettingSession} from '../dist/setting-package.mjs';
const session=createSettingSession(setting);
const say=(who,input)=>{console.log(`YOU → ${who}: ${input}`);console.log(`${who.toUpperCase()}: ${session.respondText(who,input).text}\n`);};
say('ada','How are you today?');say('moss','How are you today?');
say('ada','Who owns the lantern?');say('moss','Who owns the lantern?');
session.core.advance(1);session.core.applyEvent(setting.domain.events.move);
say('ada','Where is the lantern?');say('moss','Where is the lantern?');
session.core.advance(5);say('moss','Where is it?');say('moss','How do you know?');
