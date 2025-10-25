# React + Vite Mobile App Template

A mobile-first React application template built with Vite.

## Features

- React 18 with Vite for fast development
- Mobile-optimized with touch-friendly interactions
- Responsive design with mobile-first approach
- Dark/light mode support
- PWA-ready meta tags
- Organized folder structure

## Getting Started

### Development

```bash
npm run dev
```

Open your browser and navigate to the URL shown in the terminal (usually `http://localhost:5173`).

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` folder.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
mobile-app/
├── src/
│   ├── components/     # Reusable components
│   ├── hooks/          # Custom React hooks
│   ├── utils/          # Utility functions
│   ├── App.jsx         # Main app component
│   ├── App.css         # App styles
│   ├── index.css       # Global styles
│   └── main.jsx        # Entry point
├── public/             # Static assets
└── index.html          # HTML template
```

## Mobile Optimizations

This template includes several mobile-specific optimizations:

- Viewport configuration for proper scaling
- Touch-friendly tap targets (minimum 44x44px)
- Disabled tap highlight for better UX
- Touch action manipulation for improved performance
- Mobile-first responsive breakpoints
- iOS-specific meta tags for web app mode
- Prevents zoom on input focus

## Customization

### Changing Theme Colors

Edit the colors in `src/index.css` and `src/App.css`:

```css
/* Primary color */
background: #646cff;

/* Gradient header */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Adding Components

Create new components in the `src/components` folder:

```jsx
// src/components/MyComponent.jsx
export default function MyComponent() {
  return <div>My Component</div>
}
```

## Technologies

- React 18
- Vite 6
- CSS3 with mobile-first media queries
