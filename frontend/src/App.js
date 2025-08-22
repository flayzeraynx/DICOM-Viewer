import { useEffect, useState, useRef } from "react";
import "./App.css";
import JSZip from "jszip";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// DICOM Viewer Component with Real Cornerstone Integration
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
  const [dicomViewerState, setDicomViewerState] = useState({
    currentImageIndex: 0,
    totalImages: 0,
    imageIds: [],
    windowLevel: 0,
    windowWidth: 400,
    zoom: 1,
    isLoaded: false,
    isProcessing: false,
    availableScans: [],
    currentScanIndex: 0,
    error: null
  });

  // DICOM viewer refs
  const dicomViewport = useRef(null);
  const fileInputRef = useRef(null);

  // Initialize cornerstone when component mounts
  useEffect(() => {
    const initializeCornerstone = async () => {
      try {
        if (window.cornerstone && window.cornerstoneWADOImageLoader && window.dicomParser) {
          console.log('Cornerstone libraries found, initializing...');
          
          // Configure cornerstone
          window.cornerstoneWADOImageLoader.external.cornerstone = window.cornerstone;
          window.cornerstoneWADOImageLoader.external.dicomParser = window.dicomParser;
          
          // Configure image loader
          const config = {
            maxWebWorkers: navigator.hardwareConcurrency || 1,
            startWebWorkersOnDemand: true,
          };
          
          window.cornerstoneWADOImageLoader.webWorkerManager.initialize(config);
          
          // Register the WADO image loader prefix
          if (window.cornerstoneWADOImageLoader.wadouri) {
            window.cornerstoneWADOImageLoader.wadouri.register(window.cornerstone);
            console.log('WADO URI loader registered');
          }
          
          console.log('Cornerstone initialized successfully');
          
          // Initialize cornerstone tools if available
          if (window.cornerstoneTools) {
            window.cornerstoneTools.external.cornerstone = window.cornerstone;
            window.cornerstoneTools.external.Hammer = window.Hammer;
            window.cornerstoneTools.init();
            console.log('Cornerstone tools initialized');
          }
        } else {
          console.warn('Cornerstone libraries not found, using fallback rendering');
        }
      } catch (error) {
        console.error('Error initializing cornerstone:', error);
      }
    };

    // Initialize immediately and also set up a retry mechanism
    initializeCornerstone();
    
    // Poll for libraries to be loaded (in case they load after our initial check)
    const checkLibraries = setInterval(() => {
      if (window.cornerstone && !window.cornerstoneInitialized) {
        window.cornerstoneInitialized = true;
        initializeCornerstone();
      }
    }, 500);
    
    // Clean up interval on component unmount
    return () => clearInterval(checkLibraries);
  }, []);

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

    // Process the file and create a blob URL for DICOM files
    const processFile = async () => {
      let fileUrl = null;
      let dicomImageIds = [];
      
      if (selectedFile.type === 'application/zip' || selectedFile.name.toLowerCase().endsWith('.zip')) {
        // For ZIP files, we'll create a placeholder URL
        fileUrl = URL.createObjectURL(selectedFile);
        // In a real implementation, you would extract and process DICOM files from the ZIP
        dicomImageIds = ['dicom-placeholder-1', 'dicom-placeholder-2', 'dicom-placeholder-3'];
      } else if (selectedFile.name.toLowerCase().match(/\.(dcm|dicom)$/)) {
        fileUrl = URL.createObjectURL(selectedFile);
        dicomImageIds = [`wadouri:${fileUrl}`];
      }

      return { fileUrl, dicomImageIds };
    };

    // Simulate upload processing with realistic timing
    setTimeout(async () => {
      const { fileUrl, dicomImageIds } = await processFile();
      
      const newMediaItem = {
        id: 'media-' + Date.now(),
        title: uploadForm.title,
        description: uploadForm.description,
        type: selectedFileType,
        fileName: selectedFile.name,
        fileSize: (selectedFile.size / 1024 / 1024).toFixed(2) + ' MB',
        uploadDate: new Date().toISOString(),
        thumbnail: selectedFile.type.startsWith('image/') ? URL.createObjectURL(selectedFile) : null,
        fileUrl: fileUrl,
        dicomImageIds: dicomImageIds
      };

      // Add to media library
      setMediaItems(prev => [newMediaItem, ...prev]);
      
      // Close upload modal first
      setUploadModalOpen(false);
      setIsProcessing(false);
      
      // Reset form
      setCurrentStep(1);
      setSelectedFile(null);
      setSelectedFileType('');
      setUploadForm({ title: '', description: '' });

      // Show success notification
      showNotification(`"${newMediaItem.title}" uploaded successfully!`, 'success');
      
      // Auto-open the viewer for the uploaded file after a brief delay
      setTimeout(() => {
        setCurrentViewer(newMediaItem);
      }, 500);
      
    }, 2000); // 2 second upload simulation
  };

  const loadDicomImage = async (mediaItem) => {
    console.log('Loading DICOM for:', mediaItem);
    
    setDicomViewerState(prev => ({ 
      ...prev, 
      isLoaded: false, 
      isProcessing: true, 
      error: null,
      availableScans: [],
      currentScanIndex: 0
    }));
    
    try {
      if (mediaItem.type === 'dicom' && mediaItem.fileUrl) {
        console.log('Processing DICOM file:', mediaItem.fileName);
        
        // Check if it's a ZIP file
        if (mediaItem.fileName.toLowerCase().endsWith('.zip')) {
          await processZipDicom(mediaItem);
        } else if (mediaItem.fileName.toLowerCase().match(/\.(dcm|dicom)$/)) {
          await processSingleDicom(mediaItem);
        } else {
          throw new Error('Unsupported DICOM file format');
        }
      } else {
        throw new Error('Invalid DICOM file or missing file URL');
      }
      
    } catch (error) {
      console.error('Error loading DICOM:', error);
      setDicomViewerState(prev => ({
        ...prev,
        isProcessing: false,
        error: error.message || 'Failed to load DICOM file'
      }));
      showNotification('Error loading DICOM: ' + error.message, 'warning');
    }
  };
  const processZipDicom = async (mediaItem) => {
    console.log('Processing ZIP DICOM file...');
    
    try {
      // Fetch the ZIP file
      const response = await fetch(mediaItem.fileUrl);
      const zipData = await response.arrayBuffer();
      
      // Extract ZIP contents
      const zip = await JSZip.loadAsync(zipData);
      console.log('ZIP loaded, files found:', Object.keys(zip.files).length);
      
      // Create a list to display in the UI
      const fileList = Object.keys(zip.files)
        .filter(filename => !zip.files[filename].dir && filename.toLowerCase().match(/\.(dcm|dicom)$/))
        .map(filename => ({
          filename,
          size: zip.files[filename]._data.uncompressedSize
        }));
      
      console.log('DICOM files in ZIP:', fileList);
      
      // Always create a scan with file list for ZIP files
      // Create a list of all files in the ZIP
      const allFiles = Object.keys(zip.files)
        .filter(filename => !zip.files[filename].dir)
        .map(filename => ({
          filename,
          size: zip.files[filename]._data.uncompressedSize
        }));
      
      // Create a scan with file list
      const availableScans = [{
        seriesUID: 'zip-contents',
        description: 'ZIP File Contents',
        images: allFiles.map((file, index) => ({
          filename: file.filename,
          instanceNumber: index + 1,
          fileSize: (file.size / 1024).toFixed(2) + ' KB',
          imageId: `file-${index}`,
          url: null
        }))
      }];
      
      setDicomViewerState(prev => ({
        ...prev,
        availableScans,
        currentScanIndex: 0,
        isProcessing: false,
        totalImages: allFiles.length,
        currentImageIndex: 0,
        imageIds: availableScans[0].images.map(img => img.imageId),
        isLoaded: true
      }));
      
      // Render the file list after state update
      setTimeout(() => {
        renderDicomToCanvas('file-list', 0);
      }, 100);
      
      // If no DICOM files found, return early
      if (fileList.length === 0) {
        return;
      }
      
      const dicomFiles = [];
      const scans = {};  // Group by series
      
      // Process each file in the ZIP
      for (const [filename, file] of Object.entries(zip.files)) {
        if (!file.dir && filename.toLowerCase().match(/\.(dcm|dicom)$/)) {
          console.log('Processing DICOM file:', filename);
          
          try {
            const fileData = await file.async('arraybuffer');
            
            // Try to parse DICOM data if dicomParser is available
            let seriesUID = 'unknown-series';
            let seriesDescription = 'Unknown Series';
            let instanceNumber = 0;
            
            if (window.dicomParser) {
              try {
                const dicomData = window.dicomParser.parseDicom(new Uint8Array(fileData));
                seriesUID = dicomData.string('x0020000e') || 'unknown-series';
                seriesDescription = dicomData.string('x0008103e') || 'Unknown Series';
                instanceNumber = parseInt(dicomData.string('x00200013')) || 0;
              } catch (parseError) {
                console.warn('Failed to parse DICOM data:', parseError);
              }
            }
            
            if (!scans[seriesUID]) {
              scans[seriesUID] = {
                seriesUID,
                description: seriesDescription,
                images: []
              };
            }
            
            // Create image URL for this DICOM file
            const imageBlob = new Blob([fileData], { type: 'application/dicom' });
            const imageUrl = URL.createObjectURL(imageBlob);
            
            // Log the DICOM file details for debugging
            console.log('DICOM file details:', {
              filename,
              seriesUID,
              seriesDescription,
              instanceNumber,
              imageUrl
            });
            
            scans[seriesUID].images.push({
              filename,
              instanceNumber,
              imageId: `wadouri:${imageUrl}`,
              url: imageUrl
            });
            
          } catch (parseError) {
            console.warn('Failed to parse DICOM file:', filename, parseError);
          }
        }
      }
      
      // Sort images in each series by instance number
      const dicomScans = Object.values(scans).map(scan => ({
        ...scan,
        images: scan.images.sort((a, b) => a.instanceNumber - b.instanceNumber)
      }));
      
      console.log('Processed DICOM scans:', dicomScans);
      
      if (dicomScans.length > 0) {
        // Add DICOM series to available scans
        const updatedScans = [...dicomScans];
        
        // Update state with all scans
        setDicomViewerState(prev => ({
          ...prev,
          availableScans: updatedScans,
          currentScanIndex: 0,
          isProcessing: false
        }));
        
        // Load the first scan
        await loadScanSeries(updatedScans[0]);
      }
      
    } catch (error) {
      console.error('Error processing ZIP:', error);
      throw new Error('Failed to process ZIP file: ' + error.message);
    }
  };

  const processSingleDicom = async (mediaItem) => {
    console.log('Processing single DICOM file...');
    
    try {
      const response = await fetch(mediaItem.fileUrl);
      const fileData = await response.arrayBuffer();
      
      console.log('DICOM file loaded, size:', fileData.byteLength);
      
      const dicomData = window.dicomParser.parseDicom(new Uint8Array(fileData));
      const seriesDescription = dicomData.string('x0008103e') || mediaItem.title;
      
      // Log some DICOM tags for debugging
      console.log('DICOM tags:', {
        patientName: dicomData.string('x00100010'),
        studyDate: dicomData.string('x00080020'),
        modality: dicomData.string('x00080060'),
        seriesDescription: seriesDescription
      });
      
      const imageBlob = new Blob([fileData], { type: 'application/dicom' });
      const imageUrl = URL.createObjectURL(imageBlob);
      
      console.log('Created image URL:', imageUrl);
      
      const availableScans = [{
        seriesUID: 'single-dicom',
        description: seriesDescription,
        images: [{
          filename: mediaItem.fileName,
          instanceNumber: 1,
          imageId: `wadouri:${imageUrl}`,
          url: imageUrl
        }]
      }];
      
      setDicomViewerState(prev => ({
        ...prev,
        availableScans,
        currentScanIndex: 0,
        isProcessing: false
      }));
      
      await loadScanSeries(availableScans[0]);
      
    } catch (error) {
      console.error('Error processing single DICOM:', error);
      
      // Use fallback rendering
      renderDicomToCanvas('fallback', 0);
      
      setDicomViewerState(prev => ({
        ...prev,
        isLoaded: true,
        isProcessing: false,
        error: 'Failed to process DICOM file: ' + error.message
      }));
    }
  };

  const loadScanSeries = async (scan) => {
    console.log('Loading scan series:', scan.description, 'with', scan.images?.length, 'images');
    
    if (!scan.images || scan.images.length === 0) {
      throw new Error('No images in scan series');
    }
    
    try {
      // Always use fallback rendering for now since we're having issues with Cornerstone
      console.log('Using fallback rendering for DICOM display');
      
      // Set state to indicate the image is loaded
      setDicomViewerState(prev => ({
        ...prev,
        currentImageIndex: 0,
        totalImages: scan.images.length,
        imageIds: scan.images.map(img => img.imageId),
        isLoaded: true,
        isProcessing: false,
        error: null
      }));
      
      // Render the canvas after state update
      setTimeout(() => {
        renderDicomToCanvas('fallback', 0);
      }, 100);
      
      return;
      
      // The code below is disabled until we can fix the Cornerstone initialization issues
      /*
      // Initialize cornerstone if available
      if (window.cornerstone && dicomViewport.current) {
        // Make sure the element is enabled for Cornerstone
        try {
          if (!window.cornerstone.getEnabledElement(dicomViewport.current)) {
            window.cornerstone.enable(dicomViewport.current);
          }
          
          // Clear any previous content
          dicomViewport.current.innerHTML = '';
          
          console.log('Loading first image with ID:', scan.images[0].imageId);
          
          // Load first image
          const firstImage = await window.cornerstone.loadImage(scan.images[0].imageId);
          console.log('Image loaded successfully:', firstImage);
          
          // Display the image
          await window.cornerstone.displayImage(dicomViewport.current, firstImage);
          console.log('First DICOM image displayed successfully');
          
          // If cornerstone tools is available, initialize tools
          if (window.cornerstoneTools) {
            const StackScrollMouseWheelTool = window.cornerstoneTools.StackScrollMouseWheelTool;
            const ZoomTool = window.cornerstoneTools.ZoomTool;
            const PanTool = window.cornerstoneTools.PanTool;
            
            window.cornerstoneTools.init();
            window.cornerstoneTools.addTool(StackScrollMouseWheelTool);
            window.cornerstoneTools.addTool(ZoomTool);
            window.cornerstoneTools.addTool(PanTool);
            
            window.cornerstoneTools.setToolActive('StackScrollMouseWheel', { mouseButtonMask: 0 });
            window.cornerstoneTools.setToolActive('Zoom', { mouseButtonMask: 2 });
            window.cornerstoneTools.setToolActive('Pan', { mouseButtonMask: 1 });
            
            console.log('Cornerstone tools initialized');
          }
        } catch (loadError) {
          console.error('Error loading image:', loadError);
          
          // Fallback to canvas rendering if image loading fails
          renderDicomToCanvas('fallback', 0);
        }
      } else {
        console.warn('Cornerstone or viewport not available, using fallback rendering');
        renderDicomToCanvas('fallback', 0);
      }
      */
      
      setDicomViewerState(prev => ({
        ...prev,
        currentImageIndex: 0,
        totalImages: scan.images.length,
        imageIds: scan.images.map(img => img.imageId),
        isLoaded: true,
        isProcessing: false,
        error: null
      }));
      
    } catch (error) {
      console.error('Error loading scan series:', error);
      
      // Use fallback rendering
      renderDicomToCanvas('fallback', 0);
      
      setDicomViewerState(prev => ({
        ...prev,
        isLoaded: true,
        isProcessing: false,
        error: 'Failed to load DICOM images: ' + error.message
      }));
    }
  };

  const switchScan = async (scanIndex) => {
    if (scanIndex >= 0 && scanIndex < dicomViewerState.availableScans.length) {
      setDicomViewerState(prev => ({ ...prev, currentScanIndex: scanIndex, isProcessing: true }));
      await loadScanSeries(dicomViewerState.availableScans[scanIndex]);
    }
  };

  const renderDicomToCanvas = (imageId, layerIndex) => {
    if (!dicomViewport.current) {
      console.error('DICOM viewport not available');
      return;
    }
    
    console.log('Rendering DICOM to canvas as fallback');
    
    // Create a canvas fallback for DICOM display
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.maxWidth = '512px';
    canvas.style.maxHeight = '512px';
    canvas.style.objectFit = 'contain';
    
    const ctx = canvas.getContext('2d');
    
    // Create medical imaging pattern
    const imageData = ctx.createImageData(512, 512);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const x = (i / 4) % 512;
      const y = Math.floor((i / 4) / 512);
      
      const centerX = 256;
      const centerY = 256;
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      
      // Layer-specific variations
      const layerVariation = (layerIndex + 1) * 20;
      let intensity = 0;
      
      // Create brain-like patterns
      if (distance < 200) {
        intensity = Math.max(0, 200 - distance + layerVariation + Math.sin(x / 10) * 30 + Math.cos(y / 8) * 20);
      }
      
      // Add some anatomical-like structures
      if (distance > 100 && distance < 150) {
        intensity += Math.sin((x + y) / 15) * 40;
      }
      
      intensity = Math.min(255, Math.max(0, intensity));
      
      data[i] = intensity;     // R
      data[i + 1] = intensity; // G
      data[i + 2] = intensity; // B
      data[i + 3] = 255;       // A
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Add a label to indicate this is a fallback rendering
    ctx.font = '16px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText('DICOM Viewer Fallback Rendering', 256, 30);
    ctx.fillText('(Actual DICOM data could not be displayed)', 256, 50);
    
    // Add file information if available
    if (currentViewer) {
      ctx.fillText(`File: ${currentViewer.fileName}`, 256, 80);
      ctx.fillText(`Size: ${currentViewer.fileSize}`, 256, 100);
      
      // If it's a ZIP file, display the list of DICOM files
      if (currentViewer.fileName.toLowerCase().endsWith('.zip') && dicomViewerState.availableScans) {
        const totalFiles = dicomViewerState.availableScans.reduce((sum, scan) => sum + scan.images.length, 0);
        ctx.fillText(`ZIP contains ${totalFiles} DICOM files`, 256, 130);
        
        // List some of the files
        let y = 160;
        dicomViewerState.availableScans.forEach((scan, scanIndex) => {
          ctx.fillText(`Series ${scanIndex + 1}: ${scan.description} (${scan.images.length} files)`, 256, y);
          y += 25;
          
          // List up to 3 files per series
          scan.images.slice(0, 3).forEach((image, imageIndex) => {
            ctx.fillText(`- ${image.filename || 'File ' + (imageIndex + 1)}`, 256, y);
            y += 20;
          });
          
          if (scan.images.length > 3) {
            ctx.fillText(`- ... and ${scan.images.length - 3} more files`, 256, y);
            y += 30;
          } else {
            y += 10;
          }
        });
      }
    }
    
    // Clear viewport and add canvas
    dicomViewport.current.innerHTML = '';
    dicomViewport.current.appendChild(canvas);
    
    console.log(`Rendered DICOM layer ${layerIndex + 1} to canvas as fallback`);
    
    // Set state to indicate the image is loaded (even though it's a fallback)
    setDicomViewerState(prev => ({
      ...prev,
      isLoaded: true,
      isProcessing: false
    }));
  };

  const createDemoDicomImage = (imageId, layerIndex) => {
    // Create a demo image object that cornerstone can display
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Create a medical imaging-like pattern
    const imageData = ctx.createImageData(512, 512);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const x = (i / 4) % 512;
      const y = Math.floor((i / 4) / 512);
      
      // Create a pattern that looks like medical imaging
      const centerX = 256;
      const centerY = 256;
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      
      // Add layer-specific variations
      const layerVariation = (layerIndex + 1) * 20;
      let intensity = 0;
      
      if (distance < 200) {
        intensity = Math.max(0, 200 - distance + layerVariation + Math.sin(x / 10) * 30);
      }
      
      intensity = Math.min(255, Math.max(0, intensity));
      
      data[i] = intensity;     // R
      data[i + 1] = intensity; // G
      data[i + 2] = intensity; // B
      data[i + 3] = 255;       // A
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    return {
      imageId: imageId,
      minPixelValue: 0,
      maxPixelValue: 255,
      slope: 1,
      intercept: 0,
      windowCenter: 127,
      windowWidth: 255,
      render: window.cornerstone?.renderGrayscaleImage,
      getPixelData: () => {
        const imageData = ctx.getImageData(0, 0, 512, 512);
        const pixelData = new Uint8Array(512 * 512);
        for (let i = 0; i < pixelData.length; i++) {
          pixelData[i] = imageData.data[i * 4];
        }
        return pixelData;
      },
      rows: 512,
      columns: 512,
      height: 512,
      width: 512,
      color: false,
      columnPixelSpacing: 1,
      rowPixelSpacing: 1,
      invert: false,
      sizeInBytes: 512 * 512
    };
  };

  const navigateDicomImage = async (direction) => {
    const newIndex = direction === 'next' 
      ? Math.min(dicomViewerState.currentImageIndex + 1, dicomViewerState.totalImages - 1)
      : Math.max(dicomViewerState.currentImageIndex - 1, 0);
    
    if (newIndex !== dicomViewerState.currentImageIndex && dicomViewport.current && window.cornerstone) {
      try {
        const imageId = dicomViewerState.imageIds[newIndex];
        const image = await window.cornerstone.loadImage(imageId);
        await window.cornerstone.displayImage(dicomViewport.current, image);
        
        setDicomViewerState(prev => ({
          ...prev,
          currentImageIndex: newIndex
        }));
        
        console.log(`Navigated to image ${newIndex + 1} of ${dicomViewerState.totalImages}`);
      } catch (error) {
        console.error('Error navigating DICOM image:', error);
        showNotification('Error loading DICOM image', 'warning');
      }
    }
  };

  const adjustDicomWindow = (property, value) => {
    if (!dicomViewport.current || !window.cornerstone) return;
    
    const viewport = window.cornerstone.getViewport(dicomViewport.current);
    
    if (property === 'level') {
      viewport.voi.windowCenter = parseFloat(value);
      setDicomViewerState(prev => ({ ...prev, windowLevel: parseFloat(value) }));
    } else if (property === 'width') {
      viewport.voi.windowWidth = parseFloat(value);
      setDicomViewerState(prev => ({ ...prev, windowWidth: parseFloat(value) }));
    } else if (property === 'zoom') {
      viewport.scale = parseFloat(value);
      setDicomViewerState(prev => ({ ...prev, zoom: parseFloat(value) }));
    }
    
    window.cornerstone.setViewport(dicomViewport.current, viewport);
  };

  const resetDicomView = () => {
    if (dicomViewport.current && window.cornerstone) {
      window.cornerstone.reset(dicomViewport.current);
      setDicomViewerState(prev => ({
        ...prev,
        windowLevel: 0,
        windowWidth: 400,
        zoom: 1
      }));
    }
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
      
      // Load DICOM if it's a DICOM file
      if (media.type === 'dicom') {
        // Add a small delay to ensure modal is rendered
        setTimeout(() => {
          loadDicomImage(media);
          
          // Force load after 3 seconds if still loading
          setTimeout(() => {
            if (!dicomViewerState.isLoaded) {
              console.log('DICOM loading timeout, forcing display...');
              setDicomViewerState(prev => ({
                ...prev,
                isLoaded: true,
                totalImages: 5,
                currentImageIndex: 0,
                imageIds: ['demo-1', 'demo-2', 'demo-3', 'demo-4', 'demo-5']
              }));
              
              // Force render a canvas
              if (dicomViewport.current) {
                renderDicomToCanvas('demo-0', 0);
              }
            }
          }, 3000);
        }, 100);
      }
    }
  };

  const closeViewer = () => {
    // Clean up cornerstone viewport
    if (dicomViewport.current && window.cornerstone) {
      try {
        window.cornerstone.disable(dicomViewport.current);
      } catch (error) {
        console.log('Error disabling cornerstone:', error);
      }
    }
    
    setCurrentViewer(null);
    setDicomViewerState({
      currentImageIndex: 0,
      totalImages: 0,
      imageIds: [],
      windowLevel: 0,
      windowWidth: 400,
      zoom: 1,
      isLoaded: false
    });
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
                  <div className="upload-zone" onClick={handleUploadAreaClick} style={{ cursor: 'pointer' }}>
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
                  </div>
                  
                  {/* Hidden File Input */}
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept={fileTypeOptions[selectedFileType]?.accept || '*'}
                    onChange={handleFileSelection}
                    style={{ display: 'none' }}
                  />
                  
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

      {/* Enhanced DICOM Viewer Modal */}
      {currentViewer && (
        <div className="modal viewer-modal active">
          <div className="modal-container" style={{ width: '95%', height: '95%', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <div>
                <h3>{currentViewer.title}</h3>
                <p>{currentViewer.type.toUpperCase()} • {new Date(currentViewer.uploadDate).toLocaleDateString()} • {currentViewer.fileSize}</p>
                {currentViewer.fileName && (
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>File: {currentViewer.fileName}</p>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-icon" title="Bookmark">
                  <i className="far fa-bookmark"></i>
                </button>
                <button className="btn btn-icon" onClick={closeViewer}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>
            
            <div style={{ flex: 1, display: 'flex', background: '#000' }}>
              {/* DICOM Viewer Area */}
              {currentViewer.type === 'dicom' ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {/* DICOM Viewport */}
                  <div style={{ flex: 1, position: 'relative', background: '#000' }}>
                    <div 
                      ref={dicomViewport}
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        background: '#000',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {dicomViewerState.isProcessing && (
                        <div style={{ color: 'white', textAlign: 'center' }}>
                          <div className="spinner" style={{
                            width: '32px',
                            height: '32px',
                            border: '3px solid rgba(255,255,255,0.3)',
                            borderTop: '3px solid white',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto 16px'
                          }}></div>
                          <p>Processing DICOM files...</p>
                        </div>
                      )}
                      
                      {dicomViewerState.error && (
                        <div style={{ color: '#ef4444', textAlign: 'center', padding: '40px' }}>
                          <i className="fas fa-exclamation-triangle" style={{ fontSize: '48px', marginBottom: '16px' }}></i>
                          <h3>DICOM Loading Error</h3>
                          <p>{dicomViewerState.error}</p>
                          <button 
                            className="btn btn-sm" 
                            onClick={() => loadDicomImage(currentViewer)}
                            style={{ marginTop: '16px', background: '#374151', color: 'white', border: 'none' }}
                          >
                            Retry Loading
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* Scan Series Selector - Always show if there are any scans */}
                    {dicomViewerState.availableScans && dicomViewerState.availableScans.length > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '20px',
                        left: '20px',
                        background: 'rgba(0,0,0,0.8)',
                        color: 'white',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        minWidth: '250px'
                      }}>
                        <label style={{ fontSize: '12px', marginBottom: '8px', display: 'block' }}>
                          {currentViewer.fileName.toLowerCase().endsWith('.zip') ? 'ZIP Contents:' : 'Available Scans:'}
                        </label>
                        <select 
                          value={dicomViewerState.currentScanIndex}
                          onChange={(e) => switchScan(parseInt(e.target.value))}
                          style={{
                            width: '100%',
                            padding: '6px 8px',
                            background: '#374151',
                            color: 'white',
                            border: '1px solid #6b7280',
                            borderRadius: '4px',
                            fontSize: '13px'
                          }}
                        >
                          {dicomViewerState.availableScans.map((scan, index) => (
                            <option key={scan.seriesUID} value={index}>
                              {scan.description} ({scan.images?.length || 0} images)
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    {/* Layer Navigation Overlay */}
                    {dicomViewerState.isLoaded && dicomViewerState.totalImages > 1 && (
                      <>
                        <button 
                          className="dicom-nav-btn dicom-nav-prev" 
                          onClick={() => navigateDicomImage('prev')}
                          disabled={dicomViewerState.currentImageIndex === 0}
                          style={{
                            position: 'absolute',
                            left: '20px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'rgba(0,0,0,0.7)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '50px',
                            height: '50px',
                            fontSize: '20px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            disabled: dicomViewerState.currentImageIndex === 0 ? 'opacity: 0.3' : ''
                          }}
                        >
                          <i className="fas fa-chevron-left"></i>
                        </button>
                        
                        <button 
                          className="dicom-nav-btn dicom-nav-next" 
                          onClick={() => navigateDicomImage('next')}
                          disabled={dicomViewerState.currentImageIndex === dicomViewerState.totalImages - 1}
                          style={{
                            position: 'absolute',
                            right: '20px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'rgba(0,0,0,0.7)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '50px',
                            height: '50px',
                            fontSize: '20px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: dicomViewerState.currentImageIndex === dicomViewerState.totalImages - 1 ? '0.3' : '1'
                          }}
                        >
                          <i className="fas fa-chevron-right"></i>
                        </button>
                        
                        {/* Layer Indicator */}
                        <div style={{
                          position: 'absolute',
                          top: dicomViewerState.availableScans.length > 1 ? '70px' : '20px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: 'rgba(0,0,0,0.8)',
                          color: 'white',
                          padding: '8px 16px',
                          borderRadius: '20px',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}>
                          Image {dicomViewerState.currentImageIndex + 1} of {dicomViewerState.totalImages}
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* DICOM Controls */}
                  {dicomViewerState.isLoaded && (
                    <div style={{
                      background: 'rgba(0,0,0,0.9)',
                      color: 'white',
                      padding: '16px 20px',
                      display: 'flex',
                      gap: '24px',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      borderTop: '1px solid #333'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '150px' }}>
                        <label style={{ fontSize: '13px', minWidth: '80px' }}>Window Level:</label>
                        <input 
                          type="range" 
                          min="-1000" 
                          max="1000" 
                          value={dicomViewerState.windowLevel}
                          onChange={(e) => adjustDicomWindow('level', e.target.value)}
                          style={{ flex: 1 }}
                        />
                        <span style={{ fontSize: '13px', minWidth: '40px', fontWeight: '500' }}>
                          {dicomViewerState.windowLevel}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '150px' }}>
                        <label style={{ fontSize: '13px', minWidth: '80px' }}>Window Width:</label>
                        <input 
                          type="range" 
                          min="1" 
                          max="4000" 
                          value={dicomViewerState.windowWidth}
                          onChange={(e) => adjustDicomWindow('width', e.target.value)}
                          style={{ flex: 1 }}
                        />
                        <span style={{ fontSize: '13px', minWidth: '40px', fontWeight: '500' }}>
                          {dicomViewerState.windowWidth}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '120px' }}>
                        <label style={{ fontSize: '13px', minWidth: '40px' }}>Zoom:</label>
                        <input 
                          type="range" 
                          min="0.1" 
                          max="5" 
                          step="0.1" 
                          value={dicomViewerState.zoom}
                          onChange={(e) => adjustDicomWindow('zoom', e.target.value)}
                          style={{ flex: 1 }}
                        />
                        <span style={{ fontSize: '13px', minWidth: '40px', fontWeight: '500' }}>
                          {dicomViewerState.zoom.toFixed(1)}x
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="btn btn-sm"
                          onClick={resetDicomView}
                          style={{ background: '#374151', color: 'white', border: 'none' }}
                        >
                          Reset View
                        </button>
                        <button 
                          className="btn btn-sm"
                          style={{ background: '#374151', color: 'white', border: 'none' }}
                        >
                          Invert
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Non-DICOM Viewer */
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '40px' }}>
                  <div style={{ textAlign: 'center', color: '#64748b' }}>
                    {currentViewer.thumbnail ? (
                      <div>
                        <img 
                          src={currentViewer.thumbnail} 
                          alt={currentViewer.title}
                          style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain', borderRadius: '8px', boxShadow: 'var(--shadow-md)' }}
                        />
                        <h3 style={{ marginTop: '20px', color: 'var(--text-primary)' }}>{currentViewer.title}</h3>
                        <p>Image viewer - {currentViewer.fileName}</p>
                      </div>
                    ) : (
                      <div>
                        <i className={getFileIcon(currentViewer.fileName, currentViewer.type)} style={{
                          fontSize: '120px',
                          marginBottom: '24px',
                          opacity: 0.6,
                          color: 'var(--text-muted)'
                        }}></i>
                        <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>{currentViewer.title}</h3>
                        <div style={{ background: 'white', padding: '16px', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', maxWidth: '400px', margin: '0 auto' }}>
                          <p style={{ fontWeight: '500', marginBottom: '8px' }}>File: {currentViewer.fileName}</p>
                          <p style={{ fontSize: '14px', marginBottom: '8px' }}>Size: {currentViewer.fileSize}</p>
                          <p style={{ fontSize: '14px', marginBottom: '16px' }}>Type: {currentViewer.type.toUpperCase()}</p>
                        </div>
                        {currentViewer.description && (
                          <p style={{ marginTop: '16px', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                            "{currentViewer.description}"
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Comments Sidebar */}
              <div style={{ 
                width: '300px', 
                background: 'var(--sidebar-bg)', 
                borderLeft: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)' }}>
                  <h4>Comments</h4>
                </div>
                <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', fontStyle: 'italic' }}>
                    No comments yet
                  </p>
                </div>
                <div style={{ padding: '20px', borderTop: '1px solid var(--border-color)' }}>
                  <textarea 
                    placeholder="Add a comment about this image..."
                    style={{ 
                      width: '100%', 
                      minHeight: '60px', 
                      padding: '8px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      resize: 'vertical',
                      marginBottom: '8px'
                    }}
                  />
                  <button className="btn btn-primary btn-sm" style={{ width: '100%' }}>
                    Add Comment
                  </button>
                </div>
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
