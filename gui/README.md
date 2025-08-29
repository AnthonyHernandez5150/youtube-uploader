# GUI Setup

## Running the GUI

To start the graphical user interface:

```bash
npm run gui
```

For development mode with DevTools:
```bash
npm run gui-dev
```

## Features

- **Generate 1 Video**: Creates a single Bible verse video
- **Generate 2 Videos**: Creates two Bible verse videos  
- **Test Voice**: Tests the Chatterbox TTS system with your custom voice
- **Check YouTube**: Verifies YouTube API connection and channel info
- **Real-time Logs**: Shows live output from the pipeline processes

## Interface

The GUI provides:
- Modern, responsive design
- Real-time progress tracking
- Live output display
- Log viewing
- Error handling and status updates

## Technical Details

The GUI is built with:
- **Electron**: Cross-platform desktop app framework
- **Main Process**: Handles system interactions and runs pipeline scripts
- **Renderer Process**: Manages the UI and user interactions
- **IPC**: Secure communication between main and renderer processes

## File Structure

```
gui/
├── main.cjs         # Electron main process (CommonJS)
├── preload.cjs      # Security bridge for IPC (CommonJS)
├── index.html       # Main UI layout
├── styles.css       # Styling and responsive design
├── renderer.js      # UI logic and event handling
└── assets/          # Icons and images
```

## Security

The GUI implements Electron security best practices:
- Context isolation enabled
- Node integration disabled in renderer
- Preload script for secure IPC communication
- No eval or unsafe content

## Development

To modify the GUI:
1. Edit files in the `gui/` directory
2. Run `npm run gui-dev` to see changes with DevTools
3. The main pipeline code remains unchanged - GUI just calls existing scripts
