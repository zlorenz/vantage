=== ContentStudio ===
Contributors: ContentStudio
Donate link: http://contentstudio.io
Tags: content marketing, social media, blog automation, content scheduler, social media management
Requires at least: 5.8
Tested up to: 6.9
Stable tag: 1.4.1
Requires PHP: 7.4
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

Streamline Your Social Media and Content Marketing


== Description ==

ContentStudio is a powerful content marketing and social media management platform for publishers, brands, agencies and, startups who want to share the best content consistently and increase their reach.

[youtube https://youtu.be/LjYo32s8dBk]

##### [Start your 14-day free trial today!](http://app.contentstudio.io/signup)


Want to learn more about the ContentStudio?


### Content Discovery and Insights

Our discovery engine keeps you updated with highly relevant and trending content suggestions pulled from our massive database of sources or your own custom collection of sources. Get deep and actionable insights for any topic to optimize your content marketing strategy.

### Multi-Channel Composer

Compose fresh content for your blog or social media from an intuitive editor. Embed content from your favorite sources, collaborate with your team and manage approvals. It also comes with SEO optimization toolbox, image editor, trending hashtag suggestions, UTM manager and a lot more.

### Planner & Calendar

Streamline your content workflow by collaborating with your team members and planning campaigns from an interactive calendar or list view. Plan, approve, reject or schedule content for all your marketing channels from a single place and be in control of your content and social media strategy.

### Automation Recipes

Step by step templates helps you set up various types of automation campaigns saving tons of time. Get relevant & targeted content posted to your channels according to your own needs and settings. Advanced rules help in finding and planning content relevant to your industry or interests.

### Analytics & Reporting

Step by step templates helps you set up various types of automation campaigns saving tons of time. Get relevant & targeted content posted to your channels according to your own needs and settings. Advanced rules help in finding and planning content specific to your industry or interests.

### Integrate ContentStudio with Your Favorite Tools

No more jumping from screen to screen to manage your tools! ContentStudio integrates with more than 20+ tools you love.


##### [Schedule a demo today!](https://contentstudio.io/book-a-demo)


== Frequently Asked Questions ==

##### What is ContentStudio?

ContentStudio is a powerful content marketing and social media management platform for publishers, brands, agencies and, startups who want to share the best content consistently and increase their reach.

##### How does the ContentStudio plug-in work?

ContentStudio synchronizes your WordPress posts, author, and category information to its servers, but all of your WordPress data remains in WordPress. ContentStudio will update that WordPress data as you direct, but the data always remains in WordPress.

##### How do I get ContentStudio?

After you [sign up for an account at ContentStudio](https://app.contentstudio.io/signup), you can connect your WordPress blog to your ContentStudio account.

##### How much does ContentStudio cost?

ContentStudio has several subscription plans to choose from, starting at $49/month. [Choose the right plan for you + your team](https://contentstudio.io/pricing).

== Installation ==

1. Upload the `contentstudio` folder to the `/wp-content/plugins/` directory
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Go to ContentStudio settings page and enter your API key
4. Connect your blog with ContentStudio from app.contentstudio.io

== Changelog ==

= 1.4.0 =
* Missing file issue fixed

= 1.4.0 =
* SECURITY: Fixed arbitrary file upload vulnerability (CVE-2025-12181) - Now validates file types before saving
* SECURITY: Fixed CSRF vulnerability in settings (CVE-2025-13144) - Nonce verification is now mandatory
* MAJOR: Migrated from init hooks to WordPress REST API for all post operations
* MAJOR: Replaced username/password authentication with secure API key authentication
* NEW: Added comprehensive file type validation for all image uploads
* NEW: Added PHP code detection in uploaded files for additional security
* IMPROVED: Better error handling and response messages
* IMPROVED: Code refactoring following WordPress coding standards
* Updated minimum WordPress version to 5.8
* Updated minimum PHP version to 7.4

= 1.3.7 =
* Bug fixes and improvements

= 1.3.6 =
* Bug fixes and improvements

== Upgrade Notice ==

= 1.4.0 =
Critical security update. This version fixes two security vulnerabilities (CVE-2025-12181 and CVE-2025-13144). All users should update immediately. Note: This version uses REST API instead of init hooks - please update your ContentStudio app integration.
