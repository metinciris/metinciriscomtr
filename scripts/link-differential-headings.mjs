/**
 * Conservative automated crosslinking: links exact differential-diagnosis headings
 * to existing Blog issues. Does not rewrite scientific prose or titles.
 */
const repo = process.env.GITHUB_REPOSITORY;
const token = process.env.GITHUB_TOKEN;
if (!repo || !token) throw new Error('Missing GitHub credentials');
const base = 'https://api.github.com/repos/' + repo;
async function api(path, opts={}) {
  const res=await fetch(base+path,{...opts,headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'}});
  if(!res.ok) throw new Error(res.status+' '+path+' '+(await res.text()).slice(0,250));
  return res.json();
}
async function getAll() {
  const result=[];
  for(let p=1;p<=30;p++){
    const next=await api('/issues?state=open&per_page=100&page='+p);
    result.push(...next);
    if(next.length<100) return result;
  }
  throw new Error('Issue list pagination limit reached');
}
function slug(t,n) {
  const s=t.toLocaleLowerCase('tr-TR').replace(/ç/g,'c').replace(/ğ/g,'g').replace(/ı/g,'i').replace(/ö/g,'o').replace(/ş/g,'s').replace(/ü/g,'u').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/&/g,' ve ').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').replace(/-{2,}/g,'-').slice(0,90).replace(/-+$/g,'');
  return (s||'blog-yazisi')+'-'+n;
}
function escapeHtml(t) {
  return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function norm(t) {
  return String(t||'').toLocaleLowerCase('tr-TR').replace(/^\s*\d+[.)]\s*/, '').replace(/[*_`]/g,'').replace(/[^a-zçğıöşü0-9]+/gi,' ').trim().replace(/\s+/g,' ');
}
function coreTitle(title) {
  // Blog seri adlarında açıklayıcı ikinci cümleyi çıkar.
  return String(title).replace(/^\s*\d+[.)]\s*/, '').split(/\.\s+/)[0].trim();
}
const issues=(await getAll()).filter(i=>!i.pull_request && i.labels?.some(l=>l.name?.toLocaleLowerCase('tr-TR')==='blog'));
const byName=new Map();
for(const i of issues) {
  const name=norm(coreTitle(i.title));
  if(name.length<8||name.split(' ').length<2) continue;
  if(!byName.has(name)) byName.set(name,[]);
  byName.get(name).push(i);
}
let changed=0, linked=0;
const report=[];
for(const i of issues) {
  if(changed>=15) break;
  const original=i.body||'';
  if(!/^#{1,3}\s*ay[ıi]r[ıi]c[ıi]\s+tan[ıi]/im.test(original)) continue;
  const rows=original.split('\n');
  let inDiff=false, diffLevel=2, edits=0;
  const edited=[];
  let pending=[];
  function flushLinks() {
    if(pending.length) {
      edited.push('', ...pending, '');
      pending=[];
    }
  }
  for(const line of rows) {
    const heading=line.match(/^(#{1,6})\s+(.+?)\s*$/);
    if(heading) {
      flushLinks();
      const depth=heading[1].length, raw=heading[2];
      if(/ay[ıi]r[ıi]c[ıi]\s+tan[ıi]/i.test(norm(raw))) {
        inDiff=true;diffLevel=depth;
      } else if(inDiff && depth<=diffLevel) {
        inDiff=false;
      } else if(inDiff && depth===diffLevel+1 && edits<3 && !raw.includes('](')) {
        const choices=byName.get(norm(raw))||[];
        const target=choices.length===1?choices[0]:null;
        if(target && target.number!==i.number) {
          const url='https://metinciris.com.tr/blog/'+slug(target.title,target.number)+'/';
          if(!original.includes(url)) {
            pending.push('<div class="blog-related-link">📖 <a href="'+url+'">'+escapeHtml(raw)+' hakkında daha fazlasını oku →</a></div>');
            edits++;
            report.push('#'+i.number+' → #'+target.number+': '+raw);
          }
        }
      }
    }
    edited.push(line);
  }
  flushLinks();
  if(edits===0) continue;
  const fresh=await api('/issues/'+i.number);
  if((fresh.body||'')!==original) {console.log('Skipped concurrently edited issue #'+i.number);continue;}
  await api('/issues/'+i.number,{method:'PATCH',body:JSON.stringify({body:edited.join('\n')})});
  changed++;linked+=edits;
}
console.log('Updated '+changed+' articles; '+linked+' differential further-reading links added.');
console.log(report.join('\n'));
