import { useEffect } from 'react';
import { PAGE_REGISTRY } from '../core/data/registry';
import { getCanonicalUrl, getStructuredData } from '../core/seo/seo-utils';

interface SEOProps {
    currentPage: string;
}

export const SEO: React.FC<SEOProps> = ({ currentPage }) => {
  useEffect(() => {
    // Blog sayfaları kendi yazıya özel metadatasını yönetir.
    if (currentPage === 'blog') return;

    const meta = PAGE_REGISTRY[currentPage] || PAGE_REGISTRY.home;
        const canonicalUrl = getCanonicalUrl(meta.slug);

        // Update Title
        document.title = meta.title;

        // Update Meta Description
        let metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.setAttribute('content', meta.description);
        } else {
            metaDescription = document.createElement('meta');
            metaDescription.setAttribute('name', 'description');
            metaDescription.setAttribute('content', meta.description);
            document.head.appendChild(metaDescription);
        }

        // Update Keywords
        let metaKeywords = document.querySelector('meta[name="keywords"]');
        if (meta.keywords) {
            if (metaKeywords) {
                metaKeywords.setAttribute('content', meta.keywords);
            } else {
                metaKeywords = document.createElement('meta');
                metaKeywords.setAttribute('name', 'keywords');
                metaKeywords.setAttribute('content', meta.keywords);
                document.head.appendChild(metaKeywords);
            }
        }

        // Update Canonical Link
        let canonicalLink = document.querySelector('link[rel="canonical"]');
        if (canonicalLink) {
            canonicalLink.setAttribute('href', canonicalUrl);
        } else {
            canonicalLink = document.createElement('link');
            canonicalLink.setAttribute('rel', 'canonical');
            canonicalLink.setAttribute('href', canonicalUrl);
            document.head.appendChild(canonicalLink);
        }

        // Update Robots Meta
        let robotsMeta = document.querySelector('meta[name="robots"]');
        if (meta.noindex) {
            if (robotsMeta) {
                robotsMeta.setAttribute('content', 'noindex, follow');
            } else {
                robotsMeta = document.createElement('meta');
                robotsMeta.setAttribute('name', 'robots');
                robotsMeta.setAttribute('content', 'noindex, follow');
                document.head.appendChild(robotsMeta);
            }
        } else if (robotsMeta) {
            robotsMeta.setAttribute('content', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
        }

        // Update Open Graph tags
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) ogTitle.setAttribute('content', meta.title);

        const ogDescription = document.querySelector('meta[property="og:description"]');
        if (ogDescription) ogDescription.setAttribute('content', meta.description);

        const ogUrl = document.querySelector('meta[property="og:url"]');
        if (ogUrl) {
            ogUrl.setAttribute('content', canonicalUrl);
        } else {
            const newOgUrl = document.createElement('meta');
            newOgUrl.setAttribute('property', 'og:url');
            newOgUrl.setAttribute('content', canonicalUrl);
            document.head.appendChild(newOgUrl);
        }

        // Update Twitter Card URL
        let twitterUrl = document.querySelector('meta[name="twitter:url"]');
        if (!twitterUrl) {
            twitterUrl = document.createElement('meta');
            twitterUrl.setAttribute('name', 'twitter:url');
            document.head.appendChild(twitterUrl);
        }
        twitterUrl.setAttribute('content', canonicalUrl);

        // Update JSON-LD Structured Data
        let jsonLdScript = document.querySelector('script[type="application/ld+json"]');
        const structuredData = getStructuredData(currentPage);

        if (jsonLdScript) {
            jsonLdScript.textContent = JSON.stringify(structuredData);
        } else {
            jsonLdScript = document.createElement('script');
            jsonLdScript.setAttribute('type', 'application/ld+json');
            jsonLdScript.textContent = JSON.stringify(structuredData);
            document.head.appendChild(jsonLdScript);
        }

        // Add hreflang for Turkish
        let hreflang = document.querySelector('link[hreflang="tr"]');
        if (!hreflang) {
            hreflang = document.createElement('link');
            hreflang.setAttribute('rel', 'alternate');
            hreflang.setAttribute('hreflang', 'tr');
            hreflang.setAttribute('href', canonicalUrl);
            document.head.appendChild(hreflang);
        } else {
            hreflang.setAttribute('href', canonicalUrl);
        }

        // Add hreflang x-default
        let xDefault = document.querySelector('link[hreflang="x-default"]');
        if (!xDefault) {
            xDefault = document.createElement('link');
            xDefault.setAttribute('rel', 'alternate');
            xDefault.setAttribute('hreflang', 'x-default');
            xDefault.setAttribute('href', canonicalUrl);
            document.head.appendChild(xDefault);
        } else {
            xDefault.setAttribute('href', canonicalUrl);
        }

    }, [currentPage]);

    return null;
};
