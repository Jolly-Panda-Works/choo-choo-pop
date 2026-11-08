export const MISSION_MS = 10 * 60 * 1000;
// Telegram's public channel preview exposes counts, but not reactor identities.
// Unknown/abbreviated counters fail closed rather than being treated as zero.
export function publicPosts(html, channel) {
 const escaped=channel.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const matches=[...html.matchAll(new RegExp(`data-post="${escaped}/(\\d+)"`,'g'))];
 const posts=new Map();
 matches.forEach((m,i)=>{
  const block=html.slice(m.index,matches[i+1]?.index ?? html.length);
  if(!block.includes('tgme_widget_message_footer'))return;
  const reactions=[...block.matchAll(/class="tgme_reaction(?:\s[^\"]*)?"[^>]*>([\s\S]*?)<\/span>/g)];
  let count=0;
  for(const reaction of reactions){
   const value=reaction[1].match(/<\/i>\s*([\d,]+)\s*$/);
   if(!value){count=null;break;}
   count+=Number(value[1].replace(/,/g,''));
  }
  if(!reactions.length && block.includes('tgme_widget_message_reactions'))count=null;
  posts.set(Number(m[1]),{id:Number(m[1]),count});
 });
 return [...posts.values()].sort((a,b)=>b.id-a.id);
}
export async function fetchPosts(channel, before, fetcher=fetch) {
 const name=channel.replace(/^@/,'');
 if(!/^[A-Za-z0-9_]+$/.test(name))throw new Error('Invalid channel');
 const url=new URL('https://t.me/s/'+name);
 if(before)url.searchParams.set('before',String(before));
 const response=await fetcher(url,{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(10000)});
 if(!response.ok)throw new Error('Channel preview unavailable');
 const posts=publicPosts(await response.text(),name);
 if(posts.length<3 || !posts.slice(0,3).every(p=>Number.isSafeInteger(p.count)))throw new Error('Not enough readable posts');
 return posts;
}
export function reactionProgress(mission, counts, now=Date.now()) {
 if(!mission || now>mission.expires)return {expired:true,progress:0,complete:false};
 const progress=mission.posts.filter(p=>counts.find(c=>c.id===p.id)?.count>p.count).length;
 return {expired:false,progress,complete:progress===3};
}
