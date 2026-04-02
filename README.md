# 💒 Marcos & Val Wedding Website

A beautiful bilingual (English/Spanish) wedding website with a cream and gold elegant theme, ready for GitHub Pages deployment.

## ✨ Features

- 🌐 **Bilingual Support** - Toggle between English and Spanish
- 🎨 **Elegant Design** - Cream and gold color scheme
- 📱 **Fully Responsive** - Works perfectly on all devices
- 🖼️ **Photo Gallery** - Showcase your favorite moments
- 📅 **Wedding Details** - Ceremony and reception information
- ⏰ **Timeline** - Day-of schedule for guests
- 💌 **RSVP Section** - Easy contact for confirmations
- 🎁 **Registry Links** - Direct links to your registries
- 🎫 **Digital Tickets** - Party links with individual QR tickets per guest

## 📁 Project Structure

```
Boda website/
├── index.html          # Main HTML file
├── styles.css          # Styling (cream & gold theme)
├── script.js           # Language switching logic
├── translations.js     # English and Spanish translations
├── tickets.html        # Guest-facing digital tickets page
├── tickets.css         # Ticket page styling
├── tickets.js          # Ticket rendering + QR + download logic
├── guests-data.js      # Invitee list (paste from spreadsheet)
├── ticket-links.html   # Party link generator page
├── images/             # Wedding photos folder
│   ├── README.md       # Image placement guide
│   └── .gitkeep        # Keeps folder in git
├── .nojekyll          # GitHub Pages configuration
└── README.md          # This file
```

## 🚀 Quick Start

## 🎟️ Digital Ticket Setup

1. Open `guests-data.js`
2. Replace sample rows in `GUESTS_RAW` with your list using **tab-separated columns**:
   - `id`
   - `firstName`
   - `lastName`
   - `partyId`
   - `partyLabel`
3. Keep the file encoded as UTF-8 (accents are supported).
4. Open `ticket-links.html` and copy each party link.
5. Send party links to invitees. Each person can download their own ticket from `tickets.html`.

Example row:

```text
mv-001\tMaría\tGarcía\tparty-garcia\tFamilia García
```

### Step 1: Add Your Images

1. Download your photos from Canva
2. Place them in the `images/` folder with these names:
   - `hero-bg.jpg` - Hero section background
   - `couple-photo.jpg` - Main couple photo
   - `photo1.jpg` through `photo6.jpg` - Gallery photos

### Step 2: Customize Your Content

Edit `translations.js` to update:
- Wedding date and time
- Venue names and addresses
- Your personal messages
- Contact information
- Registry links

Edit `index.html` to update:
- Email address in RSVP section (line 142)
- Phone number if needed
- Registry links (lines 157-164)

### Step 3: Deploy to GitHub Pages

#### Option A: Using GitHub Desktop (Easiest)

1. **Create a GitHub Account** (if you don't have one)
   - Go to [github.com](https://github.com)
   - Sign up for free

2. **Install GitHub Desktop**
   - Download from [desktop.github.com](https://desktop.github.com)
   - Install and sign in

3. **Create Repository**
   - Open GitHub Desktop
   - Click "Create New Repository"
   - Name: `wedding-website` (or your preferred name)
   - Local Path: Choose the "Boda website" folder
   - Click "Create Repository"

4. **Publish to GitHub**
   - Click "Publish repository" in GitHub Desktop
   - Uncheck "Keep this code private" (or keep it private, your choice)
   - Click "Publish Repository"

5. **Enable GitHub Pages**
   - Go to your repository on github.com
   - Click "Settings" → "Pages"
   - Under "Source", select "main" branch
   - Click "Save"
   - Wait 1-2 minutes, then visit: `https://[your-username].github.io/wedding-website/`

#### Option B: Using Command Line

```bash
# Initialize git repository
git init

# Add all files
git add .

# Commit files
git commit -m "Initial wedding website"

# Create repository on GitHub (go to github.com and create new repo)
# Then link and push:
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
git branch -M main
git push -u origin main

# Enable GitHub Pages in repository settings
```

## 🎨 Customization Guide

### Changing Colors

Edit `styles.css` and modify the CSS variables at the top:

```css
:root {
    --cream: #FFF8E7;      /* Main cream color */
    --gold: #D4AF37;       /* Main gold color */
    --dark-gold: #B8941C;  /* Darker gold for hovers */
}
```

### Adding More Sections

1. Copy an existing section from `index.html`
2. Modify the content
3. Add translations to `translations.js`
4. Style as needed in `styles.css`

### Changing Fonts

The website uses:
- **Great Vibes** - For couple names (cursive)
- **Montserrat** - For body text

To change fonts, replace the Google Fonts link in `index.html` (line 7-9).

## 📝 Content Checklist

Before deploying, make sure to update:

- [ ] All wedding photos in `images/` folder
- [ ] Wedding date in both languages
- [ ] Ceremony location and address
- [ ] Reception location and address
- [ ] Timeline/schedule times
- [ ] RSVP email address
- [ ] Contact phone number
- [ ] Registry links (Amazon, Target, etc.)
- [ ] Any personal messages or text

## 🌐 Testing Locally

To test your website before deploying:

1. **Simple method**: Just open `index.html` in your web browser
2. **With live server** (recommended):
   - Install VS Code
   - Install "Live Server" extension
   - Right-click `index.html` → "Open with Live Server"

## 🔧 Troubleshooting

### Images not showing
- Make sure image files are in the `images/` folder
- Check that filenames match exactly (case-sensitive)
- Verify images are in JPG, JPEG, or PNG format

### Language toggle not working
- Open browser console (F12) to check for errors
- Ensure `translations.js` and `script.js` are loaded
- Clear browser cache and refresh

### GitHub Pages not updating
- Wait 2-5 minutes after pushing changes
- Check repository Settings → Pages for any errors
- Make sure `.nojekyll` file exists
- Try clearing your browser cache

## 📱 Browser Support

Works on all modern browsers:
- ✅ Chrome
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 💡 Tips

1. **Optimize Images**: Compress images before uploading to improve load times
2. **Test Both Languages**: Make sure all translations are complete
3. **Mobile Testing**: Check how it looks on your phone
4. **Share Early**: Send the link to family for feedback
5. **Update Regularly**: You can update content anytime by pushing to GitHub

## 🎯 Next Steps

1. **Add your images** to the `images/` folder
2. **Customize content** in `translations.js` and `index.html`
3. **Test locally** by opening `index.html` in a browser
4. **Deploy to GitHub Pages** following the steps above
5. **Share your website** with guests!

## 📞 Need Help?

- Check the [GitHub Pages Documentation](https://docs.github.com/en/pages)
- Google Fonts: [fonts.google.com](https://fonts.google.com)
- W3Schools tutorials: [w3schools.com](https://www.w3schools.com)

## 💝 Credits

Created with love for Marcos & Val's special day!

---

**Your website will be live at:**
`https://[your-github-username].github.io/[repository-name]/`

Enjoy your beautiful wedding website! 🎉💑
