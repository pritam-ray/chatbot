# AI Chatbot with Azure OpenAI Integration

A modern, feature-rich AI chatbot application built with React, TypeScript, and Azure OpenAI, featuring advanced markdown rendering, mathematical equation support, and PDF file processing capabilities.

![AI Chatbot](https://img.shields.io/badge/React-18.3-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)
![Vite](https://img.shields.io/badge/Vite-5.4-purple)
![Azure OpenAI](https://img.shields.io/badge/Azure%20OpenAI-API-green)

## ✨ Features

### 🤖 AI Capabilities
- **Streaming Responses**: Real-time streaming chat completions from Azure OpenAI
- **Context-Aware Conversations**: Maintains conversation history for contextual responses
- **Smart Response Caching**: Client-side caching for instant replay of repeated queries (reduces API costs)
- **Advanced Markdown Rendering**: Full support for GitHub Flavored Markdown (GFM)
- **Mathematical Equations**: Render inline and display math equations using KaTeX
- **Table Support**: Beautiful, responsive tables with custom styling
- **Code Syntax Highlighting**: Enhanced code blocks with copy-to-clipboard functionality

### 📄 File Processing
- **PDF Support**: Extract and process text from PDF files
- **Multiple File Types**: Support for various document formats (PDF, TXT, DOC, DOCX)
- **Smart Text Extraction**: Automatically extracts text from attachments for AI context
- **Privacy-Focused UI**: Extracted text is sent to AI but not displayed in the chat interface

### 🎨 Premium UI/UX
- **Modern Design**: Sleek, professional interface with gradient accents
- **Glass Morphism Effects**: Sophisticated backdrop blur and transparency effects
- **Responsive Layout**: Fully responsive design that works on all devices
- **Smooth Animations**: Polished transitions and hover effects
- **Copy Code Buttons**: One-click code copying with visual feedback
- **Custom Scrollbars**: Styled scrollbars matching the theme
- **Cache Manager**: Visual interface to monitor and manage cached responses

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Azure OpenAI API access

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/pritam-ray/chatbot.git
   cd chatbot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_AZURE_OPENAI_API_KEY=your_api_key_here
   VITE_AZURE_OPENAI_ENDPOINT=your_endpoint_here
   VITE_AZURE_OPENAI_DEPLOYMENT_NAME=your_deployment_name
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to `http://localhost:5173`

## 🛠️ Technology Stack

### Core Framework
- **React 18.3** - Modern UI library with hooks
- **TypeScript 5.5** - Type-safe development
- **Vite 5.4** - Lightning-fast build tool

### Styling
- **TailwindCSS 3.4** - Utility-first CSS framework
- **PostCSS** - CSS transformations
- **Custom CSS** - Enhanced markdown and math styling

### AI & Processing
- **Azure OpenAI** - Advanced language model integration
- **pdf.js** - PDF text extraction
- **marked** - Markdown parsing
- **DOMPurify** - HTML sanitization
- **KaTeX** - Mathematical equation rendering

### UI Components
- **Lucide React** - Beautiful icon library

## 📁 Project Structure

```
chatbot/
├── src/
│   ├── components/
│   │   ├── ChatInput.tsx      # Message input with file upload
│   │   └── ChatMessage.tsx    # Message display with markdown
│   ├── services/
│   │   └── azureOpenAI.ts     # Azure OpenAI API integration
│   ├── utils/
│   │   ├── markdown.ts        # Advanced markdown parser
│   │   └── pdfExtractor.ts    # PDF text extraction
│   ├── App.tsx                # Main application component
│   ├── main.tsx               # Application entry point
│   └── index.css              # Global styles
├── public/                    # Static assets
├── .env                       # Environment variables (create this)
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── vite.config.ts            # Vite configuration
└── tailwind.config.js        # TailwindCSS configuration
```

## 🎯 Key Features Explained

### Markdown Rendering
The chatbot supports comprehensive markdown syntax including:
- **Headings** (H1-H6) with gradient styling
- **Lists** (ordered and unordered)
- **Tables** with zebra striping and hover effects
- **Code blocks** with syntax highlighting and copy buttons
- **Inline code** with custom styling
- **Blockquotes** with left border accent
- **Links** with hover effects
- **Bold, italic, and strikethrough** text

### Mathematical Equations
Write equations using LaTeX syntax:
- **Inline math**: `$E = mc^2$`
- **Display math**: 
  ```
  $$
  \int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
  $$
  ```

### File Attachments
Supported file types:
- PDF (`.pdf`) - Full text extraction
- Text files (`.txt`)
- Word documents (`.doc`, `.docx`)
- Maximum file size: Configurable

### Code Copying
All code blocks feature:
- Hover-to-reveal copy button
- One-click copying to clipboard
- Visual feedback (checkmark animation)
- Language detection and display

### Response Caching
Intelligent client-side caching system:
- **Instant Replies**: Cached responses appear instantly (zero API calls)
- **Context-Aware**: Same question in different contexts = different cache entries
- **Cost Savings**: Reduces token usage for repeated queries
- **Auto-Expiry**: Cache entries expire after 7 days
- **Storage Management**: Auto-cleanup when reaching capacity (max 100 entries)
- **Visual Dashboard**: Monitor cache hits, entries, and storage usage

📘 **[Full Cache Documentation](CACHE_FEATURE.md)**

## 🔧 Configuration

### Azure OpenAI Setup
1. Create an Azure OpenAI resource in Azure Portal
2. Deploy a model (e.g., GPT-4, GPT-3.5-turbo)
3. Copy the API key, endpoint, and deployment name
4. Add them to your `.env` file

### Customization

#### Colors and Theme
Edit `tailwind.config.js` to customize the color scheme:
```javascript
theme: {
  extend: {
    colors: {
      // Add your custom colors
    }
  }
}
```

#### Markdown Styles
Modify `src/index.css` to customize markdown rendering styles.

## 📝 Usage Examples

### Basic Chat
Simply type your message and press Enter or click Send to interact with the AI.

### Using Cache Manager
1. Click the **Database icon** in the header
2. View cache statistics (entries, hits, storage)
3. Clear cache if needed
4. Watch console logs for cache activity:
   - `🎯 Cache HIT` - Response served from cache
   - `💾 Cached response` - New response saved

### Sending Files
1. Click the attachment icon
2. Select a file (PDF, TXT, DOC, DOCX)
3. The file content will be automatically extracted and sent to the AI
4. The AI will analyze the content and respond accordingly

### Mathematical Equations
Ask the AI to explain math concepts:
```
"Explain the quadratic formula with an example"
```

The AI will respond with properly formatted equations.

### Tables
Request data in table format:
```
"Show me a comparison table of programming languages"
```

The AI will generate a beautifully formatted table.

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

The build artifacts will be in the `dist/` directory.

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

### Deploy to Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **Azure OpenAI** for providing the AI capabilities
- **React Team** for the amazing framework
- **Vite Team** for the blazing-fast build tool
- **TailwindCSS** for the utility-first CSS framework
- **KaTeX** for beautiful math rendering
- **marked** and **DOMPurify** for secure markdown parsing

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

Built with ❤️ using React, TypeScript, and Azure OpenAI
