import React, { useState, useEffect, useRef } from 'react';
import styles from './MappedOut.module.css';

let imageIndex = 0;
let imageDataArray = [];

const MappedOut = () => {
    const [previewImages, setPreviewImages] = useState([]);
    const mapRef = useRef(null);

    useEffect(() => {
        const loadGoogleMapsScript = () => {
            return new Promise((resolve, reject) => {
                const existingScript = document.getElementById('googleMaps');

                if (!existingScript) {
                    const script = document.createElement('script');
                    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCs15m1JY0Sr9xOUtY4XDFym0R2ww-kyT8&v=weekly&libraries=places`;
                    script.id = 'googleMaps';
                    document.body.appendChild(script);

                    script.onload = () => {
                        resolve();
                    };

                    script.onerror = () => {
                        reject(new Error('Google Maps JavaScript API could not load.'));
                    };
                } else {
                    resolve();
                }
            });
        };

        loadGoogleMapsScript().then(() => {
            // Google Maps script loaded successfully
        }).catch((error) => {
            console.error(error);
        });
    }, []);

    const previewImagesHandler = (event) => {
        const files = event.target.files;
        const preview = [];

        document.getElementById('preview').innerHTML = ''; // Clear existing previews

        if (files.length === 0) {
            alert('Please select at least one image.');
            return;
        }

        if (files.length > 10) {
            alert('Please select no more than 10 images.');
            return;
        }

        Array.from(files).forEach(file => {
            if (!file.type.startsWith('image/')) {
                alert('Only image files are allowed.');
                return;
            }

            const maxFileSize = 5 * 1024 * 1024; // 5 MB
            if (file.size > maxFileSize) {
                alert('File size must not exceed 5 MB.');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                preview.push(e.target.result);
                const imgElement = document.createElement('img');
                imgElement.src = e.target.result;
                imgElement.style.maxWidth = '100%'; // Ensures width does not exceed container
                imgElement.style.maxHeight = '150px'; // Ensures height is controlled
                imgElement.style.objectFit = 'contain'; // Keeps aspect ratio intact
                document.getElementById('preview').appendChild(imgElement);
            };
            reader.readAsDataURL(file);
        });

        setPreviewImages(preview);
    };

    const uploadImagesHandler = () => {
        const files = document.getElementById('imageInput').files;
        if (files.length === 0) {
            alert('No files selected. Please select some images to upload.');
            return;
        }

        const formData = new FormData();
        Array.from(files).forEach(file => {
            formData.append('files[]', file, file.name);
        });

        sendImagesToServer(formData);
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

                document.getElementById('uploadForm').style.display = 'none';
                mapRef.current.style.display = 'block';
                initMap(data);

                imageDataArray = data;
                displayImage(imageIndex);
            }
        }).catch(error => {
            console.error('Error:', error);
        });
    };

    const initMap = async (data) => {
        if (!window.google) {
            console.error('Google Maps JavaScript API is not loaded.');
            return;
        }

        const { Map } = await window.google.maps.importLibrary("maps");
        const { AdvancedMarkerElement } = await window.google.maps.importLibrary("marker");

        const center = { lat: -34.397, lng: 150.644 };

        const map = new Map(mapRef.current, {
            center: center,
            zoom: 8,
            mapId: "DEMO_MAP_ID"
        });

        mapRef.current.getMap = () => map;

        const overlay = new window.google.maps.OverlayView();
        overlay.onAdd = function() {
            const layer = document.createElement('div');
            layer.id = 'image-overlay';

            const container = document.createElement('div');
            container.id = 'image-preview-container';

            const prevButton = document.createElement('button');
            prevButton.id = 'prev-button';
            prevButton.innerText = 'Previous';
            prevButton.onclick = prevImage;

            const nextButton = document.createElement('button');
            nextButton.id = 'next-button';
            nextButton.innerText = 'Next';
            nextButton.onclick = nextImage;

            const imgElement = document.createElement('img');
            imgElement.id = 'image-preview';
            imgElement.src = '';

            container.appendChild(prevButton);
            container.appendChild(imgElement);
            container.appendChild(nextButton);

            layer.appendChild(container);
            this.getPanes().overlayLayer.appendChild(layer);
            this.getPanes().overlayLayer.addEventListener('mousedown', (event) => {
                // Check if the target is one of the buttons
                if (event.target.id === 'prev-button' || event.target.id === 'next-button') {
                    // Manually dispatch the event to the button
                    event.target.dispatchEvent(new MouseEvent('click'));
                }
            });
        };
    overlay.draw = function() {};
    overlay.setMap(map);

        data.forEach((imageData, index) => {
            if (imageData.exif_data && imageData.exif_data.gps) {
                const location = imageData.exif_data.gps;
                console.log('Location:', location);

                if (typeof location === 'string') {
                    const [lat, lng] = location.split(',').map(Number);

                    const marker = new AdvancedMarkerElement({
                        map: map,
                        position: { lat: lat, lng: lng },
                        title: 'Image Location'
                    });

                    imageData.marker = marker;
                } else {
                    console.error('Location is not a string:', location);
                }
            } else {
                console.error('Invalid image data or missing location:', imageData);
            }
        });

        const bounds = new window.google.maps.LatLngBounds();
        data.forEach(imageData => {
            if (imageData.exif_data && imageData.exif_data.gps) {
                const location = imageData.exif_data.gps;
                if (typeof location === 'string') {
                    const [lat, lng] = location.split(',').map(Number);
                    bounds.extend({ lat: lat, lng: lng });
                }
            }
        });
        map.fitBounds(bounds);
        map.panTo(data[0].marker.position);
    };

    const displayImage = (index) => {
        if (imageDataArray.length === 0) return;
    
        const imagePreview = document.getElementById('image-preview');
        imagePreview.src = imageDataArray[index].image_bytes;
    
        const marker = imageDataArray[index].marker;
        if (marker) {
            // Use mapRef to access the map
            const map = mapRef.current.getMap();
            map.panTo(marker.position);
            map.setZoom(10);
        }
    };

    const prevImage = () => {
        if (imageIndex > 0) {
            imageIndex--;
            displayImage(imageIndex);
        }
    };

    const nextImage = () => {
        if (imageIndex < imageDataArray.length - 1) {
            imageIndex++;
            displayImage(imageIndex);
        }
    };

    return (
        <div>
            <form id="uploadForm" className={styles.uploadForm}>
                <h1>Threaded</h1>
                <h2>The thread of fate continues to unravel...</h2>
                <label htmlFor="imageInput" className={styles.customFileInput}>
                    <div className={styles.uploadIcon}>+</div>
                </label>
                <input type="file" id="imageInput" className={styles.imageInput} accept="image/*" multiple onChange={previewImagesHandler} />
                <button type="button" onClick={uploadImagesHandler}>Upload Images</button>
                <div id="preview" className={styles.preview}></div>
            </form>
            <div id="map" className={styles.map} ref={mapRef}></div>
        </div>
    );
};

export default MappedOut;