const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get the videos folder path
const videosFolder = path.join(__dirname, '..', 'cypress', 'videos');
const presentationFolder = path.join(__dirname, '..', 'cypress', 'presentation-videos');

// Ensure presentation folder exists
if (!fs.existsSync(presentationFolder)) {
  fs.mkdirSync(presentationFolder, { recursive: true });
}

// Check if videos folder exists and has MP4 files
if (!fs.existsSync(videosFolder)) {
  console.error('❌ Videos folder does not exist:', videosFolder);
  process.exit(1);
}

const videoFiles = fs.readdirSync(videosFolder).filter(file => file.endsWith('.mp4'));

if (videoFiles.length === 0) {
  console.log('⚠️ No MP4 video files found in:', videosFolder);
  console.log('Make sure Cypress tests are run with video recording enabled.');
  process.exit(0);
}

console.log(`🎥 Found ${videoFiles.length} video(s) to process...`);

// Process each video
videoFiles.forEach((file, index) => {
  const inputPath = path.join(videosFolder, file);
  const outputPath = path.join(presentationFolder, file);
  
  console.log(`\n[${index + 1}/${videoFiles.length}] Processing: ${file}`);
  
  try {
    // Check if FFmpeg is available
    execSync('ffmpeg -version', { stdio: 'pipe' });
    
    // Use FFmpeg to crop the video (remove left sidebar)
    // Adjust the crop values based on your screen resolution
    // Format: crop=width:height:x:y
    const cropFilter = 'crop=1000:720:280:0'; // Adjust these values as needed
    
    console.log(`🔧 Using crop filter: ${cropFilter}`);
    
    // Execute FFmpeg synchronously to ensure it completes
    execSync(`ffmpeg -i "${inputPath}" -filter:v "${cropFilter}" -c:a copy "${outputPath}"`, { 
      stdio: 'pipe',
      timeout: 60000 // 60 seconds timeout
    });
    
    console.log(`✅ Success: ${outputPath}`);
    
    // Verify the output file was created
    if (fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath);
      console.log(`📊 File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    } else {
      console.error(`❌ Output file was not created: ${outputPath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing video ${file}:`);
    
    if (error.status === 1) {
      console.error('   FFmpeg command failed. Make sure FFmpeg is installed and in your PATH.');
    } else if (error.signal === 'SIGTERM') {
      console.error('   Process was terminated due to timeout.');
    } else {
      console.error('   Error message:', error.message);
    }
    
    console.log('🔄 Trying alternative approach...');
    
    try {
      // Alternative approach with different crop values
      const altCropFilter = 'crop=1280:720:400:0';
      console.log(`🔧 Using alternative crop filter: ${altCropFilter}`);
      
      execSync(`ffmpeg -i "${inputPath}" -filter:v "${altCropFilter}" -c:a copy "${outputPath}"`, { 
        stdio: 'pipe',
        timeout: 60000
      });
      
      console.log(`✅ Alternative approach succeeded: ${outputPath}`);
    } catch (altError) {
      console.error(`❌ Alternative approach also failed for ${file}:`);
      console.error('   Error message:', altError.message);
      console.log('⏭️  Skipping this file...');
    }
  }
});

console.log('\n🎉 Video processing complete!');
console.log(`📁 Presentation videos saved to: ${presentationFolder}`);