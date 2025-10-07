// scripts/post-process-videos-docker.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get the videos folder path (Docker paths)
const videosFolder = '/e2e/cypress/videos';
const presentationFolder = '/e2e/cypress/presentation-videos';

// Ensure presentation folder exists
if (!fs.existsSync(presentationFolder)) {
  fs.mkdirSync(presentationFolder, { recursive: true });
}

// Check if videos folder exists and has MP4 files
if (!fs.existsSync(videosFolder)) {
  console.error('❌ Videos folder does not exist:', videosFolder);
  process.exit(1);
}

const videoFiles = fs.readdirSync(videosFolder).filter(file => 
  file.endsWith('.mp4') && !file.startsWith('presentation_')
);

if (videoFiles.length === 0) {
  console.log('⚠️ No MP4 video files found in:', videosFolder);
  console.log('Make sure Cypress tests are run with video recording enabled.');
  process.exit(0);
}

console.log(`🎥 Found ${videoFiles.length} video(s) to process...`);

// Function to get video dimensions using FFprobe
function getVideoDimensions(videoPath) {
  try {
    const output = execSync(`ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "${videoPath}"`, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    const [width, height] = output.trim().split('x').map(Number);
    return { width, height };
  } catch (error) {
    console.error('❌ Could not get video dimensions:', error.message);
    return null;
  }
}

// Function to get video duration
function getVideoDuration(videoPath) {
  try {
    const output = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    return parseFloat(output.trim());
  } catch (error) {
    console.error('❌ Could not get video duration:', error.message);
    return null;
  }
}

// Function to get original file size
function getOriginalFileSize(videoPath) {
  try {
    const stats = fs.statSync(videoPath);
    return stats.size / 1024 / 1024; // Return in MB
  } catch (error) {
    console.error('❌ Could not get file size:', error.message);
    return null;
  }
}

// Process each video
videoFiles.forEach((file, index) => {
  const inputPath = path.join(videosFolder, file);
  const outputPath = path.join(presentationFolder, file);
  
  console.log(`\n[${index + 1}/${videoFiles.length}] Processing: ${file}`);
  
  try {
    // Check if FFmpeg is available
    execSync('ffmpeg -version', { stdio: 'pipe' });
    
    // Get original file size for information purposes
    const originalSize = getOriginalFileSize(inputPath);
    if (originalSize) {
      console.log(`📊 Original file size: ${originalSize.toFixed(2)} MB`);
    }
    
    // Get video dimensions and duration
    const dimensions = getVideoDimensions(inputPath);
    const duration = getVideoDuration(inputPath);
    
    if (!dimensions || !duration) {
      console.error('❌ Could not get video information, skipping...');
      return;
    }
    
    console.log(`📐 Original dimensions: ${dimensions.width}x${dimensions.height}`);
    console.log(`⏱️  Duration: ${duration.toFixed(2)} seconds`);
    
    // Increase sidebar width to remove the entire Cypress Test Runner
    // Cypress Test Runner typically has a sidebar that takes up about 400-500 pixels
    const sidebarWidth = 674; // Increased from 300 to 450
    const contentWidth = dimensions.width - sidebarWidth;
    const contentHeight = dimensions.height;
    
    console.log(`🔧 Using crop: ${contentWidth}x${contentHeight}+${sidebarWidth}+0`);
    console.log(`📝 This should remove the Cypress Test Runner sidebar (${sidebarWidth}px wide)`);
    
    // Create the processed video directly
    const ffmpegCommand = [
      'ffmpeg',
      '-i', `"${inputPath}"`,
      '-filter:v', `"crop=${contentWidth}:${contentHeight}:${sidebarWidth}:0"`,
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '20', // Balance between quality and file size
      '-pix_fmt', 'yuv420p',
      '-c:a', 'copy',
      '-movflags', '+faststart',
      '-y',
      `"${outputPath}"`
    ].join(' ');
    
    console.log('🔧 Executing FFmpeg command...');
    execSync(ffmpegCommand, { 
      stdio: 'pipe',
      timeout: 180000
    });
    
    // Verify the processed video
    if (fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath);
      const processedSize = stats.size / 1024 / 1024;
      const processedDimensions = getVideoDimensions(outputPath);
      const processedDuration = getVideoDuration(outputPath);
      
      console.log(`📊 Processed file size: ${processedSize.toFixed(2)} MB`);
      
      if (processedDimensions && processedDuration) {
        console.log(`📐 Processed dimensions: ${processedDimensions.width}x${processedDimensions.height}`);
        console.log(`⏱️  Processed duration: ${processedDuration.toFixed(2)} seconds`);
        
        // Check if processing was successful
        const dimensionMatch = processedDimensions.width === contentWidth && processedDimensions.height === contentHeight;
        const durationMatch = Math.abs(processedDuration - duration) < 0.5;
        
        if (dimensionMatch && durationMatch) {
          console.log(`✅ Success: ${outputPath}`);
          console.log(`🎉 The Cypress Test Runner sidebar should now be removed!`);
          
          // Create a preview clip (first 3 seconds)
          const previewPath = path.join(presentationFolder, `preview_${file}`);
          try {
            execSync(`ffmpeg -i "${outputPath}" -t 3 -c:v copy -c:a copy -y "${previewPath}"`, { stdio: 'pipe' });
            console.log(`🎬 Preview created: preview_${file}`);
          } catch (previewError) {
            console.warn('⚠️ Could not create preview:', previewError.message);
          }
        } else {
          console.warn('⚠️ Video validation failed:');
          console.warn(`   Dimensions match: ${dimensionMatch}`);
          console.warn(`   Duration match: ${durationMatch}`);
          
          // Remove failed file
          if (fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
          }
        }
      } else {
        console.warn('⚠️ Could not validate processed video');
        if (fs.existsSync(outputPath)) {
          fs.unlinkSync(outputPath);
        }
      }
    } else {
      console.error('❌ Output file was not created');
    }
  } catch (error) {
    console.error(`❌ Error processing video ${file}:`);
    
    if (error.status === 1) {
      console.error('   FFmpeg command failed.');
    } else if (error.signal === 'SIGTERM') {
      console.error('   Process was terminated due to timeout.');
    } else {
      console.error('   Error message:', error.message);
    }
    
    // Clean up failed file if it exists
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }
  }
});

console.log('\n🎉 Video processing complete!');
console.log(`📁 Presentation videos saved to: ${presentationFolder}`);

// Show summary
const processedFiles = fs.readdirSync(presentationFolder).filter(file => file.endsWith('.mp4') && !file.startsWith('preview_'));
console.log(`\n📋 Summary: ${processedFiles.length} video(s) successfully processed`);

if (processedFiles.length > 0) {
  console.log('\n📁 Processed videos:');
  processedFiles.forEach(file => {
    const filePath = path.join(presentationFolder, file);
    const stats = fs.statSync(filePath);
    const sizeMB = stats.size / 1024 / 1024;
    console.log(`   ${file}: ${sizeMB.toFixed(2)} MB`);
  });
  
  console.log('\n💡 Tip: If the Cypress Test Runner is still visible, you may need to:');
  console.log('   1. Increase the sidebarWidth value in the script (currently 450)');
  console.log('   2. Check your Cypress Test Runner layout');
  console.log('   3. Manually inspect the video to see what needs to be cropped');
} else {
  console.log('\n⚠️  No videos were successfully processed.');
  console.log('   This might indicate an issue with the video processing or FFmpeg configuration.');
}