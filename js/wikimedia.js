// Image credits are captured from Commons at curation time. Gameplay uses local
// copies and verified catalogue labels, never a live search result's ranking.
const Wikimedia = {
  shuffleArray(items) {
    const a = [...items];
    for (let i=a.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
    return a;
  },
  forCategory(id) { return Catalogue.images.filter(image => image.category === id); },
  validateImage(url, timeout=8000) {
    return new Promise(resolve => {
      const img=new Image(); let finished=false;
      const finish=value=>{if(finished)return;finished=true;clearTimeout(timer);img.onload=null;img.onerror=null;if(!value)img.removeAttribute('src');resolve(value);};
      const timer=setTimeout(()=>finish(false),timeout);
      img.onload=()=>finish(img.naturalWidth>0 && img.naturalHeight>0); img.onerror=()=>finish(false); img.src=url;
    });
  },
  credit(image, showCategory=true) {
    const box=document.createElement('div'); box.className='image-credit';
    const title=document.createElement('strong');title.textContent=image.title;box.append(title);
    if(showCategory){const label=document.createElement('p');label.textContent=Catalogue.categories[image.category].label;box.append(label);}
    const author=document.createElement('p');author.textContent='Creator: '+image.creator;box.append(author);
    const license=document.createElement('a');license.href=image.licenseUrl || image.source;license.textContent=image.license;license.target='_blank';license.rel='noopener noreferrer';box.append(license,document.createTextNode(' · '));
    const source=document.createElement('a');source.href=image.source;source.textContent='Commons source';source.target='_blank';source.rel='noopener noreferrer';box.append(source,document.createTextNode(' · '));
    const evidence=document.createElement('a');evidence.href=image.evidence;evidence.textContent='Subject / date reference';evidence.target='_blank';evidence.rel='noopener noreferrer';box.append(evidence);
    const changes=document.createElement('p');changes.textContent='Display copy resized and converted to JPEG; embedded metadata removed.';box.append(changes);
    return box;
  }
};
