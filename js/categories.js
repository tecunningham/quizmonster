// Preset category pairs for QuizMonster
const Categories = {
    presets: [
        {
            slug: 'aztec-maya',
            name: 'Aztec vs Maya Architecture',
            category1: 'Aztec pyramid temple',
            category2: 'Maya pyramid temple'
        },
        {
            slug: 'vangogh-monet',
            name: 'Van Gogh vs Monet',
            category1: 'Vincent van Gogh painting',
            category2: 'Claude Monet painting'
        },
        {
            slug: '1920s-1950s-fashion',
            name: '1920s vs 1950s Fashion',
            category1: '1920s fashion clothing',
            category2: '1950s fashion clothing'
        },
        {
            slug: 'baroque-renaissance',
            name: 'Baroque vs Renaissance Art',
            category1: 'Baroque painting art',
            category2: 'Renaissance painting art'
        },
        {
            slug: 'african-asian-elephants',
            name: 'African vs Asian Elephants',
            category1: 'African elephant',
            category2: 'Asian elephant'
        },
        {
            slug: 'gothic-romanesque',
            name: 'Gothic vs Romanesque Architecture',
            category1: 'Gothic cathedral architecture',
            category2: 'Romanesque church architecture'
        },
        {
            slug: 'impressionism-expressionism',
            name: 'Impressionism vs Expressionism',
            category1: 'Impressionist painting',
            category2: 'Expressionist painting'
        },
        {
            slug: 'rome-greece',
            name: 'Ancient Rome vs Ancient Greece',
            category1: 'Ancient Roman architecture ruins',
            category2: 'Ancient Greek temple ruins'
        }
    ],

    // Get all preset names for buttons
    getPresetNames() {
        return this.presets.map((p, index) => ({
            index,
            slug: p.slug,
            name: p.name
        }));
    },

    // Get a preset by slug or index
    getPreset(key) {
        if (typeof key === 'number') {
            return this.presets[key] || null;
        }
        return this.presets.find(p => p.slug === key) || null;
    },

    // Format category labels for display (shorter version)
    formatLabel(category) {
        // Remove common search terms for cleaner display
        return category
            .replace(/\s*(painting|art|architecture|temple|ruins|clothing)\s*/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }
};
