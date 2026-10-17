'use strict';
const Game = {
  totalRounds:5,currentRound:0,score:0,token:0,locked:true,currentPresetSlug:null,rounds:[],pair:[],category1:null,category2:null,
  init() {
    this.startScreen=document.getElementById('start-screen');this.loadingScreen=document.getElementById('loading-screen');this.gameScreen=document.getElementById('game-screen');
    this.status=document.getElementById('status');this.history=document.getElementById('history');this.credits=document.getElementById('round-credits');this.feedback=document.getElementById('round-feedback');this.next=document.getElementById('next-round');this.cards=[...document.querySelectorAll('.image-card')];
    Categories.presets.forEach(p=>{const b=document.createElement('button');b.type='button';b.className='preset-btn';b.dataset.slug=p.slug;b.textContent=p.name;b.addEventListener('click',()=>this.startWithPreset(p.slug));document.getElementById('preset-buttons').append(b);});
    Object.entries(Catalogue.categories).forEach(([id,cat])=>{const option=document.createElement('option');option.value=cat.label;document.getElementById('categories').append(option);});
    document.getElementById('start-btn').addEventListener('click',()=>this.startGame());this.cards.forEach((card,index)=>card.addEventListener('click',()=>this.answer(index)));
    this.next.addEventListener('click',()=>this.nextRound());document.getElementById('cancel-load').addEventListener('click',()=>this.resetGame());document.getElementById('back-start').addEventListener('click',()=>this.resetGame());document.getElementById('play-again').addEventListener('click',()=>this.resetGame());document.getElementById('copy-link').addEventListener('click',()=>this.shareQuiz());
    const params=new URLSearchParams(location.search);if(params.get('preset')){const preset=Categories.getPreset(params.get('preset'));if(preset)this.startWithPreset(preset.slug);else this.message('That preset is unavailable. Choose one below.');}
    else if(params.get('cat1')&&params.get('cat2'))this.start(Categories.resolve(params.get('cat1')),Categories.resolve(params.get('cat2')),null);
  },
  showScreen(name) { ['start','loading','game'].forEach(id=>document.getElementById(id+'-screen').classList.toggle('hidden',id!==name)); },
  message(text){this.status.textContent=text;},
  startWithPreset(slug){const p=Categories.getPreset(slug);if(p)this.start(p.category1,p.category2,slug);},
  startGame(){this.start(Categories.resolve(document.getElementById('category1').value),Categories.resolve(document.getElementById('category2').value),null);},
  async start(a,b,preset) {
    if(!Categories.compatible(a,b)){this.showScreen('start');this.message('Choose two different listed categories from the same subject group: artists, art movements, ancient cultures, cathedral styles, fashion decades or elephant species.');return;}
    const token=++this.token;this.locked=true;this.category1=a;this.category2=b;this.currentPresetSlug=preset;this.currentRound=0;this.score=0;this.history.replaceChildren();this.message('');document.getElementById('share-status').textContent='';document.getElementById('result').hidden=true;this.showScreen('loading');
    const first=Wikimedia.shuffleArray(Wikimedia.forCategory(a));const second=Wikimedia.shuffleArray(Wikimedia.forCategory(b));
    if(first.length<this.totalRounds||second.length<this.totalRounds){this.showScreen('start');this.message('This pair does not yet have enough checked images. Choose another pair.');return;}
    const ids=new Set(first.map(i=>i.source));if(second.some(i=>ids.has(i.source))){this.showScreen('start');this.message('Those image sets overlap. Choose another pair so each answer is unambiguous.');return;}
    this.rounds=Array.from({length:this.totalRounds},(_,i)=>[first[i],second[i]]);const images=this.rounds.flat();let loaded=0;
    document.getElementById('progress-bar').style.width='0%';document.getElementById('loading-count').textContent=`0 / ${images.length} images`;
    const available=await Promise.all(images.map(async image=>{const ok=await Wikimedia.validateImage(image.url);if(token===this.token){loaded++;document.getElementById('progress-bar').style.width=`${loaded/images.length*100}%`;document.getElementById('loading-count').textContent=`${loaded} / ${images.length} images`;}return ok;}));
    if(token!==this.token)return;
    if(available.some(ok=>!ok)){this.showScreen('start');this.message('Some images could not load. No answers were scored. Check your connection and try again, or choose another pair.');return;}
    this.showScreen('game');document.getElementById('active-round').hidden=false;await this.nextRound();
  },
  async nextRound() {
    if(this.currentRound>0 && this.next.hidden)return;
    this.locked=true;this.cards.forEach(c=>{c.disabled=true;c.classList.remove('correct','incorrect');});this.next.hidden=true;this.feedback.textContent='';this.credits.replaceChildren();document.getElementById('credit-details').open=false;
    if(this.currentRound>=this.totalRounds){this.finish();return;}
    const [a,b]=this.rounds[this.currentRound];this.correctIndex=Math.random()<0.5?0:1;this.pair=this.correctIndex===0?[a,b]:[b,a];this.currentRound++;
    document.getElementById('round-counter').textContent=`Round ${this.currentRound} of ${this.totalRounds}`;document.getElementById('score-display').textContent=`Score: ${this.score}`;
    document.getElementById('target-label').textContent=Catalogue.categories[this.category1].label;document.getElementById('other-label').textContent=Catalogue.categories[this.category2].label;
    this.pair.forEach((image,index)=>{const img=document.getElementById('image-'+index);img.alt=`Option ${index+1}`;img.src=image.url;const credit=document.createElement('section');const h=document.createElement('h3');h.textContent=`Option ${index+1}`;credit.append(h,Wikimedia.credit(image));this.credits.append(credit);});
    const token=this.token;const ok=await Promise.all(this.pair.map(image=>Wikimedia.validateImage(image.url)));
    if(token!==this.token)return;
    if(ok.some(value=>!value)){this.showScreen('start');this.message('A round image became unavailable. The round was not scored. Please start again.');return;}
    this.locked=false;this.cards.forEach(c=>c.disabled=false);document.getElementById('active-round').scrollIntoView({block:'start'});this.cards[0].focus({preventScroll:true});
  },
  answer(index) {
    if(this.locked||!this.pair.length)return;this.locked=true;this.cards.forEach(c=>c.disabled=true);
    const correct=index===this.correctIndex;if(correct)this.score++;
    this.cards[this.correctIndex].classList.add('correct');if(!correct)this.cards[index].classList.add('incorrect');
    this.feedback.textContent=correct?'Correct.':'Not quite — the green outline shows the correct image.';document.getElementById('score-display').textContent=`Score: ${this.score}`;document.getElementById('credit-details').open=true;
    const row=document.createElement('article');row.className='history-round';const h=document.createElement('h3');h.textContent=`Round ${this.currentRound}: ${correct?'correct':'incorrect'}`;row.append(h);const grid=document.createElement('div');grid.className='history-images';
    this.pair.forEach((image,i)=>{const card=document.createElement('div');card.className='history-card';if(i===index)card.classList.add('chosen',correct?'correct':'wrong');const img=document.createElement('img');img.src=image.url;img.alt=image.title;card.append(img,Wikimedia.credit(image));grid.append(card);});row.append(grid);this.history.prepend(row);
    this.next.textContent=this.currentRound===this.totalRounds?'See results':'Next round';this.next.hidden=false;this.next.focus();
  },
  finish() { document.getElementById('active-round').hidden=true;const result=document.getElementById('result');result.hidden=false;document.getElementById('final-score').textContent=`${this.score} / ${this.totalRounds}`;result.focus(); },
  resetGame(){++this.token;this.locked=true;this.pair=[];this.showScreen('start');this.message('');window.scrollTo({top:0});},
  getShareUrl(){const base=location.origin+location.pathname;return this.currentPresetSlug?`${base}?preset=${encodeURIComponent(this.currentPresetSlug)}`:`${base}?cat1=${encodeURIComponent(this.category1)}&cat2=${encodeURIComponent(this.category2)}`;},
  async shareQuiz(){try{await navigator.clipboard.writeText(this.getShareUrl());document.getElementById('share-status').textContent='Link copied.';}catch{const node=document.getElementById('share-status');node.replaceChildren();const a=document.createElement('a');a.href=this.getShareUrl();a.textContent='Open or copy this quiz link';node.append(a);}}
};
document.addEventListener('DOMContentLoaded',()=>Game.init());
