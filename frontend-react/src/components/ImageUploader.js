import React, { useState, forwardRef, useImperativeHandle } from 'react';

const ImageUploader = forwardRef(({ onUploadSuccess }, ref) => {
  const [images, setImages] = useState([]);
  const [error, setError] = useState(null);

  useImperativeHandle(ref, () => ({
    reset: () => {
      setImages([]);
      setError(null);
    }
  }));

  const handleFileChange = (e) => {
    const selectedImages = e.target.files;
    if (selectedImages.length > 10) {
      setError('You can only upload up to 10 images at a time.');
      return;
    }
    setImages((prevImages) => [...prevImages, ...selectedImages]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedImages = e.dataTransfer.files;
    if (droppedImages.length > 10) {
      setError('You can only upload up to 10 images at a time.');
      return;
    }
    setImages((prevImages) => [...prevImages, ...droppedImages]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const sendImagesToServer = (formData) => {
    fetch('http://127.0.0.1:5000/parse', {
      method: 'POST',
      body: formData
    }).then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok: ' + response.statusText);
      }
      return response.json();
    }).then(data => {
      if (data.error) {
        alert("Server Error: " + data.error);
      } else {
        console.log('Success:', data);
        onUploadSuccess(data); 
      }
    }).catch(error => {
      console.error('Error:', error);
    });
  };

  const handleUpload = () => {
    if (images.length === 0) {
      setError('No files selected. Please select some images to upload.');
      return;
    }

    const formData = new FormData();
    images.forEach(image => {
      formData.append('files[]', image, image.name);
    });

    sendImagesToServer(formData);
  };

  return (
    <div>
      <div
        id="uploadForm"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        style={{
          border: '1px solid #ccc',
          padding: '20px',
          width: '50%',
          margin: '20px auto',
          textAlign: 'center',
        }}
      >
        <p>Drag and drop images here or select them below:</p>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
        />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <ul>
          {images.map((image, index) => (
            <li key={index}>{image.name}</li>
          ))}
        </ul>
      </div>
      <button onClick={handleUpload}>Upload Images</button>
    </div>
  );
});

export default ImageUploader;
