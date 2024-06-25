let imageIndex = 0;
let imageDataArray = [];

function previewImages() {
    var files = document.getElementById('imageInput').files;
    var preview = document.getElementById('preview');
    preview.innerHTML = ''; // Clear existing previews

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

        var reader = new FileReader();
        reader.onload = function(e) {
            var imgElement = document.createElement('img');
            imgElement.src = e.target.result;
            preview.appendChild(imgElement);
        };
        reader.readAsDataURL(file);
    });
}

// uploadImages function is called when the user clicks the upload button.
function uploadImages() {
    var files = document.getElementById('imageInput').files;
    if (files.length === 0) {
        alert('No files selected. Please select some images to upload.');
        return;
    }

    var formData = new FormData();
    Array.from(files).forEach(file => {
        formData.append('files[]', file, file.name);
    });

    sendImagesToServer(formData);
}

// sendImagesToServer function sends the uploaded images to the server.
function sendImagesToServer(formData) {
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
            var mapArea = document.getElementById('map');
            mapArea.style.display = 'block';
            imageDataArray = data;
            initMap(data);
            displayImages(imageIndex);

            // Show the image overlay after successful upload
            document.getElementById('image-overlay').style.display = 'flex';
        }
    }).catch(error => {
        console.error('Error:', error);
    });
}

async function initMap(data) {
    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

    const center = { lat: -34.397, lng: 150.644 }; // Default center, you might want to set this dynamically based on your data

    const map = new Map(document.getElementById("map"), {
        center: center,
        zoom: 8,
        mapId: "DEMO_MAP_ID" // Replace with your own map ID
    });

    // Add markers for each image with GPS data
    data.forEach((imageData, index) => {
        if (imageData.exif_data && imageData.exif_data.gps) {
            const location = imageData.exif_data.gps;
            console.log('Location:', location); // Debug: log location data

            if (typeof location === 'string') {
                const [lat, lng] = location.split(',').map(Number);

                const marker = new AdvancedMarkerElement({
                    map: map,
                    position: { lat: lat, lng: lng },
                    title: 'Image Location' // You can customize the title
                });

                // Store marker reference in imageData
                imageData.marker = marker;
                console.log("Marker created", marker);
            } else {
                console.error('Location is not a string:', location); // Debug: log unexpected location format
            }
        } else {
            console.error('Invalid image data or missing location:', imageData); // Debug: log invalid image data
        }
    });

    // Log the entire imageDataArray to verify markers are assigned
    console.log("imageDataArray after marker assignment:", data);

    // Adjust the map to fit all markers
    const bounds = new google.maps.LatLngBounds();
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
}

function displayImages(index) {
    if (imageDataArray.length === 0) {
        console.error("No images in imageDataArray");
        return;
    }

    const imageCarousel = document.getElementById('image-carousel');
    imageCarousel.innerHTML = ''; // Clear existing images

    imageDataArray.forEach((imageData, i) => {
        const imgElement = document.createElement('img');
        imgElement.src = imageData.image_bytes;
        imgElement.className = i === index ? 'active' : '';
        imageCarousel.appendChild(imgElement);
    });

    console.log("Displaying images in carousel");

    const currentImageData = imageDataArray[index];
    const marker = currentImageData.marker;
    console.log("Marker in displayImages function:", marker);
    if (marker && marker.map) {
        marker.map.panTo(marker.position);
        marker.map.setZoom(10);
    } else {
        console.warn("Marker or marker's map not found for image data", currentImageData);
    }
}

function prevImage() {
    if (imageIndex > 0) {
        imageIndex--;
        displayImages(imageIndex);
    }
}

function nextImage() {
    if (imageIndex < imageDataArray.length - 1) {
        imageIndex++;
        displayImages(imageIndex);
    }
}