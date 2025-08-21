import { useEffect } from "react";
import "./App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// DICOM Viewer Component in React
const DicomViewer = () => {
  useEffect(() => {
    // Initialize the standalone DICOM viewer functionality
    initializeDicomViewer();
  }, []);

  const initializeDicomViewer = () => {
    // Upload button functionality
    const setupEventListeners = () => {
      // Upload button
      document.getElementById('uploadBtn')?.addEventListener('click', () => openUploadModal());
      
      // Upload modal
      document.getElementById('closeUploadBtn')?.addEventListener('click', () => closeUploadModal());
      document.getElementById('nextStepBtn')?.addEventListener('click', () => nextStep());
      document.getElementById('backStepBtn')?.addEventListener('click', () => backStep());
      document.getElementById('uploadFileBtn')?.addEventListener('click', () => uploadFile());
      
      // File type selection
      document.querySelectorAll('input[name="fileType"]').forEach(radio => {
        radio.addEventListener('change', () => {
          document.getElementById('nextStepBtn').disabled = false;
          updateFileInputAccept(radio.value);
        });
      });

    const updateFileInputAccept = (fileType) => {
      const fileInput = document.getElementById('fileInput');
      const accepts = {
        dicom: '.dcm,.dicom,.zip', // Added .zip support for DICOM
        xray: '.jpg,.jpeg,.png',
        image: '.jpg,.jpeg,.png,.gif,.bmp,.webp',
        video: '.mp4,.avi,.mov,.wmv,.flv,.webm'
      };
      
      if (fileInput) {
        fileInput.accept = accepts[fileType] || '*';
      }
    };

      // File input
      document.getElementById('fileInput')?.addEventListener('change', (e) => handleFileSelection(e));
      document.getElementById('mediaTitle')?.addEventListener('input', () => validateForm());
      
      // Upload zone click handler
      document.getElementById('fileUploadArea')?.addEventListener('click', () => {
        document.getElementById('fileInput')?.click();
      });

      // Media items
      document.querySelectorAll('.media-item').forEach(item => {
        item.addEventListener('click', () => {
          const mediaId = item.dataset.mediaId;
          openViewer(mediaId);
        });
      });

      // Viewer modal
      document.getElementById('closeViewerBtn')?.addEventListener('click', () => closeViewer());

      // Tab switching
      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
          e.target.classList.add('active');
        });
      });

      // Click outside modals to close
      document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            modal.classList.remove('active');
          }
        });
      });
    };

    const openUploadModal = () => {
      document.getElementById('uploadModal').classList.add('active');
      resetUploadForm();
    };

    const closeUploadModal = () => {
      document.getElementById('uploadModal').classList.remove('active');
    };

    const resetUploadForm = () => {
      document.getElementById('uploadStep1').classList.add('active');
      document.getElementById('uploadStep2').classList.remove('active');
      document.querySelectorAll('input[name="fileType"]').forEach(radio => radio.checked = false);
      document.getElementById('nextStepBtn').disabled = true;
      document.getElementById('mediaTitle').value = '';
      document.getElementById('mediaDescription').value = '';
      document.getElementById('uploadFileBtn').disabled = true;
      
      // Reset upload zone
      const uploadZone = document.getElementById('fileUploadArea');
      if (uploadZone) {
        uploadZone.innerHTML = `
          <i class="fas fa-cloud-upload-alt"></i>
          <p>Drop files here or click to browse</p>
          <input type="file" id="fileInput" accept=".dcm,.dicom,.jpg,.jpeg,.png,.mp4,.avi,.mov" style="display: none;">
        `;
        
        // Re-attach event listeners
        setTimeout(() => {
          document.getElementById('fileInput')?.addEventListener('change', (e) => handleFileSelection(e));
          document.getElementById('fileUploadArea')?.addEventListener('click', () => {
            document.getElementById('fileInput')?.click();
          });
          
          // Add drag and drop support
          const uploadArea = document.getElementById('fileUploadArea');
          if (uploadArea) {
            uploadArea.addEventListener('dragover', (e) => {
              e.preventDefault();
              uploadArea.style.borderColor = 'var(--primary-color)';
              uploadArea.style.background = 'rgba(99, 102, 241, 0.05)';
            });
            
            uploadArea.addEventListener('dragleave', (e) => {
              e.preventDefault();
              uploadArea.style.borderColor = 'var(--border-color)';
              uploadArea.style.background = '';
            });
            
            uploadArea.addEventListener('drop', (e) => {
              e.preventDefault();
              uploadArea.style.borderColor = 'var(--border-color)';
              uploadArea.style.background = '';
              
              const files = e.dataTransfer.files;
              if (files.length > 0) {
                const fileInput = document.getElementById('fileInput');
                fileInput.files = files;
                handleFileSelection({ target: { files: [files[0]] } });
              }
            });
          }
        }, 100);
      }
    };

    const nextStep = () => {
      document.getElementById('uploadStep1').classList.remove('active');
      document.getElementById('uploadStep2').classList.add('active');
    };

    const backStep = () => {
      document.getElementById('uploadStep1').classList.add('active');
      document.getElementById('uploadStep2').classList.remove('active');
    };

    const handleFileSelection = (event) => {
      const file = event.target.files[0];
      if (file) {
        const selectedFileType = document.querySelector('input[name="fileType"]:checked')?.value || 'image';
        
        // Generate preview based on file type
        generateFilePreview(file, selectedFileType);
        
        // Enable form validation
        validateForm();
        
        // Update upload zone with file info
        const uploadZone = document.getElementById('fileUploadArea');
        const fileSize = (file.size / 1024 / 1024).toFixed(2); // Size in MB
        const fileIcon = getFileIcon(file, selectedFileType);
        
        uploadZone.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
            <i class="${fileIcon}" style="color: var(--success-color); font-size: 48px;"></i>
            <div style="text-align: center;">
              <p><strong>File selected:</strong> ${file.name}</p>
              <p style="font-size: 12px; opacity: 0.7;">Size: ${fileSize} MB • Type: ${selectedFileType.toUpperCase()}</p>
              <p style="font-size: 12px; opacity: 0.7;">Click to select a different file</p>
            </div>
          </div>
          <input type="file" id="fileInput" accept=".dcm,.dicom,.zip,.jpg,.jpeg,.png,.mp4,.avi,.mov" style="display: none;">
        `;
        
        // Re-attach event listeners
        document.getElementById('fileInput').addEventListener('change', (e) => handleFileSelection(e));
        document.getElementById('fileUploadArea').addEventListener('click', () => {
          document.getElementById('fileInput').click();
        });
        
        // Store file for upload
        window.selectedFileData = {
          file: file,
          type: selectedFileType,
          preview: null
        };
      }
    };

    const getFileIcon = (file, fileType) => {
      const fileName = file.name.toLowerCase();
      
      if (fileType === 'dicom' || fileName.endsWith('.dcm') || fileName.endsWith('.dicom')) {
        return 'fas fa-x-ray';
      } else if (fileName.endsWith('.zip')) {
        return 'fas fa-file-archive';
      } else if (fileType === 'video' || fileName.match(/\.(mp4|avi|mov|wmv|flv|webm)$/)) {
        return 'fas fa-video';
      } else if (fileType === 'xray') {
        return 'fas fa-bone';
      } else if (fileName.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/)) {
        return 'fas fa-image';
      } else {
        return 'fas fa-file';
      }
    };

    const generateFilePreview = (file, fileType) => {
      const fileName = file.name.toLowerCase();
      
      // Handle image files - generate thumbnail
      if (fileName.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/)) {
        const reader = new FileReader();
        reader.onload = (e) => {
          window.selectedFileData = window.selectedFileData || {};
          window.selectedFileData.preview = e.target.result;
          
          // Show immediate preview in a small preview area
          showFilePreview(e.target.result, fileType, file.name);
        };
        reader.readAsDataURL(file);
      } 
      // Handle video files - show video icon
      else if (fileName.match(/\.(mp4|avi|mov|wmv|flv|webm)$/)) {
        showFilePreview(null, fileType, file.name);
      }
      // Handle DICOM/ZIP files - show appropriate icon
      else {
        showFilePreview(null, fileType, file.name);
      }
    };

    const showFilePreview = (previewUrl, fileType, fileName) => {
      // Find or create preview container
      let previewContainer = document.getElementById('filePreviewContainer');
      if (!previewContainer) {
        previewContainer = document.createElement('div');
        previewContainer.id = 'filePreviewContainer';
        previewContainer.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          width: 200px;
          background: white;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 12px;
          box-shadow: var(--shadow-md);
          z-index: 1001;
        `;
        document.body.appendChild(previewContainer);
      }

      const fileIcon = getFileIcon({ name: fileName }, fileType);
      
      previewContainer.innerHTML = `
        <div style="text-align: center;">
          <h4 style="margin: 0 0 8px 0; font-size: 14px;">File Preview</h4>
          ${previewUrl ? 
            `<img src="${previewUrl}" style="width: 100%; height: 100px; object-fit: cover; border-radius: 4px; margin-bottom: 8px;">` :
            `<i class="${fileIcon}" style="font-size: 48px; color: var(--primary-color); margin-bottom: 8px;"></i>`
          }
          <p style="margin: 0; font-size: 12px; font-weight: 500;">${fileName}</p>
          <p style="margin: 4px 0 0 0; font-size: 11px; color: var(--text-secondary);">${fileType.toUpperCase()} file ready to upload</p>
          <button onclick="this.parentElement.parentElement.remove()" style="
            margin-top: 8px;
            padding: 4px 8px;
            font-size: 11px;
            background: var(--secondary-color);
            border: none;
            border-radius: 4px;
            cursor: pointer;
          ">Close Preview</button>
        </div>
      `;

      // Auto-hide after 10 seconds
      setTimeout(() => {
        if (previewContainer && previewContainer.parentNode) {
          previewContainer.remove();
        }
      }, 10000);
    };

    const validateForm = () => {
      const title = document.getElementById('mediaTitle').value.trim();
      const hasFile = document.getElementById('fileInput').files.length > 0;
      document.getElementById('uploadFileBtn').disabled = !title || !hasFile;
    };

    const uploadFile = () => {
      const title = document.getElementById('mediaTitle').value.trim();
      const description = document.getElementById('mediaDescription').value.trim();
      const fileType = document.querySelector('input[name="fileType"]:checked').value;
      
      if (!title || !window.selectedFileData) return;

      const file = window.selectedFileData.file;
      const preview = window.selectedFileData.preview;

      // Create new media item
      const mediaItem = {
        id: 'media-' + Date.now(),
        title,
        description,
        type: fileType,
        fileName: file.name,
        fileSize: (file.size / 1024 / 1024).toFixed(2) + ' MB',
        fileType: file.type,
        uploadDate: new Date().toISOString(),
        thumbnail: preview,
        url: preview || null // In real app, this would be uploaded to server
      };

      // Add to media library immediately
      addMediaItemToLibrary(mediaItem);
      
      // Show success notification
      showNotification(`${title} uploaded successfully!`, 'success');
      
      // Close modal and clean up
      closeUploadModal();
      
      // Clean up preview
      const previewContainer = document.getElementById('filePreviewContainer');
      if (previewContainer) {
        previewContainer.remove();
      }
      
      // Clean up stored data
      window.selectedFileData = null;
    };

    const addMediaItemToLibrary = (mediaItem) => {
      const mediaGrid = document.getElementById('mediaGrid');
      if (!mediaGrid) return;

      // Create media item HTML
      const mediaItemHtml = createMediaItemHTML(mediaItem);
      
      // Add to beginning of grid
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = mediaItemHtml;
      const newMediaElement = tempDiv.firstElementChild;
      
      // Add click listener to new item
      newMediaElement.addEventListener('click', () => {
        openViewer(mediaItem.id);
      });
      
      // Insert at beginning
      mediaGrid.insertBefore(newMediaElement, mediaGrid.firstChild);
      
      // Update counters
      const allCount = document.getElementById('allCount');
      if (allCount) {
        const currentCount = parseInt(allCount.textContent) || 0;
        allCount.textContent = currentCount + 1;
      }
      
      // Add to stored media items (in real app, this would be saved to server)
      if (!window.mediaItems) window.mediaItems = [];
      window.mediaItems.unshift(mediaItem);
      
      // Store viewer data for this item
      window.mediaItemsData = window.mediaItemsData || {};
      window.mediaItemsData[mediaItem.id] = mediaItem;
    };

    const createMediaItemHTML = (item) => {
      const uploadDate = new Date(item.uploadDate).toLocaleDateString();
      const fileTypeIcon = getFileIcon({ name: item.fileName }, item.type);
      
      return `
        <div class="media-item" data-media-id="${item.id}" style="animation: slideInUp 0.3s ease-out;">
          <div class="media-thumbnail">
            ${item.thumbnail 
              ? `<img src="${item.thumbnail}" alt="${item.title}" style="width: 100%; height: 100%; object-fit: cover;">`
              : `<i class="${fileTypeIcon}"></i>`
            }
          </div>
          <div class="media-info">
            <div class="media-title">${item.title}</div>
            <div class="media-metadata">${uploadDate} • ${item.type.toUpperCase()} • ${item.fileSize}</div>
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
    };

    const openViewer = (mediaId) => {
      const modal = document.getElementById('viewerModal');
      modal.classList.add('active');
      
      // Get media data (from stored items or default samples)
      let media = null;
      if (window.mediaItemsData && window.mediaItemsData[mediaId]) {
        media = window.mediaItemsData[mediaId];
      } else {
        // Default sample data
        const titles = {
          'sample-1': 'Knee X-Ray',
          'sample-2': 'Recovery Progress'
        };
        
        const metadata = {
          'sample-1': 'XRAY • 8/19/2025',
          'sample-2': 'VIDEO • 8/14/2025'
        };
        
        media = {
          id: mediaId,
          title: titles[mediaId] || 'Media Viewer',
          uploadDate: new Date().toISOString(),
          type: mediaId === 'sample-1' ? 'xray' : 'video',
          thumbnail: null,
          url: null
        };
      }
      
      // Update viewer content
      document.getElementById('viewerTitle').textContent = media.title;
      const uploadDate = new Date(media.uploadDate).toLocaleDateString();
      document.getElementById('viewerMetadata').textContent = 
        `${media.type.toUpperCase()} • ${uploadDate}${media.fileSize ? ' • ' + media.fileSize : ''}`;
      
      // Update viewer display based on media type
      updateViewerDisplay(media);
    };

    const updateViewerDisplay = (media) => {
      const viewerContent = document.getElementById('viewerContent');
      const placeholder = document.getElementById('placeholder');
      
      if (media.thumbnail && (media.type === 'image' || media.type === 'xray')) {
        // Show actual image
        placeholder.innerHTML = `
          <img src="${media.thumbnail}" style="max-width: 100%; max-height: 400px; object-fit: contain; border-radius: 8px;">
          <h3 style="margin-top: 16px;">${media.title}</h3>
          <p>Image viewer - ${media.fileName || 'Image file'}</p>
        `;
      } else if (media.type === 'video' && media.url) {
        // Show video player
        placeholder.innerHTML = `
          <video controls style="max-width: 100%; max-height: 400px; border-radius: 8px;">
            <source src="${media.url}" type="video/mp4">
            Your browser does not support the video tag.
          </video>
          <h3 style="margin-top: 16px;">${media.title}</h3>
          <p>Video player - ${media.fileName || 'Video file'}</p>
        `;
      } else if (media.type === 'dicom') {
        // Show DICOM viewer placeholder
        const fileIcon = media.fileName && media.fileName.toLowerCase().endsWith('.zip') ? 'fas fa-file-archive' : 'fas fa-x-ray';
        placeholder.innerHTML = `
          <i class="${fileIcon}" style="font-size: 80px; margin-bottom: 20px; opacity: 0.5; color: var(--primary-color);"></i>
          <h3>DICOM Viewer Ready</h3>
          <p><strong>${media.title}</strong></p>
          <p>${media.fileName ? `File: ${media.fileName}` : 'DICOM file ready for viewing'}</p>
          <p style="font-size: 12px; margin-top: 10px; opacity: 0.7;">Advanced DICOM functionality available with cornerstone.js</p>
        `;
      } else {
        // Default placeholder
        const fileIcon = getFileIcon({ name: media.fileName || '' }, media.type);
        placeholder.innerHTML = `
          <i class="${fileIcon}" style="font-size: 80px; margin-bottom: 20px; opacity: 0.5; color: var(--primary-color);"></i>
          <h3>${media.title}</h3>
          <p>${media.fileName ? `File: ${media.fileName}` : 'Media file ready for viewing'}</p>
          <p style="font-size: 12px; margin-top: 10px; opacity: 0.7;">Viewer ready for ${media.type.toUpperCase()} files</p>
        `;
      }
    };

    const closeViewer = () => {
      document.getElementById('viewerModal').classList.remove('active');
    };

    const showNotification = (message, type = 'info') => {
      const notification = document.createElement('div');
      notification.className = `notification ${type}`;
      notification.textContent = message;
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 3000);
    };

    // Setup event listeners after a short delay to ensure DOM is ready
    setTimeout(() => {
      setupEventListeners();
      
      // Initialize upload zone functionality
      const uploadArea = document.getElementById('fileUploadArea');
      if (uploadArea) {
        uploadArea.addEventListener('click', () => {
          document.getElementById('fileInput')?.click();
        });
        
        // Add drag and drop support
        uploadArea.addEventListener('dragover', (e) => {
          e.preventDefault();
          uploadArea.style.borderColor = 'var(--primary-color)';
          uploadArea.style.background = 'rgba(99, 102, 241, 0.05)';
        });
        
        uploadArea.addEventListener('dragleave', (e) => {
          e.preventDefault();
          uploadArea.style.borderColor = 'var(--border-color)';
          uploadArea.style.background = '';
        });
        
        uploadArea.addEventListener('drop', (e) => {
          e.preventDefault();
          uploadArea.style.borderColor = 'var(--border-color)';
          uploadArea.style.background = '';
          
          const files = e.dataTransfer.files;
          if (files.length > 0) {
            const fileInput = document.getElementById('fileInput');
            fileInput.files = files;
            handleFileSelection({ target: { files: [files[0]] } });
          }
        });
      }
    }, 100);
  };

  return (
    <>
      {/* App Header */}
      <header className="app-header">
        <h1>Medical Imaging Platform</h1>
        <div className="user-info">
          <span>Dr. Smith</span>
          <div style={{
            width: '40px',
            height: '40px',
            background: '#6366f1',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            color: 'white'
          }}>
            DS
          </div>
        </div>
      </header>

      {/* DICOM Viewer */}
      <div className="dicom-viewer-container">
        {/* Left Sidebar Navigation */}
        <div className="sidebar">
          <div className="sidebar-header">
            <h2>Patient Media</h2>
          </div>
          <nav className="sidebar-nav">
            <div className="nav-section">
              <h3>Enhanced Recovery</h3>
              <ul className="nav-list">
                <li className="nav-item">
                  <i className="fas fa-stethoscope"></i>
                  <span>Pre Op</span>
                </li>
                <li className="nav-item">
                  <i className="fas fa-procedures"></i>
                  <span>Surgery (In Hospital)</span>
                </li>
                <li className="nav-item active">
                  <i className="fas fa-x-ray"></i>
                  <span>DICOM</span>
                </li>
              </ul>
            </div>
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="main-content">
          {/* Header with patient info */}
          <div className="content-header">
            <div className="patient-info">
              <div className="patient-avatar">
                <span className="avatar-initials">OK</span>
              </div>
              <div className="patient-details">
                <h1>Ozan Demo Kilic</h1>
                <p>Recovery time: 10 days / 2 Week</p>
              </div>
            </div>
            <div className="header-actions">
              <button className="btn btn-primary" id="uploadBtn">
                <i className="fas fa-upload"></i>
                Upload Media
              </button>
            </div>
          </div>

          {/* Media Library View */}
          <div className="media-library" id="mediaLibrary">
            {/* Tab Navigation */}
            <div className="tab-navigation">
              <button className="tab-btn active" data-tab="all">All media (<span id="allCount">2</span>)</button>
              <button className="tab-btn" data-tab="bookmarked">Bookmarked (<span id="bookmarkedCount">0</span>)</button>
            </div>

            {/* Media Grid */}
            <div className="media-grid" id="mediaGrid">
              {/* Sample Media Items */}
              <div className="media-item" data-media-id="sample-1">
                <div className="media-thumbnail">
                  <i className="fas fa-bone"></i>
                </div>
                <div className="media-info">
                  <div className="media-title">Knee X-Ray</div>
                  <div className="media-metadata">8/19/2025 • XRAY</div>
                  <div className="media-description">X-ray 2 days after the injury</div>
                  <div className="media-actions">
                    <button className="btn btn-sm btn-secondary">
                      <i className="fas fa-eye"></i>
                      View
                    </button>
                  </div>
                </div>
              </div>

              <div className="media-item" data-media-id="sample-2">
                <div className="media-thumbnail">
                  <i className="fas fa-video"></i>
                </div>
                <div className="media-info">
                  <div className="media-title">Recovery Progress</div>
                  <div className="media-metadata">8/14/2025 • VIDEO</div>
                  <div className="media-description">Week 2 progress video</div>
                  <div className="media-actions">
                    <button className="btn btn-sm btn-secondary">
                      <i className="fas fa-eye"></i>
                      View
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <div className="modal upload-modal" id="uploadModal">
        <div className="modal-container">
          <div className="modal-header">
            <h3>Upload Medical Media</h3>
            <button className="btn btn-icon" id="closeUploadBtn">
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="modal-content">
            <div className="upload-step active" id="uploadStep1">
              <h4>Step 1: Select File Type</h4>
              <div className="file-type-options">
                <label className="file-type-option">
                  <input type="radio" name="fileType" value="dicom" />
                  <div className="option-content">
                    <i className="fas fa-x-ray"></i>
                    <span>DICOM</span>
                    <p>Medical imaging format (.dcm, .dicom, .zip)</p>
                  </div>
                </label>
                <label className="file-type-option">
                  <input type="radio" name="fileType" value="xray" />
                  <div className="option-content">
                    <i className="fas fa-bone"></i>
                    <span>X-Ray</span>
                    <p>Standard X-ray images (.jpg, .png)</p>
                  </div>
                </label>
                <label className="file-type-option">
                  <input type="radio" name="fileType" value="image" />
                  <div className="option-content">
                    <i className="fas fa-image"></i>
                    <span>Image</span>
                    <p>Standard image formats (.jpg, .png)</p>
                  </div>
                </label>
                <label className="file-type-option">
                  <input type="radio" name="fileType" value="video" />
                  <div className="option-content">
                    <i className="fas fa-video"></i>
                    <span>Video</span>
                    <p>Video files (.mp4, .avi, .mov)</p>
                  </div>
                </label>
              </div>
              <button className="btn btn-primary" id="nextStepBtn" disabled>Next</button>
            </div>

            <div className="upload-step" id="uploadStep2">
              <h4>Step 2: Upload File & Add Details</h4>
              <div className="upload-zone" id="fileUploadArea" style={{ cursor: 'pointer' }}>
                <i className="fas fa-cloud-upload-alt"></i>
                <p>Drop files here or click to browse</p>
                <input 
                  type="file" 
                  id="fileInput" 
                  accept=".dcm,.dicom,.jpg,.jpeg,.png,.mp4,.avi,.mov" 
                  style={{ display: 'none' }}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="mediaTitle">Title *</label>
                <input type="text" id="mediaTitle" placeholder="e.g., Knee X-Ray" required />
              </div>
              <div className="form-group">
                <label htmlFor="mediaDescription">Description</label>
                <textarea id="mediaDescription" placeholder="e.g., X-ray 2 days after the injury"></textarea>
              </div>
              
              <div className="upload-actions">
                <button className="btn btn-secondary" id="backStepBtn">Back</button>
                <button className="btn btn-primary" id="uploadFileBtn" disabled>Upload</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Simple Viewer Modal */}
      <div className="modal viewer-modal" id="viewerModal">
        <div className="modal-container">
          <div className="modal-header">
            <div>
              <h3 id="viewerTitle">Media Viewer</h3>
              <p id="viewerMetadata">Loading...</p>
            </div>
            <button className="btn btn-icon" id="closeViewerBtn">
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f8fafc',
            padding: '40px'
          }}>
            <div id="viewerContent" style={{ textAlign: 'center' }}>
              <div id="placeholder" style={{ color: '#64748b' }}>
                <i className="fas fa-x-ray" style={{
                  fontSize: '80px',
                  marginBottom: '20px',
                  opacity: 0.5
                }}></i>
                <h3>DICOM Viewer Ready</h3>
                <p>This is where DICOM files, images, and videos would be displayed</p>
                <p style={{
                  fontSize: '12px',
                  marginTop: '10px',
                  opacity: 0.7
                }}>Advanced DICOM functionality available with cornerstone.js</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

function App() {
  return (
    <div className="App">
      <DicomViewer />
    </div>
  );
}

export default App;