/**
 * DICOM Viewer Component - Pure JavaScript Implementation
 * Supports DICOM, Image, and Video viewing with advanced features
 */

class DicomViewerComponent {
    constructor(containerId = 'dicomViewerContainer') {
        this.containerId = containerId;
        this.mediaItems = [];
        this.currentMedia = null;
        this.comments = {};
        this.bookmarks = new Set();
        this.currentTab = 'all';
        
        // DICOM specific properties
        this.dicomReady = false;
        this.cornerstoneElement = null;
        this.currentImage = null;
        
        this.init();
    }

    async init() {
        console.log('Initializing DICOM Viewer Component...');
        
        // Wait for DICOM libraries to load
        this.setupDicomEvents();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load initial data
        this.loadMediaItems();
        this.renderMediaGrid();
        
        console.log('DICOM Viewer Component initialized');
    }

    setupDicomEvents() {
        // Listen for DICOM library loading events
        window.addEventListener('dicomReady', () => {
            this.dicomReady = true;
            this.initializeCornerstone();
            console.log('DICOM functionality ready');
        });

        window.addEventListener('dicomPartialReady', () => {
            console.warn('DICOM functionality partially available');
        });

        window.addEventListener('dicomFallback', () => {
            console.warn('DICOM functionality not available - using fallback mode');
        });
    }

    initializeCornerstone() {
        if (!window.cornerstone) return;

        try {
            // Initialize cornerstone element
            const viewport = document.getElementById('dicomViewport');
            if (viewport) {
                cornerstone.enable(viewport);
                this.cornerstoneElement = viewport;
                
                // Add event listeners for DICOM interactions
                viewport.addEventListener('cornerstoneimagerendered', (e) => {
                    this.updateDicomControls(e.detail);
                });
            }
        } catch (error) {
            console.error('Failed to initialize cornerstone:', error);
        }
    }

    setupEventListeners() {
        // Upload button
        const uploadBtn = document.getElementById('uploadBtn');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => this.openUploadModal());
        }

        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Upload modal events
        this.setupUploadModalEvents();
        
        // Viewer modal events
        this.setupViewerModalEvents();
    }

    setupUploadModalEvents() {
        const uploadModal = document.getElementById('uploadModal');
        const closeUploadBtn = document.getElementById('closeUploadBtn');
        const nextStepBtn = document.getElementById('nextStepBtn');
        const backStepBtn = document.getElementById('backStepBtn');
        const uploadFileBtn = document.getElementById('uploadFileBtn');
        const fileInput = document.getElementById('fileInput');
        const fileUploadArea = document.getElementById('fileUploadArea');

        // Close modal
        if (closeUploadBtn) {
            closeUploadBtn.addEventListener('click', () => this.closeUploadModal());
        }

        // File type selection
        document.querySelectorAll('input[name="fileType"]').forEach(radio => {
            radio.addEventListener('change', () => {
                nextStepBtn.disabled = false;
                this.updateFileInputAccept(radio.value);
            });
        });

        // Navigation
        if (nextStepBtn) {
            nextStepBtn.addEventListener('click', () => this.nextUploadStep());
        }
        
        if (backStepBtn) {
            backStepBtn.addEventListener('click', () => this.previousUploadStep());
        }

        // File selection
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileSelection(e));
        }

        // Drag and drop
        if (fileUploadArea) {
            fileUploadArea.addEventListener('click', () => fileInput.click());
            fileUploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                fileUploadArea.classList.add('drag-over');
            });
            fileUploadArea.addEventListener('dragleave', () => {
                fileUploadArea.classList.remove('drag-over');
            });
            fileUploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                fileUploadArea.classList.remove('drag-over');
                this.handleFileDrop(e);
            });
        }

        // Upload file
        if (uploadFileBtn) {
            uploadFileBtn.addEventListener('click', () => this.uploadFile());
        }

        // Form validation
        const titleInput = document.getElementById('mediaTitle');
        if (titleInput) {
            titleInput.addEventListener('input', () => this.validateUploadForm());
        }
    }

    setupViewerModalEvents() {
        const viewerModal = document.getElementById('viewerModal');
        const closeViewerBtn = document.getElementById('closeViewerBtn');
        const bookmarkBtn = document.getElementById('bookmarkBtn');
        const addCommentBtn = document.getElementById('addCommentBtn');

        // Close viewer
        if (closeViewerBtn) {
            closeViewerBtn.addEventListener('click', () => this.closeViewer());
        }

        // Click outside to close
        if (viewerModal) {
            viewerModal.addEventListener('click', (e) => {
                if (e.target === viewerModal) {
                    this.closeViewer();
                }
            });
        }

        // Bookmark toggle
        if (bookmarkBtn) {
            bookmarkBtn.addEventListener('click', () => this.toggleBookmark());
        }

        // Add comment
        if (addCommentBtn) {
            addCommentBtn.addEventListener('click', () => this.addComment());
        }

        // DICOM controls
        this.setupDicomControls();
    }

    setupDicomControls() {
        const windowLevel = document.getElementById('windowLevel');
        const windowWidth = document.getElementById('windowWidth');
        const zoomControl = document.getElementById('zoomControl');
        const resetBtn = document.getElementById('resetBtn');
        const invertBtn = document.getElementById('invertBtn');

        if (windowLevel) {
            windowLevel.addEventListener('input', (e) => this.adjustWindowLevel(e.target.value));
        }
        
        if (windowWidth) {
            windowWidth.addEventListener('input', (e) => this.adjustWindowWidth(e.target.value));
        }
        
        if (zoomControl) {
            zoomControl.addEventListener('input', (e) => this.adjustZoom(e.target.value));
        }
        
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetDicomView());
        }
        
        if (invertBtn) {
            invertBtn.addEventListener('click', () => this.invertDicomImage());
        }
    }

    // Media Management
    loadMediaItems() {
        // In a real application, this would fetch from a server
        // For now, we'll use localStorage to persist data
        const stored = localStorage.getItem('dicomViewerMedia');
        if (stored) {
            this.mediaItems = JSON.parse(stored);
        }

        const storedComments = localStorage.getItem('dicomViewerComments');
        if (storedComments) {
            this.comments = JSON.parse(storedComments);
        }

        const storedBookmarks = localStorage.getItem('dicomViewerBookmarks');
        if (storedBookmarks) {
            this.bookmarks = new Set(JSON.parse(storedBookmarks));
        }

        // Add some sample data if empty
        if (this.mediaItems.length === 0) {
            this.addSampleData();
        }
    }

    addSampleData() {
        const sampleItems = [
            {
                id: 'sample-1',
                title: 'Knee X-Ray',
                description: 'X-ray 2 days after the injury',
                type: 'xray',
                fileType: 'image/jpeg',
                uploadDate: new Date(Date.now() - 86400000 * 2).toISOString(),
                thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iIzM0MzQ0MCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPktORUUgWC1SQVk8L3RleHQ+PC9zdmc+',
                url: null
            },
            {
                id: 'sample-2',
                title: 'Recovery Progress',
                description: 'Week 2 progress video',
                type: 'video',
                fileType: 'video/mp4',
                uploadDate: new Date(Date.now() - 86400000 * 7).toISOString(),
                thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iIzMzNGE2ZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPi4hKG1wNCkgVklERU88L3RleHQ+PC9zdmc+',
                url: null
            }
        ];

        this.mediaItems = sampleItems;
        this.saveMediaItems();
    }

    saveMediaItems() {
        localStorage.setItem('dicomViewerMedia', JSON.stringify(this.mediaItems));
        localStorage.setItem('dicomViewerComments', JSON.stringify(this.comments));
        localStorage.setItem('dicomViewerBookmarks', JSON.stringify([...this.bookmarks]));
    }

    renderMediaGrid() {
        const grid = document.getElementById('mediaGrid');
        if (!grid) return;

        const filteredItems = this.getFilteredItems();
        
        if (filteredItems.length === 0) {
            grid.innerHTML = `
                <div class="loading">
                    <p>No media files found. Click "Send Link" to upload your first file.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = filteredItems.map(item => this.createMediaItemHTML(item)).join('');
        
        // Add click listeners to media items
        grid.querySelectorAll('.media-item').forEach(item => {
            item.addEventListener('click', () => {
                const mediaId = item.dataset.mediaId;
                this.openViewer(mediaId);
            });
        });
        
        this.updateTabCounts();
    }

    getFilteredItems() {
        let items = [...this.mediaItems];
        
        if (this.currentTab === 'bookmarked') {
            items = items.filter(item => this.bookmarks.has(item.id));
        }
        
        // Sort by date (most recent first)
        items.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
        
        return items;
    }

    createMediaItemHTML(item) {
        const isBookmarked = this.bookmarks.has(item.id);
        const uploadDate = new Date(item.uploadDate).toLocaleDateString();
        const fileTypeIcon = this.getFileTypeIcon(item.type);
        
        return `
            <div class="media-item" data-media-id="${item.id}">
                <div class="media-thumbnail">
                    ${item.thumbnail 
                        ? `<img src="${item.thumbnail}" alt="${item.title}">`
                        : `<i class="${fileTypeIcon}"></i>`
                    }
                    ${isBookmarked ? '<i class="fas fa-bookmark bookmark-indicator"></i>' : ''}
                </div>
                <div class="media-info">
                    <div class="media-title">${item.title}</div>
                    <div class="media-metadata">${uploadDate} • ${item.type.toUpperCase()}</div>
                    <div class="media-description">${item.description || 'No description'}</div>
                    <div class="media-actions">
                        <button class="btn btn-sm btn-secondary">
                            <i class="fas fa-eye"></i>
                            View
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    getFileTypeIcon(type) {
        const icons = {
            dicom: 'fas fa-x-ray',
            xray: 'fas fa-bone',
            image: 'fas fa-image',
            video: 'fas fa-video'
        };
        return icons[type] || 'fas fa-file';
    }

    updateTabCounts() {
        const allCount = document.getElementById('allCount');
        const bookmarkedCount = document.getElementById('bookmarkedCount');
        
        if (allCount) {
            allCount.textContent = this.mediaItems.length;
        }
        
        if (bookmarkedCount) {
            bookmarkedCount.textContent = this.bookmarks.size;
        }
    }

    switchTab(tab) {
        this.currentTab = tab;
        
        // Update active tab
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        
        this.renderMediaGrid();
    }

    // Upload Modal Methods
    openUploadModal() {
        const modal = document.getElementById('uploadModal');
        if (modal) {
            modal.classList.add('active');
            this.resetUploadForm();
        }
    }

    closeUploadModal() {
        const modal = document.getElementById('uploadModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    resetUploadForm() {
        // Reset to step 1
        document.getElementById('uploadStep1').style.display = 'block';
        document.getElementById('uploadStep2').style.display = 'none';
        
        // Clear form
        document.querySelectorAll('input[name="fileType"]').forEach(radio => {
            radio.checked = false;
        });
        
        document.getElementById('nextStepBtn').disabled = true;
        document.getElementById('mediaTitle').value = '';
        document.getElementById('mediaDescription').value = '';
        document.getElementById('fileInput').value = '';
        document.getElementById('uploadFileBtn').disabled = true;
    }

    updateFileInputAccept(fileType) {
        const fileInput = document.getElementById('fileInput');
        const accepts = {
            dicom: '.dcm,.dicom',
            xray: '.jpg,.jpeg,.png',
            image: '.jpg,.jpeg,.png',
            video: '.mp4,.avi,.mov'
        };
        
        if (fileInput) {
            fileInput.accept = accepts[fileType] || '*';
        }
    }

    nextUploadStep() {
        document.getElementById('uploadStep1').style.display = 'none';
        document.getElementById('uploadStep2').style.display = 'block';
    }

    previousUploadStep() {
        document.getElementById('uploadStep1').style.display = 'block';
        document.getElementById('uploadStep2').style.display = 'none';
    }

    handleFileSelection(event) {
        const file = event.target.files[0];
        if (file) {
            this.selectedFile = file;
            this.validateUploadForm();
            this.generateThumbnail(file);
        }
    }

    handleFileDrop(event) {
        const file = event.dataTransfer.files[0];
        if (file) {
            document.getElementById('fileInput').files = event.dataTransfer.files;
            this.handleFileSelection({ target: { files: [file] } });
        }
    }

    generateThumbnail(file) {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                // Create thumbnail preview in upload area
                const uploadZone = document.querySelector('.upload-zone');
                uploadZone.innerHTML = `
                    <img src="${e.target.result}" style="max-width: 200px; max-height: 150px; object-fit: contain;">
                    <p>File selected: ${file.name}</p>
                    <p>Click to select a different file</p>
                `;
            };
            reader.readAsDataURL(file);
        } else {
            const uploadZone = document.querySelector('.upload-zone');
            uploadZone.innerHTML = `
                <i class="fas fa-file-upload"></i>
                <p>File selected: ${file.name}</p>
                <p>Click to select a different file</p>
            `;
        }
    }

    validateUploadForm() {
        const title = document.getElementById('mediaTitle').value.trim();
        const hasFile = this.selectedFile;
        
        const uploadBtn = document.getElementById('uploadFileBtn');
        if (uploadBtn) {
            uploadBtn.disabled = !title || !hasFile;
        }
    }

    async uploadFile() {
        const title = document.getElementById('mediaTitle').value.trim();
        const description = document.getElementById('mediaDescription').value.trim();
        const fileType = document.querySelector('input[name="fileType"]:checked').value;
        
        if (!this.selectedFile || !title) return;

        // Create new media item
        const mediaItem = {
            id: 'media-' + Date.now(),
            title,
            description,
            type: fileType,
            fileType: this.selectedFile.type,
            uploadDate: new Date().toISOString(),
            thumbnail: null,
            url: null // In real app, this would be uploaded to server
        };

        // Generate thumbnail for display
        if (this.selectedFile.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                mediaItem.thumbnail = e.target.result;
                this.addMediaItem(mediaItem);
            };
            reader.readAsDataURL(this.selectedFile);
        } else {
            this.addMediaItem(mediaItem);
        }
    }

    addMediaItem(item) {
        this.mediaItems.unshift(item); // Add to beginning
        this.saveMediaItems();
        this.renderMediaGrid();
        this.closeUploadModal();
        
        // Show success message
        this.showNotification('File uploaded successfully!', 'success');
    }

    // Viewer Methods
    openViewer(mediaId) {
        const media = this.mediaItems.find(item => item.id === mediaId);
        if (!media) return;

        this.currentMedia = media;
        const modal = document.getElementById('viewerModal');
        if (modal) {
            modal.classList.add('active');
            this.setupViewer(media);
            this.loadComments(mediaId);
            this.updateBookmarkButton();
        }
    }

    closeViewer() {
        const modal = document.getElementById('viewerModal');
        if (modal) {
            modal.classList.remove('active');
        }
        
        // Clean up DICOM viewer
        if (this.cornerstoneElement && window.cornerstone) {
            try {
                cornerstone.disable(this.cornerstoneElement);
                cornerstone.enable(this.cornerstoneElement);
            } catch (error) {
                console.log('Error cleaning up cornerstone:', error);
            }
        }
        
        this.currentMedia = null;
    }

    setupViewer(media) {
        // Update viewer title and metadata
        document.getElementById('viewerTitle').textContent = media.title;
        document.getElementById('viewerMetadata').textContent = 
            `${media.type.toUpperCase()} • ${new Date(media.uploadDate).toLocaleDateString()}`;

        // Hide all viewers first
        document.getElementById('dicomViewport').style.display = 'none';
        document.getElementById('imageViewer').style.display = 'none';
        document.getElementById('videoViewer').style.display = 'none';
        document.getElementById('dicomControls').style.display = 'none';

        // Show appropriate viewer based on media type
        if (media.type === 'dicom' && this.dicomReady) {
            this.setupDicomViewer(media);
        } else if (media.type === 'video') {
            this.setupVideoViewer(media);
        } else {
            this.setupImageViewer(media);
        }
    }

    setupDicomViewer(media) {
        if (!this.dicomReady || !window.cornerstone) {
            this.showNotification('DICOM viewer not available. Displaying as image.', 'warning');
            this.setupImageViewer(media);
            return;
        }

        const viewport = document.getElementById('dicomViewport');
        viewport.style.display = 'block';
        document.getElementById('dicomControls').style.display = 'flex';

        // In a real application, you would load the DICOM file here
        // For demo purposes, we'll show a placeholder
        try {
            // This is where you would load actual DICOM data
            // const imageId = 'wadouri:' + media.url;
            // cornerstone.loadImage(imageId).then(image => {
            //     cornerstone.displayImage(viewport, image);
            // });
            
            // Demo placeholder
            this.showDicomPlaceholder(viewport);
        } catch (error) {
            console.error('Error loading DICOM:', error);
            this.setupImageViewer(media);
        }
    }

    showDicomPlaceholder(viewport) {
        // Create a demo DICOM-like display
        viewport.innerHTML = `
            <div style="width: 100%; height: 100%; background: #000; display: flex; align-items: center; justify-content: center; color: white; flex-direction: column;">
                <i class="fas fa-x-ray" style="font-size: 120px; margin-bottom: 20px; opacity: 0.5;"></i>
                <h3>DICOM Viewer</h3>
                <p>This is where the DICOM image would be displayed</p>
                <p style="font-size: 12px; opacity: 0.7; margin-top: 10px;">Load actual DICOM files to see medical imaging</p>
            </div>
        `;
    }

    setupImageViewer(media) {
        const imageViewer = document.getElementById('imageViewer');
        imageViewer.style.display = 'block';
        
        if (media.thumbnail) {
            imageViewer.src = media.thumbnail;
        } else {
            // Show placeholder
            imageViewer.style.display = 'none';
            const container = imageViewer.parentElement;
            container.innerHTML += `
                <div style="width: 100%; height: 100%; background: #f3f4f6; display: flex; align-items: center; justify-content: center; color: #6b7280; flex-direction: column;">
                    <i class="${this.getFileTypeIcon(media.type)}" style="font-size: 120px; margin-bottom: 20px;"></i>
                    <h3>${media.title}</h3>
                    <p>Image preview not available</p>
                </div>
            `;
        }
    }

    setupVideoViewer(media) {
        const videoViewer = document.getElementById('videoViewer');
        videoViewer.style.display = 'block';
        
        if (media.url) {
            videoViewer.src = media.url;
        } else {
            // Show placeholder
            videoViewer.style.display = 'none';
            const container = videoViewer.parentElement;
            container.innerHTML += `
                <div style="width: 100%; height: 100%; background: #1f2937; display: flex; align-items: center; justify-content: center; color: white; flex-direction: column;">
                    <i class="fas fa-video" style="font-size: 120px; margin-bottom: 20px; opacity: 0.5;"></i>
                    <h3>${media.title}</h3>
                    <p>Video player would load here</p>
                </div>
            `;
        }
    }

    // DICOM Control Methods
    adjustWindowLevel(value) {
        document.getElementById('windowLevelValue').textContent = value;
        // Apply to cornerstone if available
        if (this.cornerstoneElement && window.cornerstone) {
            const viewport = cornerstone.getViewport(this.cornerstoneElement);
            viewport.voi.windowCenter = parseFloat(value);
            cornerstone.setViewport(this.cornerstoneElement, viewport);
        }
    }

    adjustWindowWidth(value) {
        document.getElementById('windowWidthValue').textContent = value;
        if (this.cornerstoneElement && window.cornerstone) {
            const viewport = cornerstone.getViewport(this.cornerstoneElement);
            viewport.voi.windowWidth = parseFloat(value);
            cornerstone.setViewport(this.cornerstoneElement, viewport);
        }
    }

    adjustZoom(value) {
        document.getElementById('zoomValue').textContent = value + 'x';
        if (this.cornerstoneElement && window.cornerstone) {
            const viewport = cornerstone.getViewport(this.cornerstoneElement);
            viewport.scale = parseFloat(value);
            cornerstone.setViewport(this.cornerstoneElement, viewport);
        }
    }

    resetDicomView() {
        if (this.cornerstoneElement && window.cornerstone) {
            cornerstone.reset(this.cornerstoneElement);
            // Reset controls
            document.getElementById('windowLevel').value = 0;
            document.getElementById('windowWidth').value = 400;
            document.getElementById('zoomControl').value = 1;
            this.adjustWindowLevel(0);
            this.adjustWindowWidth(400);
            this.adjustZoom(1);
        }
    }

    invertDicomImage() {
        if (this.cornerstoneElement && window.cornerstone) {
            const viewport = cornerstone.getViewport(this.cornerstoneElement);
            viewport.invert = !viewport.invert;
            cornerstone.setViewport(this.cornerstoneElement, viewport);
        }
    }

    updateDicomControls(detail) {
        if (detail && detail.viewport) {
            const viewport = detail.viewport;
            document.getElementById('windowLevel').value = viewport.voi.windowCenter || 0;
            document.getElementById('windowWidth').value = viewport.voi.windowWidth || 400;
            document.getElementById('zoomControl').value = viewport.scale || 1;
            this.adjustWindowLevel(viewport.voi.windowCenter || 0);
            this.adjustWindowWidth(viewport.voi.windowWidth || 400);
            this.adjustZoom(viewport.scale || 1);
        }
    }

    // Bookmark Methods
    toggleBookmark() {
        if (!this.currentMedia) return;

        const mediaId = this.currentMedia.id;
        if (this.bookmarks.has(mediaId)) {
            this.bookmarks.delete(mediaId);
        } else {
            this.bookmarks.add(mediaId);
        }

        this.saveMediaItems();
        this.updateBookmarkButton();
        this.renderMediaGrid();
    }

    updateBookmarkButton() {
        const bookmarkBtn = document.getElementById('bookmarkBtn');
        if (!bookmarkBtn || !this.currentMedia) return;

        const isBookmarked = this.bookmarks.has(this.currentMedia.id);
        const icon = bookmarkBtn.querySelector('i');
        
        if (isBookmarked) {
            icon.className = 'fas fa-bookmark';
            bookmarkBtn.style.color = '#f59e0b';
        } else {
            icon.className = 'far fa-bookmark';
            bookmarkBtn.style.color = '';
        }
    }

    // Comment Methods
    loadComments(mediaId) {
        const commentsList = document.getElementById('commentsList');
        const mediaComments = this.comments[mediaId] || [];

        if (mediaComments.length === 0) {
            commentsList.innerHTML = '<p style="color: #64748b; text-align: center; padding: 20px;">No comments yet</p>';
            return;
        }

        commentsList.innerHTML = mediaComments.map(comment => `
            <div class="comment-item">
                <div class="comment-header">
                    <span class="comment-author">${comment.author}</span>
                    <span class="comment-date">${new Date(comment.date).toLocaleDateString()}</span>
                </div>
                <div class="comment-text">${comment.text}</div>
            </div>
        `).join('');
    }

    addComment() {
        if (!this.currentMedia) return;

        const commentText = document.getElementById('commentText');
        const text = commentText.value.trim();
        
        if (!text) return;

        const comment = {
            id: 'comment-' + Date.now(),
            text,
            author: 'Current User', // In real app, get from auth
            date: new Date().toISOString()
        };

        const mediaId = this.currentMedia.id;
        if (!this.comments[mediaId]) {
            this.comments[mediaId] = [];
        }
        
        this.comments[mediaId].push(comment);
        this.saveMediaItems();
        
        commentText.value = '';
        this.loadComments(mediaId);
        
        this.showNotification('Comment added successfully!', 'success');
    }

    // Utility Methods
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : '#6366f1'};
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
                z-index: 9999;
                font-size: 14px;
                max-width: 300px;
            ">
                ${message}
            </div>
        `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
}

// Initialize the component when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're in the DICOM viewer page
    if (document.querySelector('.dicom-viewer-container')) {
        window.dicomViewer = new DicomViewerComponent();
        console.log('DICOM Viewer Component loaded');
    }
});

// Export for use in other contexts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DicomViewerComponent;
}