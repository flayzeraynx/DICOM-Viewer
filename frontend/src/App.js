import { useEffect, useState } from "react";
import "./App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// DICOM Viewer Component in React
const DicomViewer = () => {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedFileType, setSelectedFileType] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title: '', description: '' });
  const [mediaItems, setMediaItems] = useState([
    {
      id: 'sample-1',
      title: 'Knee X-Ray',
      description: 'X-ray 2 days after the injury',
      type: 'xray',
      fileName: 'knee-xray.jpg',
      fileSize: '2.1 MB',
      uploadDate: new Date(Date.now() - 86400000 * 2).toISOString(),
      thumbnail: null
    },
    {
      id: 'sample-2',
      title: 'Recovery Progress',
      description: 'Week 2 progress video',
      type: 'video',
      fileName: 'recovery-week2.mp4',
      fileSize: '15.3 MB',
      uploadDate: new Date(Date.now() - 86400000 * 7).toISOString(),
      thumbnail: null
    }
  ]);
  const [currentViewer, setCurrentViewer] = useState(null);

  const fileTypeOptions = {
    dicom: { icon: 'fas fa-x-ray', label: 'DICOM', description: 'Medical imaging format (.dcm, .dicom, .zip)', accept: '.dcm,.dicom,.zip' },
    xray: { icon: 'fas fa-bone', label: 'X-Ray', description: 'Standard X-ray images (.jpg, .png)', accept: '.jpg,.jpeg,.png' },
    image: { icon: 'fas fa-image', label: 'Image', description: 'Standard image formats (.jpg, .png)', accept: '.jpg,.jpeg,.png,.gif,.bmp,.webp' },
    video: { icon: 'fas fa-video', label: 'Video', description: 'Video files (.mp4, .avi, .mov)', accept: '.mp4,.avi,.mov,.wmv,.flv,.webm' }
  };

  const handleFileSelection = (event) => {
    console.log('File selection triggered', event);
    const file = event.target.files[0];
    console.log('Selected file:', file);
    
    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log('Starting file processing for:', file.name);
    setIsProcessing(true);
    setSelectedFile(file);

    // Show processing indicator for 1.5 seconds
    setTimeout(() => {
      setIsProcessing(false);
      showNotification(`File "${file.name}" selected successfully!`, 'success');
      console.log('File processing completed');
    }, 1500);
  };

  // Create a ref for the file input
  const fileInputRef = React.useRef(null);

  const handleUploadAreaClick = () => {
    console.log('Upload area clicked');
    if (fileInputRef.current) {
      fileInputRef.current.click();
      console.log('File input triggered');
    }
  };

  const handleUpload = () => {
    if (!selectedFile || !uploadForm.title.trim()) return;

    setIsProcessing(true);

    // Simulate upload processing
    setTimeout(() => {
      const newMediaItem = {
        id: 'media-' + Date.now(),
        title: uploadForm.title,
        description: uploadForm.description,
        type: selectedFileType,
        fileName: selectedFile.name,
        fileSize: (selectedFile.size / 1024 / 1024).toFixed(2) + ' MB',
        uploadDate: new Date().toISOString(),
        thumbnail: selectedFile.type.startsWith('image/') ? URL.createObjectURL(selectedFile) : null
      };

      // Add to media library
      setMediaItems(prev => [newMediaItem, ...prev]);
      
      // Reset form and close modal
      setUploadModalOpen(false);
      setCurrentStep(1);
      setSelectedFile(null);
      setSelectedFileType('');
      setUploadForm({ title: '', description: '' });
      setIsProcessing(false);

      showNotification(`"${newMediaItem.title}" uploaded successfully!`, 'success');
    }, 2000);
  };

  const showNotification = (message, type = 'info') => {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: var(--shadow-md);
      z-index: 9999;
      font-size: 14px;
      max-width: 300px;
      background: ${type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : '#6366f1'};
      color: white;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  };

  const getFileIcon = (fileName, type) => {
    const name = fileName?.toLowerCase() || '';
    if (type === 'dicom' || name.endsWith('.dcm') || name.endsWith('.dicom')) return 'fas fa-x-ray';
    if (name.endsWith('.zip')) return 'fas fa-file-archive';
    if (type === 'video' || name.match(/\.(mp4|avi|mov|wmv|flv|webm)$/)) return 'fas fa-video';
    if (type === 'xray') return 'fas fa-bone';
    if (name.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/)) return 'fas fa-image';
    return 'fas fa-file';
  };

  const openViewer = (mediaId) => {
    const media = mediaItems.find(item => item.id === mediaId);
    if (media) {
      setCurrentViewer(media);
    }
  };

  const closeViewer = () => {
    setCurrentViewer(null);
  };

  const resetUploadModal = () => {
    setCurrentStep(1);
    setSelectedFile(null);
    setSelectedFileType('');
    setUploadForm({ title: '', description: '' });
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
              <button className="btn btn-primary" onClick={() => setUploadModalOpen(true)}>
                <i className="fas fa-upload"></i>
                Upload Media
              </button>
            </div>
          </div>

          {/* Media Library View */}
          <div className="media-library">
            {/* Tab Navigation */}
            <div className="tab-navigation">
              <button className="tab-btn active">All media ({mediaItems.length})</button>
              <button className="tab-btn">Bookmarked (0)</button>
            </div>

            {/* Media Grid */}
            <div className="media-grid">
              {mediaItems.map(item => (
                <div key={item.id} className="media-item" onClick={() => openViewer(item.id)}>
                  <div className="media-thumbnail">
                    {item.thumbnail ? (
                      <img src={item.thumbnail} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <i className={getFileIcon(item.fileName, item.type)}></i>
                    )}
                  </div>
                  <div className="media-info">
                    <div className="media-title">{item.title}</div>
                    <div className="media-metadata">
                      {new Date(item.uploadDate).toLocaleDateString()} • {item.type.toUpperCase()} • {item.fileSize}
                    </div>
                    <div className="media-description">{item.description || 'No description'}</div>
                    <div className="media-actions">
                      <button className="btn btn-sm btn-secondary">
                        <i className="fas fa-eye"></i>
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {uploadModalOpen && (
        <div className="modal active">
          <div className="modal-container" style={{ width: '600px' }}>
            <div className="modal-header">
              <h3>Upload Medical Media</h3>
              <button className="btn btn-icon" onClick={() => { setUploadModalOpen(false); resetUploadModal(); }}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-content">
              {currentStep === 1 && (
                <div className="upload-step active">
                  <h4>Step 1: Select File Type</h4>
                  <div className="file-type-options">
                    {Object.entries(fileTypeOptions).map(([key, option]) => (
                      <label key={key} className="file-type-option">
                        <input 
                          type="radio" 
                          name="fileType" 
                          value={key}
                          checked={selectedFileType === key}
                          onChange={(e) => setSelectedFileType(e.target.value)}
                        />
                        <div className="option-content">
                          <i className={option.icon}></i>
                          <span>{option.label}</span>
                          <p>{option.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  <button 
                    className="btn btn-primary" 
                    disabled={!selectedFileType}
                    onClick={() => setCurrentStep(2)}
                  >
                    Next
                  </button>
                </div>
              )}

              {currentStep === 2 && (
                <div className="upload-step active">
                  <h4>Step 2: Upload File & Add Details</h4>
                  
                  {/* File Upload Area */}
                  <div className="upload-zone" style={{ position: 'relative', cursor: 'pointer' }}>
                    {isProcessing ? (
                      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                        <div className="spinner" style={{
                          width: '32px',
                          height: '32px',
                          border: '3px solid var(--border-color)',
                          borderTop: '3px solid var(--primary-color)',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite',
                          margin: '0 auto 16px'
                        }}></div>
                        <p>Processing file...</p>
                      </div>
                    ) : selectedFile ? (
                      <div style={{ textAlign: 'center', padding: '20px' }}>
                        <i className={getFileIcon(selectedFile.name, selectedFileType)} style={{
                          fontSize: '48px',
                          color: 'var(--success-color)',
                          marginBottom: '12px'
                        }}></i>
                        <p><strong>File selected:</strong> {selectedFile.name}</p>
                        <p style={{ fontSize: '12px', opacity: 0.7 }}>
                          Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Type: {selectedFileType.toUpperCase()}
                        </p>
                        <p style={{ fontSize: '12px', opacity: 0.7 }}>Click to select a different file</p>
                      </div>
                    ) : (
                      <>
                        <i className="fas fa-cloud-upload-alt"></i>
                        <p>Drop files here or click to browse</p>
                      </>
                    )}
                    
                    <input 
                      type="file" 
                      accept={fileTypeOptions[selectedFileType]?.accept || '*'}
                      onChange={handleFileSelection}
                      onClick={(e) => e.target.value = null} // Reset input to allow same file selection
                      style={{ 
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        opacity: 0,
                        cursor: 'pointer',
                        zIndex: 10
                      }}
                    />
                  </div>
                  
                  {/* Form Fields */}
                  <div className="form-group">
                    <label>Title *</label>
                    <input 
                      type="text" 
                      placeholder="e.g., Knee X-Ray" 
                      value={uploadForm.title}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea 
                      placeholder="e.g., X-ray 2 days after the injury"
                      value={uploadForm.description}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  
                  <div className="upload-actions">
                    <button className="btn btn-secondary" onClick={() => setCurrentStep(1)}>
                      Back
                    </button>
                    <button 
                      className="btn btn-primary" 
                      disabled={!selectedFile || !uploadForm.title.trim() || isProcessing}
                      onClick={handleUpload}
                    >
                      {isProcessing ? (
                        <>
                          <div className="spinner" style={{
                            width: '14px',
                            height: '14px',
                            border: '2px solid rgba(255,255,255,0.3)',
                            borderTop: '2px solid white',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            marginRight: '8px'
                          }}></div>
                          Uploading...
                        </>
                      ) : 'Upload'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Viewer Modal */}
      {currentViewer && (
        <div className="modal viewer-modal active">
          <div className="modal-container" style={{ width: '95%', height: '95%', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <div>
                <h3>{currentViewer.title}</h3>
                <p>{currentViewer.type.toUpperCase()} • {new Date(currentViewer.uploadDate).toLocaleDateString()} • {currentViewer.fileSize}</p>
              </div>
              <button className="btn btn-icon" onClick={closeViewer}>
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
              <div style={{ textAlign: 'center', color: '#64748b' }}>
                {currentViewer.thumbnail ? (
                  <>
                    <img 
                      src={currentViewer.thumbnail} 
                      alt={currentViewer.title}
                      style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain', borderRadius: '8px' }}
                    />
                    <h3 style={{ marginTop: '16px' }}>{currentViewer.title}</h3>
                    <p>Image viewer - {currentViewer.fileName}</p>
                  </>
                ) : (
                  <>
                    <i className={getFileIcon(currentViewer.fileName, currentViewer.type)} style={{
                      fontSize: '80px',
                      marginBottom: '20px',
                      opacity: 0.5,
                      color: 'var(--primary-color)'
                    }}></i>
                    <h3>{currentViewer.title}</h3>
                    <p>File: {currentViewer.fileName}</p>
                    <p style={{ fontSize: '12px', marginTop: '10px', opacity: 0.7 }}>
                      Viewer ready for {currentViewer.type.toUpperCase()} files
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
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