import {openStore} from './store.mjs';
import {createInvite} from './invites.mjs';
const db=openStore();
try {
  const invite=createInvite(db,{uses:Number(process.argv[2]||1),days:Number(process.argv[3]||7)});
  console.log(`Invitation: ${invite.code}\nUses: ${invite.uses}\nExpires: ${new Date(invite.expires).toISOString()}\nShare privately with your early user. The code is only shown here; the database stores its hash.`);
} catch(error) {console.error(error.message);process.exitCode=1} finally {db.close()}
