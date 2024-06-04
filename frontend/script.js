// previewImages function is called when the user selects images for uploading.
function previewImages() {
    var files = document.getElementById('imageInput').files;
    var preview = document.getElementById('preview');
    preview.innerHTML = ''; // Clear existing previews

    if (files.length == 0) {
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
            imgElement.style.maxWidth = '100%'; // Ensures width does not exceed container
            imgElement.style.maxHeight = '150px'; // Ensures height is controlled
            imgElement.style.objectFit = 'contain'; // Keeps aspect ratio intact
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
        if (!response.ok) { // Checks if the response status code is not in the range 200-299
            throw new Error('Network response was not ok: ' +  response.statusText);
        } 
        return response.json(); // Process the response if it's OK
    }).then(data => {
        if (data.error) {
            alert("Server Error: " + data.error); 
        } else {
            console.log('Success:', data);

            // Hide the upload form and show the map area
            uploadForm.style.display = 'none';
            var mapArea = document.getElementById('map');  // Ensure this ID matches your HTML
            mapArea.style.display = 'block';  // Show the map area
            initMap(data); // Pass the data to the initMap function
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
        mapId: "DEMO_MAP_ID" // Replace with our own map ID
    });

    // Add markers for each image with GPS data
    data.forEach(imageData => {
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
            } else {
                console.error('Location is not a string:', location); // Debug: log unexpected location format
            }
        } else {
            console.error('Invalid image data or missing location:', imageData); // Debug: log invalid image data
        }
    });

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
