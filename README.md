# Shibuya Scramble Crossing 24/7 Live Cam 🌆🎥

A real-time 24/7 live camera web application featuring Tokyo's iconic Shibuya Scramble Crossing, paired with live JST time, real-time Tokyo weather updates via Open-Meteo API, and essential travel information.

## 🌟 Features

* **24/7 Live Stream**: Embedded high-definition live stream of Tokyo Shibuya Scramble Crossing (FNN Prime Online) with optimized cross-origin and autoplay parameters.
* **Real-Time Tokyo Weather**: Fetches dynamic weather metrics (Temperature, Feels Like, UV Index, Sunrise/Sunset, Conditions) for Shibuya, Tokyo via the Open-Meteo API.
* **JST Live Clock**: Real-time Japanese Standard Time (JST) clock automatically formatted for accurate local timekeeping.
* **Visitor Info Links**: Quick access links for Official Tourism, Airports (Haneda/Narita), JR East, and Tokyo Metro.
* **Cohesive Sightseeing Theme**: Customized responsive design featuring handwritten Google Fonts (`Caveat`), blurred glassmorphism overlay, and Tokyo city backdrop.
* **Multi-Page Layout**: Includes `index.html`, `about.html`, and `privacy.html`.

## 📁 File Structure

```text
.
├── index.html       # Main landing page with live video embed & weather widget
├── about.html       # About page detailing project goals
├── privacy.html     # Privacy Policy & third-party content disclaimer
└── README.md        # Project documentation
```

## 🚀 Quick Start / Local Setup

1. **Clone or Download** this repository:
   ```bash
   git clone https://github.com/your-username/your-repo-name.github.io.git
   ```

2. **Run locally using an HTTP server**:
   Due to YouTube Embed and Cross-Origin API security restrictions (`referrerpolicy`), running directly via `file://` might trigger Player Error 153. It is recommended to use a local server:

   * **Using VS Code**: Right-click `index.html` and select **Open with Live Server**.
   * **Using Python**:
     ```bash
     python -m http.server 8000
     ```
     Then open `http://localhost:8000` in your web browser.

3. **Deploying to GitHub Pages**:
   * Push your files to your GitHub repository.
   * Go to **Settings > Pages**.
   * Set Source to `main` branch and `/ (root)`.
   * Click **Save** to publish your live site!

## 🛠️ Built With

* **HTML5 / CSS3**: Flexbox, Glassmorphism backdrop-filters, responsive layouts.
* **JavaScript (ES6+)**: Dynamic DOM manipulation, Fetch API, LocalStorage.
* **APIs**:
  * [Open-Meteo Weather API](https://open-meteo.com/) (Free, no API key required)
  * [YouTube IFrame Player API](https://developers.google.com/youtube/iframe_api_reference)
* **Fonts & Imagery**:
  * [Google Fonts - Caveat](https://fonts.google.com/specimen/Caveat)
  * Unsplash Photography

## 📄 License

This project is open source and available for personal or educational use.
