function uploadImages() {
    var files = document.getElementById('imageInput').files;
    var preview = document.getElementById('preview');
    preview.innerHTML = ''; // Clear previous previews

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
            imgElement.style.width = '200px';  // Set the width for each image
            imgElement.style.marginRight = '10px'; // Optional: Add some space between images
            preview.appendChild(imgElement);
        };

        reader.readAsDataURL(file);
    });
}