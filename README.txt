BRICK & BEYOND LLC — WEBSITE GUIDE

OPEN THE WEBSITE
Open index.html in a browser. Keep every HTML, CSS, and JavaScript file together when uploading the website.

PAGES / TABS
- index.html: Home
- about.html: About
- services.html: Services
- projects.html: Project gallery
- reviews.html: All reviews and review form
- contact.html: Estimate/contact form
- welcome.html: Thank-you page shown after form submissions

ADDING PROJECT PHOTOS
Look for "image-placeholder" in index.html, about.html, and projects.html. Replace a placeholder block with an image, for example:
<img src="images/kitchen-project.jpg" alt="Newly remodeled kitchen">
Create an images folder and place the photo there.

SHARED REVIEW SYSTEM — REQUIRED ONE-TIME SETUP
1. Sign in to the Supabase project.
2. Open SQL Editor and select New query.
3. Open supabase-setup.sql from this website folder.
4. Copy its complete contents into the query editor and click Run.
5. Upload this updated website folder to the web host.

After setup, reviews and pictures are stored online and shared with every visitor. Visitors can choose 1–5 stars and attach a JPG, PNG, or WebP image up to 1.5 MB. Reviews are ordered from 5 stars to 1 star by default, and the top three appear on the home page.

SECURITY
supabase-config.js contains only the browser-safe publishable key. Never add a database password, secret key, or service-role key to the website. The setup script uses Row Level Security so public visitors can read and submit reviews but cannot edit or delete them.

CONTACT FORM
The estimate form uses FormSubmit and sends to nisar6641@gmail.com. On first use, FormSubmit may email the owner an activation link. After submission, visitors see the welcome page and automatically return to the website.

EASY EDITING
All files contain labeled comments such as "HEADER", "GALLERY", "REVIEW FORM", and "DESIGN SETTINGS". Brand colors are controlled by the variables at the top of styles.css.

PUBLISHING
Upload the complete folder to GitHub Pages, Netlify, Hostinger, or another static web host. The existing GitHub Actions workflow can also publish the site with GitHub Pages.
