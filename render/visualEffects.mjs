// 🎨 Dynamic Visual Effects System
// Provides randomized fonts, colors, positions, and effects for unique videos

import fs from 'fs-extra';
import path from 'path';

// 🔤 Font Selection - Your Complete Windows Font Collection
const FONTS = [
    "C:\\Windows\\Fonts\\arial.ttf",          // Safe fallback
    "C:\\Windows\\Fonts\\arialbd.ttf",        // Bold classic
    "C:\\Windows\\Fonts\\Amiri-Bold.ttf",     // Elegant Arabic-style
    "C:\\Windows\\Fonts\\calibri.ttf",        // Modern clean
    "C:\\Windows\\Fonts\\calibrib.ttf",       // Bold modern
    "C:\\Windows\\Fonts\\Candara.ttf",        // Smooth curves
    "C:\\Windows\\Fonts\\comic.ttf",          // Playful
    "C:\\Windows\\Fonts\\courbd.ttf",         // Bold monospace
    "C:\\Windows\\Fonts\\DejaVuSans.ttf",     // Open source
    "C:\\Windows\\Fonts\\georgia.ttf",        // Elegant serif
    "C:\\Windows\\Fonts\\impact.ttf",         // High impact
    "C:\\Windows\\Fonts\\lucida.ttf",         // Highly readable
    "C:\\Windows\\Fonts\\Rubik-Bold.ttf",     // Geometric modern
    "C:\\Windows\\Fonts\\segoeui.ttf",        // Windows UI
    "C:\\Windows\\Fonts\\tahoma.ttf",         // Clean sans
    "C:\\Windows\\Fonts\\times.ttf",          // Classic serif
    "C:\\Windows\\Fonts\\verdana.ttf",        // Web optimized
];

// 🎨 Color Palette - Appealing YouTube Shorts Colors
const COLORS = [
    "white",      // High contrast, always readable
    "gold",       // Premium, attention-grabbing
    "lightblue",  // Calm, trustworthy
    "lightgreen", // Fresh, hopeful
    "yellow",     // Bright, energetic
    "pink"        // Warm, engaging
];

// 📍 Text Positions - Strategic Placement Options
const POSITIONS = [
    "center",     // Always safe
    "top",        // Good for hooks
    "bottom",     // Classic subtitle position
    "left",       // Modern asymmetric
    "right"       // Balanced asymmetric
];

// 📏 Font Sizes - Range for Different Impact Levels
const FONT_SIZES = [45, 50, 55, 60, 65, 70];

// ✨ Fade Options - Professional Transition Effects
const FADE_DURATIONS = [0.5, 1.0, 1.5];

// 🎯 Font Availability Cache (Performance Optimization)
let fontCache = null;

/**
 * Check which fonts are actually available on the system
 * @returns {Array} Array of available font paths
 */
async function getAvailableFonts() {
    if (fontCache) return fontCache;
    
    console.log('🔍 Checking font availability...');
    const availableFonts = [];
    
    for (const font of FONTS) {
        try {
            if (await fs.pathExists(font)) {
                availableFonts.push(font);
            }
        } catch (error) {
            // Skip fonts that can't be checked
        }
    }
    
    // Always ensure arial.ttf is available as fallback
    if (!availableFonts.includes("C:\\Windows\\Fonts\\arial.ttf")) {
        availableFonts.push("C:\\Windows\\Fonts\\arial.ttf");
    }
    
    console.log(`✅ Found ${availableFonts.length} available fonts`);
    fontCache = availableFonts;
    return availableFonts;
}

/**
 * Generate random visual styling for a video
 * @returns {Object} Style configuration object
 */
export async function generateRandomStyle() {
    const availableFonts = await getAvailableFonts();
    
    // Random selections
    const font = availableFonts[Math.floor(Math.random() * availableFonts.length)];
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const position = POSITIONS[Math.floor(Math.random() * POSITIONS.length)];
    const fontSize = FONT_SIZES[Math.floor(Math.random() * FONT_SIZES.length)];
    
    // 70% chance of fade effects
    const useFade = Math.random() < 0.7;
    const fadeTime = useFade ? FADE_DURATIONS[Math.floor(Math.random() * FADE_DURATIONS.length)] : 0;
    
    const style = {
        fontPath: font,
        fontFamily: path.basename(font, '.ttf'),
        textColor: color,
        backgroundColor: 'black@0.7',  // Semi-transparent black background
        position: position,
        fontSize: fontSize,
        useFade: useFade,
        fadeTime: fadeTime,
        strokeColor: 'black',  // Always use black stroke for readability
        strokeWidth: 2
    };
    
    console.log(`🎨 Generated style: ${style.fontFamily} | ${style.textColor} | ${style.fontSize}px | ${style.position} | fade: ${useFade ? style.fadeTime + 's' : 'none'}`);
    
    return style;
}

/**
 * Convert position name to FFmpeg coordinates
 * @param {string} position - Position name
 * @param {number} width - Video width
 * @param {number} height - Video height
 * @returns {string} FFmpeg position string
 */
export function getFFmpegPosition(position, width = 1080, height = 1920) {
    const positions = {
        center: '(w-text_w)/2:(h-text_h)/2',
        top: '(w-text_w)/2:100',
        bottom: '(w-text_w)/2:h-150',
        left: '50:(h-text_h)/2',
        right: 'w-text_w-50:(h-text_h)/2'
    };
    
    return positions[position] || positions.center;
}

/**
 * Build FFmpeg drawtext filter with dynamic styling
 * @param {string} text - Text to display
 * @param {Object} style - Style configuration
 * @param {number} videoDuration - Video duration for text timing
 * @returns {string} FFmpeg drawtext filter string
 */
export function buildDrawTextFilter(text, style, videoDuration) {
    const position = getFFmpegPosition(style.position);
    
    let filter = `drawtext=text='${text.replace(/'/g, "\\'")}':` +
        `fontfile='${style.font}':` +
        `fontsize=${style.fontSize}:` +
        `fontcolor=${style.color}:` +
        `x=${position.split(':')[0]}:` +
        `y=${position.split(':')[1]}:` +
        `shadowcolor=${style.strokeColor}:` +
        `shadowx=${style.strokeWidth}:` +
        `shadowy=${style.strokeWidth}`;
    
    // Add fade effects if enabled
    if (style.useFade && style.fadeTime > 0) {
        const fadeInEnd = style.fadeTime;
        const fadeOutStart = videoDuration - style.fadeTime;
        
        filter += `:enable='between(t,0,${videoDuration})'`;
        
        // Add alpha fading
        if (fadeInEnd > 0 && fadeOutStart > fadeInEnd) {
            filter += `:alpha='if(lt(t,${fadeInEnd}),t/${fadeInEnd},if(gt(t,${fadeOutStart}),(${videoDuration}-t)/${style.fadeTime},1))'`;
        }
    }
    
    return filter;
}

/**
 * Log style usage for analytics
 * @param {Object} style - Style configuration
 * @param {string} videoId - Video identifier
 */
export function logStyleUsage(style, videoId) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        videoId: videoId,
        font: style.fontName,
        color: style.color,
        position: style.position,
        fontSize: style.fontSize,
        useFade: style.useFade,
        fadeTime: style.fadeTime
    };
    
    // Append to style usage log
    const logFile = './logs/style_usage.json';
    try {
        fs.ensureDirSync('./logs');
        const existingLogs = fs.existsSync(logFile) ? JSON.parse(fs.readFileSync(logFile, 'utf8')) : [];
        existingLogs.push(logEntry);
        fs.writeFileSync(logFile, JSON.stringify(existingLogs, null, 2));
    } catch (error) {
        console.log('⚠️  Could not log style usage:', error.message);
    }
}

/**
 * Get style statistics from usage logs
 * @returns {Object} Style usage statistics
 */
export function getStyleStats() {
    const logFile = './logs/style_usage.json';
    try {
        if (!fs.existsSync(logFile)) return null;
        
        const logs = JSON.parse(fs.readFileSync(logFile, 'utf8'));
        const stats = {
            totalVideos: logs.length,
            fontUsage: {},
            colorUsage: {},
            positionUsage: {},
            fadeUsage: { with: 0, without: 0 }
        };
        
        logs.forEach(log => {
            stats.fontUsage[log.font] = (stats.fontUsage[log.font] || 0) + 1;
            stats.colorUsage[log.color] = (stats.colorUsage[log.color] || 0) + 1;
            stats.positionUsage[log.position] = (stats.positionUsage[log.position] || 0) + 1;
            if (log.useFade) stats.fadeUsage.with++; else stats.fadeUsage.without++;
        });
        
        return stats;
    } catch (error) {
        return null;
    }
}

// Export font list for external use
export { FONTS, COLORS, POSITIONS, FONT_SIZES, FADE_DURATIONS };
