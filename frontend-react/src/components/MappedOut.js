import React, { useEffect, useRef, useState } from 'react';
import styles from './MappedOut.module.css';
import ImageUploader from './ImageUploader';

let imageIndex = 0;
let imageDataArray = [];

const MappedOut = () => {
    const mapRef = useRef(null);
    const uploaderRef = useRef(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

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

    const initMap = async (data) => {
        console.log("map loading");
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
            layer.className = styles.imageOverlay; // Use CSS module class

            const container = document.createElement('div');
            container.className = styles.imagePreviewContainer; // Use CSS module class

            const prevButton = document.createElement('button');
            prevButton.className = styles.prevButton; // Use CSS module class
            prevButton.innerText = 'Previous';
            prevButton.onclick = prevImage;

            const nextButton = document.createElement('button');
            nextButton.className = styles.nextButton; // Use CSS module class
            nextButton.innerText = 'Next';
            nextButton.onclick = nextImage;

            const imgElement = document.createElement('img');
            imgElement.className = styles.imagePreview; // Use CSS module class
            imgElement.src = '';

            container.appendChild(prevButton);
            container.appendChild(imgElement);
            container.appendChild(nextButton);

            layer.appendChild(container);
            this.getPanes().overlayLayer.appendChild(layer);
            this.getPanes().overlayLayer.addEventListener('mousedown', (event) => {
                if (event.target.className === styles.prevButton || event.target.className === styles.nextButton) {
                    event.target.dispatchEvent(new MouseEvent('click'));
                }
            });
        };
        overlay.draw = function() {};
        overlay.setMap(map);
        console.log("my thing should be happening");
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

        const imagePreview = document.querySelector(`.${styles.imagePreview}`);
        if (imagePreview) {
            imagePreview.src = imageDataArray[index].image_bytes;

            const marker = imageDataArray[index].marker;
            if (marker) {
                const map = mapRef.current.getMap();
                map.panTo(marker.position);
                map.setZoom(10);
            }
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

    const handleUploadSuccess = (data) => {
        if (uploaderRef.current) {
            uploaderRef.current.reset();
        }
        setIsModalOpen(true);
        initMap(data);

        imageDataArray = data;
        setTimeout(() => {
            displayImage(imageIndex);
        }, 0); // Delay to ensure modal is rendered
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    return (
        <div>
            <ImageUploader ref={uploaderRef} onUploadSuccess={handleUploadSuccess} />
            {isModalOpen && (
                <div>
                    <div className={styles.overlay} onClick={closeModal}></div>
                    <div className={styles.mapContainer}>
                        <button className={styles.closeButton} onClick={closeModal}>X</button>
                        <div className={styles.map} ref={mapRef}></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MappedOut;
