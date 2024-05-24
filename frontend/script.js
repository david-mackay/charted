// previewImages function is called when the user selects images for uploading.
// It validates the images and displays a preview of the selected images.
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
// It uploads the selected images to the server.
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
            // Define the mapArea variable here
            var mapArea = document.getElementById('map');  // Ensure this ID matches your HTML
            mapArea.style.display = 'block';  // Show the map area
            initMap();
        }
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