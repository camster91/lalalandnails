import {ensureDatabase,getD1} from './db';
import {initializeStudio} from './studio-schema';
let initialized: Promise<void>|null=null;
export async function studioReady(){
 await ensureDatabase();
 initialized ??= initializeStudio(getD1()).catch(error=>{initialized=null;throw error;});
 await initialized;
}
