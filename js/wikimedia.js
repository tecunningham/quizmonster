// Wikimedia Commons API client
const Wikimedia = {
    API_URL: 'https://commons.wikimedia.org/w/api.php',
    imageCache: new Map(),

    // Search for images on Wikimedia Commons
    async searchImages(query, limit = 20) {
        const params = new URLSearchParams({
            action: 'query',
            generator: 'search',
            gsrnamespace: '6', // File namespace
            gsrsearch: query,
            gsrlimit: limit.toString(),
            prop: 'imageinfo',
            iiprop: 'url|size|mime',
            iiurlwidth: '600',
            format: 'json',
            origin: '*'
        });

        try {
            const response = await fetch(`${this.API_URL}?${params}`);
            const data = await response.json();

            if (!data.query || !data.query.pages) {
                return [];
            }

            const images = Object.values(data.query.pages)
                .filter(page => {
                    const info = page.imageinfo?.[0];
                    if (!info) return false;
                    // Filter for actual images (not SVG, PDF, etc.)
                    const mime = info.mime || '';
                    if (!mime.startsWith('image/') || mime.includes('svg')) return false;
                    if (info.width < 200 || info.height < 200) return false;
                    // Filter out extreme aspect ratios (between 1:2.5 and 2.5:1)
                    const aspectRatio = info.width / info.height;
                    if (aspectRatio < 0.4 || aspectRatio > 2.5) return false;
                    return true;
                })
                .map(page => ({
                    title: page.title,
                    url: page.imageinfo[0].thumburl || page.imageinfo[0].url,
                    originalUrl: page.imageinfo[0].url,
                    width: page.imageinfo[0].width,
                    height: page.imageinfo[0].height
                }));

            return images;
        } catch (error) {
            console.error('Wikimedia search error:', error);
            return [];
        }
    },

    // Validate that an image URL loads successfully
    validateImage(url) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = url;
        });
    },

    // Get validated images for a query
    async getValidatedImages(query, count = 5, onProgress = null) {
        // Check cache first
        const cacheKey = query.toLowerCase();
        if (this.imageCache.has(cacheKey)) {
            const cached = this.imageCache.get(cacheKey);
            if (cached.length >= count) {
                // Report all as found immediately from cache
                if (onProgress) {
                    for (let i = 0; i < count; i++) {
                        onProgress();
                    }
                }
                // Return shuffled subset
                return this.shuffleArray([...cached]).slice(0, count);
            }
        }

        // Fetch more images than needed to account for broken ones
        const candidates = await this.searchImages(query, count * 4);
        const validated = [];

        for (const img of candidates) {
            if (validated.length >= count) break; // Stop once we have enough

            const isValid = await this.validateImage(img.url);
            if (isValid) {
                validated.push(img);
                if (onProgress) {
                    onProgress();
                }
            }
        }

        // Update cache
        this.imageCache.set(cacheKey, validated);

        return validated.slice(0, count);
    },

    // Get a single random validated image for a query
    async getRandomImage(query) {
        const images = await this.getValidatedImages(query, 5);
        if (images.length === 0) {
            return null;
        }
        return images[Math.floor(Math.random() * images.length)];
    },

    // Shuffle array helper
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    },

    // Clear the image cache
    clearCache() {
        this.imageCache.clear();
    }
};
