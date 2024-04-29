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
            imgElement.style.width = '200px'; // Set the width for each image
            imgElement.style.marginRight = '10px'; // Add some space between images
            preview.appendChild(imgElement);
        };
        reader.readAsDataURL(file);
    });
}

function sendImagesToServer(formData) {
    fetch('http://127.0.0.1:5000/upload_images', {
        method: 'POST',
        body: formData
    }).then(response => {
        return response.json();
    }).then(data => {
        console.log('Success:', data);
        // Optionally handle the response data here
    }).catch(error => {
        console.error('Error:', error);
    });
}
