'use strict';
const list=document.getElementById('all-credits');
Object.entries(Catalogue.categories).forEach(([id,cat])=>{const section=document.createElement('section');const h=document.createElement('h2');h.textContent=cat.label;section.append(h);Catalogue.images.filter(image=>image.category===id).forEach(image=>section.append(Wikimedia.credit(image)));list.append(section);});
