const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Get the videos folder path
const videosFolder = path.join(__dirname, '..', 'cypress', 'videos');
const presentationFolder = path.join(__dirname, '..', 'cypress', 'presentation-videos');

// Ensure presentation folder exists
if (!fs.existsSync(presentationFolder)) {
  fs.mkdirSync(presentationFolder, { recursive: true });
}

// Process all videos in the videos folder
fs.readdirSync(videosFolder).forEach(file => {
  if (file.endsWith('.mp4')) {
    const inputPath = path.join(videosFolder, file);
    const outputPath = path.join(presentationFolder, file);
    
    console.log(`Processing video: ${file}`);
    
    // Use FFmpeg to crop the video (remove left sidebar)
    // Adjust the crop values based on your screen resolution
    // Format: crop=width:height:x:y
    // For a typical Cypress Test Runner, we need to crop out the left sidebar
    const cropFilter = 'crop=1000:720:280:0'; // Adjust these values as needed
    
    exec(`ffmpeg -i "${inputPath}" -filter:v "${cropFilter}" -c:a copy "${outputPath}"`, (error) => {
      if (error) {
        console.error(`Error processing video ${file}:`, error);
      } else {
        console.log(`✅ Presentation video created: ${outputPath}`);
      }
    });
  }
});

console.log('Video processing complete!');