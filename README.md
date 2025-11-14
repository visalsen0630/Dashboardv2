# Portfolio Website

A modern, responsive portfolio website built with React, Vite, TailwindCSS, and Framer Motion.

## Features

- Responsive design for mobile and desktop
- Smooth scroll animations using Framer Motion
- Interactive navigation with smooth scrolling
- Multiple sections: Hero, About, Skills, Projects, Contact, Footer
- Project filtering functionality
- Contact form with validation
- Animated skill progress bars
- Gradient effects and modern UI design

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **JavaScript (ES6+)** - Programming language

## Project Structure

```
portfolio/
├── public/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── Hero.jsx
│   │   ├── About.jsx
│   │   ├── Skills.jsx
│   │   ├── Projects.jsx
│   │   ├── Contact.jsx
│   │   └── Footer.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## Getting Started

### Prerequisites

Make sure you have Node.js installed on your machine. You can download it from [nodejs.org](https://nodejs.org/).

### Installation

1. Install dependencies:

```bash
npm install
```

### Running the Development Server

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173/`

### Building for Production

Create a production build:

```bash
npm run build
```

The optimized files will be in the `dist` folder.

### Preview Production Build

Preview the production build locally:

```bash
npm run preview
```

## Customization Guide

### 1. Personal Information

Update your personal information in the following components:

**Hero.jsx**
- Change "Your Name" to your actual name
- Update your title/role
- Modify the description

**About.jsx**
- Replace the placeholder emoji with your photo
- Update the about text
- Change location, email, and status information
- Modify the stats (years of experience, projects, etc.)

**Contact.jsx**
- Update email, phone, and location
- Add your actual social media links
- Configure form submission (integrate with EmailJS or your backend)

**Footer.jsx**
- Update copyright information
- Change social media links

### 2. Skills

Edit the `skillCategories` array in **Skills.jsx** to add/remove/modify your skills and their proficiency levels.

### 3. Projects

Edit the `projects` array in **Projects.jsx** to showcase your actual projects:
- Add project titles and descriptions
- Update categories and tags
- Add links to live demos and GitHub repositories
- Replace emoji placeholders with actual project images

### 4. Colors and Theme

Modify the theme colors in **tailwind.config.js**:

```javascript
colors: {
  primary: '#3B82F6',    // Change to your primary color
  secondary: '#8B5CF6',  // Change to your secondary color
  dark: '#0F172A',       // Background color
  light: '#F1F5F9',      // Text color
}
```

### 5. Images

To add real images:

1. Create an `assets` folder inside `src/`
2. Add your images to this folder
3. Import and use them in your components:

```jsx
import profileImage from '../assets/profile.jpg'

// Use in component
<img src={profileImage} alt="Profile" />
```

### 6. Contact Form Integration

To make the contact form functional, you can:

**Option 1: EmailJS**
1. Sign up at [EmailJS](https://www.emailjs.com/)
2. Install EmailJS: `npm install @emailjs/browser`
3. Update the `handleSubmit` function in Contact.jsx

**Option 2: Your Own Backend**
1. Create an API endpoint
2. Update the `handleSubmit` function to POST to your API

### 7. Social Media Links

Update social media links in:
- **Hero.jsx** (social icons at the bottom)
- **Contact.jsx** (social links section)
- **Footer.jsx** (footer social icons)

Replace `#` or placeholder URLs with your actual social media profiles.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

The site is optimized for performance with:
- Vite's fast build system
- Code splitting
- Optimized animations
- Lazy loading ready (can be implemented for images)

## License

This project is open source and available under the MIT License.

## Support

If you have any questions or run into issues, please open an issue in the repository.

## Acknowledgments

- Built with [React](https://react.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Animated with [Framer Motion](https://www.framer.com/motion/)
- Powered by [Vite](https://vitejs.dev/)


push to git
git add .
git commit -m "Replace old code with updated project"
git push --force
