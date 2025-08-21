# DICOM Viewer Component - Pure JavaScript

A comprehensive, embeddable DICOM viewer component that can be integrated into any web application, including Ruby projects. This component provides advanced medical imaging capabilities with a professional medical application interface.

## Features

### 🔬 DICOM Support
- **Full DICOM Viewing**: Native DICOM file support with cornerstone.js
- **Advanced Controls**: Window level/width adjustment, zoom, pan, invert
- **Sequence Navigation**: Navigate through multi-frame DICOM datasets
- **Compressed DICOM**: Support for compressed and ZIP-packaged DICOM files

### 📁 Multi-Format Support
- **DICOM**: .dcm, .dicom files with full medical imaging capabilities
- **Images**: JPG, PNG with standard image viewer
- **Videos**: MP4, AVI, MOV with video player controls
- **Thumbnails**: Automatic thumbnail generation for supported formats

### 🎯 Core Features
- **File Upload**: Multi-step upload with file type specification
- **Metadata Management**: Title, description, upload date tracking
- **Comments System**: Add and view comments on any media file
- **Bookmarking**: Mark important files for quick access
- **Tabbed Interface**: "All" and "Bookmarked" views
- **Professional UI**: Matches Milano medical app styling

### 🛠 Technical Features
- **CDN with Fallback**: External libraries with local fallback capability
- **Responsive Design**: Works on desktop and mobile devices
- **Pure JavaScript**: No framework dependencies
- **localStorage Persistence**: Data persists between sessions
- **Event-Driven Architecture**: Easy to extend and customize

## Quick Start

### 1. Basic Integration
```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="dicom-viewer.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>
    <div class="dicom-viewer-container">
        <!-- Component HTML structure goes here -->
    </div>
    
    <script src="dicom-libraries.js"></script>
    <script src="dicom-viewer.js"></script>
</body>
</html>
```

### 2. Ruby on Rails Integration
```erb
<!-- In your Rails view -->
<div id="dicom-viewer-section">
    <%= render partial: 'shared/dicom_viewer' %>
</div>

<!-- In app/views/shared/_dicom_viewer.html.erb -->
<div class="dicom-viewer-container">
    <!-- Include the dicom-viewer.html content here -->
</div>

<%= javascript_include_tag 'dicom-libraries' %>
<%= javascript_include_tag 'dicom-viewer' %>
<%= stylesheet_link_tag 'dicom-viewer' %>
```

### 3. Sinatra Integration
```ruby
# In your Sinatra app
get '/patient/:id/dicom' do
  erb :dicom_viewer, locals: { patient_id: params[:id] }
end

# In views/dicom_viewer.erb
<link rel="stylesheet" href="/css/dicom-viewer.css">
<div class="dicom-viewer-container">
    <!-- Component HTML -->
</div>
<script src="/js/dicom-libraries.js"></script>
<script src="/js/dicom-viewer.js"></script>
```

## File Structure

```
dicom-viewer/
├── dicom-viewer.html          # Main component HTML structure
├── dicom-viewer.css           # Milano-style medical UI styling
├── dicom-viewer.js            # Core component logic
├── dicom-libraries.js         # External library loader with fallback
└── README-DICOM-VIEWER.md     # This documentation file
```

## External Dependencies

The component automatically loads these libraries via CDN with fallback capability:

- **cornerstone-core**: Core DICOM viewing engine
- **cornerstone-tools**: Advanced DICOM manipulation tools
- **dicom-parser**: DICOM file parsing
- **cornerstone-wado-image-loader**: DICOM image loading
- **Font Awesome**: Icons for the interface

## Configuration

### Setting Local Fallbacks
```javascript
// Optional: Set fallback URLs for offline functionality
window.libraryLoader.setFallbacks({
    cornerstone: './libs/cornerstone.min.js',
    cornerstoneTools: './libs/cornerstoneTools.min.js',
    dicomParser: './libs/dicomParser.min.js',
    cornerstoneWADOImageLoader: './libs/cornerstoneWADOImageLoader.bundle.min.js'
});
```

### Customizing the Component
```javascript
// Initialize with custom configuration
const viewer = new DicomViewerComponent('customContainerId');

// Listen for DICOM events
window.addEventListener('dicomReady', () => {
    console.log('DICOM functionality is ready');
});
```

## API Integration

### Backend Integration Points

For full functionality, integrate these backend endpoints:

```javascript
// Example API integration points
const API_ENDPOINTS = {
    uploadFile: '/api/patient/{id}/media/upload',
    getMedia: '/api/patient/{id}/media',
    addComment: '/api/media/{id}/comments',
    toggleBookmark: '/api/media/{id}/bookmark'
};
```

### Ruby on Rails API Example
```ruby
# routes.rb
resources :patients do
  resources :media do
    resources :comments, only: [:create, :index]
    patch :bookmark, on: :member
  end
end

# media_controller.rb
class MediaController < ApplicationController
  def create
    @media = current_patient.media.build(media_params)
    if @media.save
      render json: @media, status: :created
    else
      render json: @media.errors, status: :unprocessable_entity
    end
  end
  
  def index
    @media = current_patient.media.includes(:comments)
    render json: @media
  end
  
  private
  
  def media_params
    params.require(:media).permit(:title, :description, :file_type, :file)
  end
end
```

## Styling and Theming

The component uses CSS custom properties for easy theming:

```css
:root {
    --primary-color: #6366f1;
    --primary-hover: #5855eb;
    --text-primary: #1e293b;
    --text-secondary: #64748b;
    --background: #ffffff;
    --sidebar-bg: #f8fafc;
    /* ... more variables */
}
```

## Browser Support

- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+

## Security Considerations

- File uploads should be validated server-side
- DICOM files may contain PHI - ensure proper access controls
- Consider CSP policies for external CDN resources
- Implement proper authentication and authorization

## Performance

- Lazy loading of DICOM libraries
- Thumbnail generation for faster preview
- Virtual scrolling for large media collections
- Web Workers for DICOM processing (via cornerstone)

## Troubleshooting

### DICOM Files Not Loading
1. Check browser console for library loading errors
2. Verify DICOM file format compatibility
3. Ensure proper CORS headers for file access

### Styling Issues
1. Verify CSS file is loaded
2. Check for CSS conflicts with existing styles
3. Ensure Font Awesome icons are available

### Performance Issues
1. Monitor memory usage with large DICOM files
2. Consider implementing pagination for large media collections
3. Use appropriate image compression for thumbnails

## License

This component is designed to work with open-source medical imaging libraries. Ensure compliance with your project's licensing requirements.

## Support

For integration assistance or custom modifications, refer to the component source code comments and console logging for debugging information.