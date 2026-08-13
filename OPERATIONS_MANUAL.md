# 🌙 Crescent Literary Society — Website Operations Manual

Welcome to the operations team! This manual contains everything you need to know to keep the Crescent Literary Society website updated. 

**You do not need to know a single line of code to use this system.** 

The website uses a visual Content Management System (CMS) that allows you to easily type articles, change photos, and manage members just like you would on a blog or social media site.

---

## 1. How to Access the Dashboard

1. Go to your website's admin portal: [https://crescentliterarysociety.vercel.app/admin/](https://crescentliterarysociety.vercel.app/admin/)
2. Click the **Login with GitHub** button.
   
> **Account Requirements**
> Your GitHub account **MUST** be authorized to access the CMS. The current President or Administrator must add your GitHub account to the `Crescent-Literary-Society` organization on GitHub before the login button will let you in.

3. Once logged in, you will see a dashboard with a sidebar on the left listing all the different "Collections" you can manage.

---

## 2. Managing Content (Blogs, Meraki, & Crescent Line)

You can publish four types of articles: **Blogs**, **Meraki Magazine Issues**, **Crescent Line Newsletters**, and **Obverse Magazine Articles**. They all work the exact same way.

### Adding a New Post
1. Click on the relevant collection in the left sidebar (e.g., **Blog**).
2. Click the **New Blog** button in the top right.
3. Fill out the fields:
   * **Title**: The headline of the post.
   * **Date**: When it was published (defaults to today).
   * **Author**: Your name, or the writer's name.
   * **Thumbnail Image**: Click to upload an image. This is the image that shows up on the card grid on the main page.
   * **Body**: Write your article here! You can use the rich text editor to make things bold, add links, or insert images directly into the article.
4. When you are done, look at the top bar. You can save it as a draft, or click **Publish** to make it live.

> **Formatting Trick:** The editor supports "Markdown". If you want to add a subheading, just type `## Your Heading` and press space. 

---

## 3. Managing Images & Carousels

The website has several image slideshows (carousels) on the Homepage and the Wing pages (House of Debaters, Improv, etc.).

### How to Update a Carousel
1. In the sidebar, look under the **Carousels** header.
2. Select the carousel you want to update (e.g., **Main Homepage Carousel**).
3. You will see a list of current slides. 
   * **To add a new slide:** Click "Add slide", upload an image, and give it a short description.
   * **To remove a slide:** Click the "X" next to the slide you want to delete.
   * **To rearrange:** Click and drag the slides up or down using the drag handle.
4. Click **Publish**.

> **WARNING: Carousel Images MUST be Wide (Landscape)**
> The hero carousels are designed to stretch across the entire screen of a computer. 
> * If you upload a **square** or **vertical** image (like a portrait photo), the browser will forcefully zoom in to make it fit the width of the screen, cutting off the top and bottom.
> * **Fix:** Always crop your images to a wide rectangle (16:9 ratio) before uploading them to the carousel.

---

## 4. Managing Members

At the start of a new academic year, you'll need to update the Members page.

1. Click **Members** in the sidebar.
2. You will see the master list of all current members.
3. Click **Add member** to create a new profile.
4. Provide their **Name**, **Role** (e.g., President, Joint Secretary, Member), and upload a **Profile Image**.
5. Rearrange the list by dragging them (usually, higher roles go at the top).

---

## 5. ⚠️ CRITICAL CAUTIONS & WARNINGS

Please read these rules carefully to ensure the website stays fast and doesn't break.

> **CAUTION: Image Sizes Matter!** 
> **Never** upload a 5MB or 10MB photo straight from a camera. Massive photos will make the website load painfully slow for mobile users and eat up your server bandwidth.
> * **Compress images** before uploading (use a free site like squoosh.app or tinypng.com).
> * Try to keep all images under **500 KB**.

> **NOTE: The 20-Second Delay**
> When you click "Publish" in the CMS, your changes **do not appear instantly**. The system has to generate the new website code on the Vercel servers (a process called "building"). 
> * **Wait 15 to 30 seconds** after publishing.
> * Go to the live website and **Hard Refresh** your browser (Ctrl+F5 on Windows, or Cmd+Shift+R on Mac) to force your browser to load the new content. Do not panic if it isn't there instantly!

> **WARNING: Do Not Spam the Publish Button**
> Every time you hit publish, the server runs a new build. 
> * If you are fixing 5 typos in 5 different articles, don't publish them one by one. Try to proofread thoroughly before hitting publish, or edit multiple articles at once.
