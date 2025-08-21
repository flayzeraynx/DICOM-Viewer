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
        });
      });

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
        validateForm();
        
        // Update upload zone
        const uploadZone = document.getElementById('fileUploadArea');
        uploadZone.innerHTML = `
          <i class="fas fa-file-check" style="color: var(--success-color);"></i>
          <p>File selected: ${file.name}</p>
          <p style="font-size: 12px; opacity: 0.7;">Click to select a different file</p>
          <input type="file" id="fileInput" accept=".dcm,.dicom,.jpg,.jpeg,.png,.mp4,.avi,.mov">
        `;
        
        // Re-attach event listener
        document.getElementById('fileInput').addEventListener('change', (e) => handleFileSelection(e));
      }
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
      
      if (!title) return;

      showNotification('File uploaded successfully! (Demo mode)', 'success');
      closeUploadModal();
    };

    const openViewer = (mediaId) => {
      const modal = document.getElementById('viewerModal');
      modal.classList.add('active');
      
      // Update viewer content based on media ID
      const titles = {
        'sample-1': 'Knee X-Ray',
        'sample-2': 'Recovery Progress'
      };
      
      const metadata = {
        'sample-1': 'XRAY • 8/19/2025',
        'sample-2': 'VIDEO • 8/14/2025'
      };
      
      document.getElementById('viewerTitle').textContent = titles[mediaId] || 'Media Viewer';
      document.getElementById('viewerMetadata').textContent = metadata[mediaId] || 'Unknown';
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
    setTimeout(setupEventListeners, 100);
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
                    <p>Medical imaging format (.dcm, .dicom)</p>
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
              <div className="upload-zone" id="fileUploadArea">
                <i className="fas fa-cloud-upload-alt"></i>
                <p>Drop files here or click to browse</p>
                <input type="file" id="fileInput" accept=".dcm,.dicom,.jpg,.jpeg,.png,.mp4,.avi,.mov" />
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