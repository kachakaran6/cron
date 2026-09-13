import React, { useEffect } from 'react';

interface SEOHeadProps {
  title: string;
  description: string;
  canonicalUrl?: string;
  ogImage?: string;
  keywords?: string;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  canonicalUrl = 'https://cron.samast.pro/',
  ogImage = 'https://cron.samast.pro/cron-og.png',
  keywords = 'cron, scheduled tasks, webhooks, http scheduler, background jobs, serverless cron, samast cron',
}) => {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Helper function to update meta property/name
    const updateMeta = (selector: string, attr: string, value: string) => {
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        if (selector.startsWith('meta[name=')) {
          const nameVal = selector.split('"')[1];
          element.setAttribute('name', nameVal);
        } else if (selector.startsWith('meta[property=')) {
          const propVal = selector.split('"')[1];
          element.setAttribute('property', propVal);
        }
        document.head.appendChild(element);
      }
      element.setAttribute(attr, value);
    };

    // Update Meta Tags
    updateMeta('meta[name="description"]', 'content', description);
    updateMeta('meta[name="keywords"]', 'content', keywords);
    updateMeta('meta[property="og:title"]', 'content', title);
    updateMeta('meta[property="og:description"]', 'content', description);
    updateMeta('meta[property="og:url"]', 'content', canonicalUrl);
    updateMeta('meta[property="og:image"]', 'content', ogImage);
    updateMeta('meta[name="twitter:title"]', 'content', title);
    updateMeta('meta[name="twitter:description"]', 'content', description);
    updateMeta('meta[name="twitter:image"]', 'content', ogImage);

    // Update Canonical URL
    let linkCanonical = document.querySelector('link[rel="canonical"]');
    if (!linkCanonical) {
      linkCanonical = document.createElement('link');
      linkCanonical.setAttribute('rel', 'canonical');
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.setAttribute('href', canonicalUrl);
  }, [title, description, canonicalUrl, ogImage, keywords]);

  return null;
};
