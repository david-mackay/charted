function uploadImages() {
    var files = document.getElementById('imageInput').files;
    var preview = document.getElementById('preview');
    preview.innerHTML = ''; // Clear previous previews

    if (files.length > 10) {
        alert('Please select no more than 10 images.');
        return;
    }

    var formData = new FormData();
    var totalSize = 0;

    Array.from(files).forEach((file, index) => {
        if (!file.type.startsWith('image/')) {
            alert('Only image files are allowed.');
            return;
        }

        const maxFileSize = 5 * 1024 * 1024; // 5 MB
        if (file.size > maxFileSize) {
            alert('File size must not exceed 5 MB.');
            return;
        }

        totalSize += file.size;
        formData.append('files[]', file, file.name); // Append each file to the FormData object
    });

    // Check if total size of files exceeds some limit, for example 50MB
    if (totalSize > 50 * 1024 * 1024) {
        alert('Total file size must not exceed 50 MB.');
        return;
    }

    // Now we have a FormData object with all the files
    sendImagesToServer(formData);
    Array.from(files).forEach(file => {
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
    // Hide the upload form and show the map area
    uploadForm.style.display = 'none';
    // Define the mapArea variable here
    var mapArea = document.getElementById('map');  // Ensure this ID matches your HTML
    mapArea.style.display = 'block';  // Show the map area
}

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
        console.log('Success:', data);
        // Render maps and handle the response data here
        initMap();
    }).catch(error => {
        console.error('Error:', error);
    });
}

async function initMap() {
    console.log("map called")
    const { Map } = await google.maps.importLibrary("maps");

    map = new Map(document.getElementById("map"), {
        center: { lat: -34.397, lng: 150.644 }, //TODO: return center based on some other info
        zoom: 8,
    });

    google.maps.event.trigger(map, 'resize'); // Trigger a resize event after the map has been shown
    map.setCenter({ lat: -34.397, lng: 150.644 }); // Re-center the map
    console.log("map returned")
}