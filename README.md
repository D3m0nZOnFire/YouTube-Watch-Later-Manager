# YouTube Watch Later Manager

A Chrome extension that allows you to bulk manage and delete videos from your YouTube Watch Later playlist with an intuitive checkbox interface.

## 📋 Features

- ✅ **Checkbox Selection** - Add checkboxes to each video in your Watch Later playlist
- 🔄 **Bulk Operations** - Select all or deselect all videos with one click
- 🗑️ **Bulk Delete** - Delete multiple videos at once
- 📊 **Progress Tracking** - Real-time progress bar during deletion
- 🎨 **Clean UI** - Modern, intuitive popup interface
- 🌐 **Multi-language Support** - Works with YouTube in different languages
- ⚡ **Fast & Efficient** - Lightweight and doesn't slow down YouTube

## 🖼️ Screenshots

### Popup Dashboard
The extension popup provides a clean interface to manage your playlist:
- Check page status
- Toggle checkboxes visibility
- Select/deselect all videos
- Delete selected videos

### Checkbox Interface
Checkboxes appear in a dedicated column next to each video, ensuring you never accidentally navigate to a video when selecting it.

### Progress Overlay
A beautiful progress overlay shows real-time deletion progress with success/failure counts.

## 🚀 Installation

### From Source (Developer Mode)

1. **Clone the repository**
```bash
   git clone https://github.com/yourusername/youtube-watch-later-manager.git
   cd youtube-watch-later-manager
```

2. **Load in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable **Developer mode** (toggle in top-right corner)
   - Click **Load unpacked**
   - Select the extension folder

3. **Start using!**
   - Navigate to your [YouTube Watch Later playlist](https://www.youtube.com/playlist?list=WL)
   - Click the extension icon in the toolbar
   - Start managing your videos!

## 📖 Usage Guide

### Basic Workflow

1. **Navigate to Watch Later**
   - Go to [youtube.com/playlist?list=WL](https://www.youtube.com/playlist?list=WL)

2. **Open Extension**
   - Click the extension icon in your Chrome toolbar
   - The popup will show your current status

3. **Show Checkboxes**
   - Click "Show Checkboxes" button
   - Checkboxes will appear next to each video

4. **Select Videos**
   - Manually check videos you want to delete
   - Or use "Select All" to select everything
   - Or use "Deselect All" to clear selection

5. **Delete Selected**
   - Click "Delete Selected" button
   - Confirm the deletion
   - Watch the progress overlay as videos are removed

### Tips & Tricks

- **Scroll to Load More**: As you scroll down, checkboxes automatically appear on newly loaded videos
- **Safe Selection**: Clicking checkboxes won't navigate to the video - they're in a separate column
- **Progress Tracking**: The extension shows real-time progress with success/fail counts
- **Multi-language**: Works with YouTube in any language

## 🛠️ Technical Details

### Project Structure
```
youtube-watch-later-manager/
├── manifest.json          # Extension configuration
├── popup.html            # Extension popup UI
├── popup.js              # Popup logic and communication
├── content.js            # Content script (runs on YouTube)
├── styles.css            # Styles for YouTube page elements
└── README.md             # This file
```

### Technologies Used

- **Manifest V3** - Latest Chrome extension standard
- **Vanilla JavaScript** - No dependencies, lightweight
- **Chrome Extension APIs** - Tabs, Scripting, Messaging
- **CSS3** - Modern styling with gradients and transitions

### How It Works

1. **Content Script Injection**: The extension injects `content.js` into YouTube pages
2. **Page Detection**: Checks if the current page is the Watch Later playlist
3. **DOM Manipulation**: Adds checkbox elements to the video list dynamically
4. **Message Passing**: Communication between popup and content script via Chrome's messaging API
5. **Video Deletion**: Simulates clicking YouTube's native "Remove from Watch Later" option

## 🔒 Privacy & Permissions

### Required Permissions

- `activeTab` - To interact with the current YouTube tab
- `scripting` - To inject content scripts into YouTube pages
- `https://www.youtube.com/*` - To access YouTube pages

### Privacy Commitment

- ✅ **No data collection** - We don't collect any user data
- ✅ **No external requests** - All operations are local
- ✅ **No tracking** - We don't track your usage
- ✅ **Open source** - Full transparency of the code

## 🐛 Known Issues & Limitations

- The extension only works on the Watch Later playlist page
- YouTube's rate limiting may slow down very large batch deletions
- Some videos may fail to delete if YouTube's UI changes
- Requires manual refresh after deletion to see updated video count

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to the branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

### Development Setup
```bash
# Clone your fork
git clone https://github.com/yourusername/youtube-watch-later-manager.git

# Create a branch
git checkout -b feature/my-feature

# Make your changes and test locally
# Load the extension in Chrome Developer Mode

# Commit and push
git add .
git commit -m "Description of changes"
git push origin feature/my-feature
```

## 📝 TODO / Roadmap

- [ ] Add keyboard shortcuts
- [ ] Implement undo functionality
- [ ] Add video filtering options
- [ ] Export selected video list
- [ ] Dark/light theme toggle
- [ ] Settings page for customization
- [ ] Support for other playlists
- [ ] Video preview on hover

## ⭐ Show Your Support

If you find this extension useful, please:
- ⭐ Star this repository
- 🐛 Report bugs
- 💡 Suggest new features
- 🔀 Submit pull requests

---

**Note**: This extension is not affiliated with or endorsed by YouTube or Google.