// Curated categories. Existing preset slugs remain valid.
const Categories = {
  presets: [
    {slug:'aztec-maya',name:'Aztec vs Maya Architecture',category1:'aztec',category2:'maya'},
    {slug:'vangogh-monet',name:'Van Gogh vs Monet',category1:'vangogh',category2:'monet'},
    {slug:'1920s-1950s-fashion',name:'1920s vs 1950s Fashion',category1:'fashion1920',category2:'fashion1950'},
    {slug:'baroque-renaissance',name:'Baroque vs Renaissance Art',category1:'baroque',category2:'renaissance'},
    {slug:'african-asian-elephants',name:'African vs Asian Elephants',category1:'african',category2:'asian'},
    {slug:'gothic-romanesque',name:'Gothic vs Romanesque Architecture',category1:'gothic',category2:'romanesque'},
    {slug:'impressionism-expressionism',name:'Impressionism vs Expressionism',category1:'impressionism',category2:'expressionism'},
    {slug:'rome-greece',name:'Ancient Rome vs Ancient Greece',category1:'rome',category2:'greece'}
  ],
  getPreset(key) { return this.presets.find(p => p.slug === key) || null; },
  resolve(value) {
    const key = String(value || '').trim().toLowerCase();
    return Object.entries(Catalogue.categories).find(([id, cat]) => id === key || cat.label.toLowerCase() === key || (cat.aliases || []).some(alias => alias.toLowerCase() === key))?.[0] || null;
  },
  compatible(a,b) { return a && b && a !== b && Catalogue.categories[a].family === Catalogue.categories[b].family; }
};
