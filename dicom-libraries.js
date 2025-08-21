/**
 * DICOM Libraries Loader with CDN Fallback
 * Loads external libraries with local fallback capability
 */

class LibraryLoader {
    constructor() {
        this.libraries = {
            cornerstone: {
                url: 'https://cdn.jsdelivr.net/npm/cornerstone-core@2.6.1/dist/cornerstone.min.js',
                fallback: null, // Can be set to local path
                loaded: false
            },
            cornerstoneTools: {
                url: 'https://cdn.jsdelivr.net/npm/cornerstone-tools@6.0.10/dist/cornerstoneTools.min.js',
                fallback: null,
                loaded: false,
                dependencies: ['cornerstone']
            },
            dicomParser: {
                url: 'https://cdn.jsdelivr.net/npm/dicom-parser@1.8.21/dist/dicomParser.min.js',
                fallback: null,
                loaded: false
            },
            cornerstoneWADOImageLoader: {
                url: 'https://cdn.jsdelivr.net/npm/cornerstone-wado-image-loader@4.13.2/dist/cornerstoneWADOImageLoader.bundle.min.js',
                fallback: null,
                loaded: false,
                dependencies: ['cornerstone', 'dicomParser']
            }
        };
        
        this.loadPromises = new Map();
    }

    async loadScript(url, fallbackUrl = null) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.async = true;
            
            script.onload = () => resolve(true);
            script.onerror = () => {
                console.warn(`Failed to load from CDN: ${url}`);
                
                if (fallbackUrl) {
                    console.log(`Attempting fallback: ${fallbackUrl}`);
                    const fallbackScript = document.createElement('script');
                    fallbackScript.src = fallbackUrl;
                    fallbackScript.async = true;
                    
                    fallbackScript.onload = () => {
                        console.log(`Successfully loaded fallback: ${fallbackUrl}`);
                        resolve(true);
                    };
                    fallbackScript.onerror = () => {
                        console.error(`Failed to load fallback: ${fallbackUrl}`);
                        reject(new Error(`Failed to load ${url} and fallback ${fallbackUrl}`));
                    };
                    
                    document.head.appendChild(fallbackScript);
                } else {
                    reject(new Error(`Failed to load ${url} and no fallback provided`));
                }
            };
            
            document.head.appendChild(script);
        });
    }

    async loadLibrary(libraryName) {
        if (this.loadPromises.has(libraryName)) {
            return this.loadPromises.get(libraryName);
        }

        const library = this.libraries[libraryName];
        if (!library) {
            throw new Error(`Unknown library: ${libraryName}`);
        }

        const loadPromise = this._loadLibraryWithDependencies(libraryName);
        this.loadPromises.set(libraryName, loadPromise);
        
        return loadPromise;
    }

    async _loadLibraryWithDependencies(libraryName) {
        const library = this.libraries[libraryName];
        
        // Load dependencies first
        if (library.dependencies) {
            for (const dep of library.dependencies) {
                await this.loadLibrary(dep);
            }
        }

        // Load the library itself
        if (!library.loaded) {
            try {
                await this.loadScript(library.url, library.fallback);
                library.loaded = true;
                console.log(`Successfully loaded: ${libraryName}`);
            } catch (error) {
                console.error(`Failed to load library ${libraryName}:`, error);
                throw error;
            }
        }

        return true;
    }

    async loadAllLibraries() {
        const libraryNames = Object.keys(this.libraries);
        const loadPromises = libraryNames.map(name => this.loadLibrary(name));
        
        try {
            await Promise.all(loadPromises);
            console.log('All DICOM libraries loaded successfully');
            return true;
        } catch (error) {
            console.error('Failed to load some libraries:', error);
            // Continue with partial functionality
            return false;
        }
    }

    isLibraryLoaded(libraryName) {
        return this.libraries[libraryName]?.loaded || false;
    }

    // Check if core DICOM functionality is available
    isDicomReady() {
        return this.isLibraryLoaded('cornerstone') && 
               this.isLibraryLoaded('dicomParser') &&
               this.isLibraryLoaded('cornerstoneWADOImageLoader');
    }

    // Set fallback URLs for offline functionality
    setFallbacks(fallbackUrls) {
        Object.keys(fallbackUrls).forEach(libraryName => {
            if (this.libraries[libraryName]) {
                this.libraries[libraryName].fallback = fallbackUrls[libraryName];
            }
        });
    }
}

// Initialize the library loader
window.libraryLoader = new LibraryLoader();

// Optional: Set fallback URLs if you have local copies
// window.libraryLoader.setFallbacks({
//     cornerstone: './libs/cornerstone.min.js',
//     cornerstoneTools: './libs/cornerstoneTools.min.js',
//     dicomParser: './libs/dicomParser.min.js',
//     cornerstoneWADOImageLoader: './libs/cornerstoneWADOImageLoader.bundle.min.js'
// });

// Auto-load libraries when this script is included
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Loading DICOM libraries...');
    try {
        await window.libraryLoader.loadAllLibraries();
        
        // Initialize cornerstone after libraries are loaded
        if (window.libraryLoader.isDicomReady()) {
            // Configure cornerstone
            if (window.cornerstone && window.cornerstoneWADOImageLoader) {
                cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
                cornerstoneWADOImageLoader.external.dicomParser = dicomParser;
                
                // Configure the image loader
                const config = {
                    maxWebWorkers: navigator.hardwareConcurrency || 1,
                    startWebWorkersOnDemand: true,
                    taskConfiguration: {
                        decodeTask: {
                            loadCodecsOnStartup: true,
                            initializeCodecsOnStartup: false,
                            codecsPath: 'https://cdn.jsdelivr.net/npm/cornerstone-wado-image-loader@4.13.2/dist/dynamic-import/',
                            usePDFJS: false
                        }
                    }
                };
                
                cornerstoneWADOImageLoader.webWorkerManager.initialize(config);
                
                // Dispatch custom event to notify that DICOM is ready
                window.dispatchEvent(new CustomEvent('dicomReady'));
                console.log('DICOM libraries initialized successfully');
            }
        } else {
            console.warn('DICOM functionality may be limited - some libraries failed to load');
            // Dispatch event for partial functionality
            window.dispatchEvent(new CustomEvent('dicomPartialReady'));
        }
    } catch (error) {
        console.error('Failed to initialize DICOM libraries:', error);
        // Dispatch event for fallback mode
        window.dispatchEvent(new CustomEvent('dicomFallback'));
    }
});

// Utility function to check if DICOM features are available
window.checkDicomSupport = function() {
    return {
        cornerstone: typeof window.cornerstone !== 'undefined',
        cornerstoneTools: typeof window.cornerstoneTools !== 'undefined',
        dicomParser: typeof window.dicomParser !== 'undefined',
        wadoImageLoader: typeof window.cornerstoneWADOImageLoader !== 'undefined',
        fullSupport: window.libraryLoader?.isDicomReady() || false
    };
};