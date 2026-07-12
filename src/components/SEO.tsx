import { useEffect, type FC } from 'react';
import { PAGE_REGISTRY } from '../core/data/registry';
import { getCanonicalUrl, getStructuredData } from '../core/seo/seo-utils';

interface SEOProps {
  currentPage: string;
}

export const SEO: FC<SEOProps> = ({ currentPage }) => {
  useEffect(() => {
    // Blog liste, sayfalama ve yazı sayfaları kendi SEO verilerini yönetir.
    // Bu kontrol olmazsa genel /blog metadatası yazıya özel başlığı ve canonical URL'yi ezer.
    if (currentPage === 'blog') return;

    const meta = PAGE_REGISTRY[currentPage] || PAGE_REGISTRY.home;
    const canonicalUrl = getCanonicalUrl(meta.slug);

    document.title = meta.title;

    let metaDescription = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    );
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', meta.description);

    let metaKeywords = document.querySelector<HTMLMetaElement>(
      'meta[name="keywords"]',
    );
    if (meta.keywords) {
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta');
        metaKeywords.setAttribute('name', 'keywords');
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute('content', meta.keywords);
    } else {
      metaKeywords?.remove();
    }

    let canonicalLink = document.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    let robotsMeta = document.querySelector<HTMLMetaElement>(
      'meta[name="robots"]',
    );
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.setAttribute('name', 'robots');
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.setAttribute(
      'content',
      meta.noindex
        ? 'noindex, follow'
        : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    );

    const setMeta = (
      selector: string,
      attribute: 'name' | 'property',
      key: string,
      content: string,
    ) => {
      let element = document.querySelector<HTMLMetaElement>(selector);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    setMeta('meta[property="og:title"]', 'property', 'og:title', meta.title);
    setMeta(
      'meta[property="og:description"]',
      'property',
      'og:description',
      meta.description,
    );
    setMeta('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);
    setMeta('meta[property="og:type"]', 'property', 'og:type', 'website');
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', meta.title);
    setMeta(
      'meta[name="twitter:description"]',
      'name',
      'twitter:description',
      meta.description,
    );
    setMeta('meta[name="twitter:url"]', 'name', 'twitter:url', canonicalUrl);
    setMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');

    let jsonLdScript = document.querySelector<HTMLScriptElement>(
      'script[type="application/ld+json"]',
    );
    if (!jsonLdScript) {
      jsonLdScript = document.createElement('script');
      jsonLdScript.setAttribute('type', 'application/ld+json');
      document.head.appendChild(jsonLdScript);
    }
    jsonLdScript.textContent = JSON.stringify(getStructuredData(currentPage));

    const setAlternate = (hreflang: string) => {
      let link = document.querySelector<HTMLLinkElement>(
        `link[rel="alternate"][hreflang="${hreflang}"]`,
      );
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'alternate');
        link.setAttribute('hreflang', hreflang);
        document.head.appendChild(link);
      }
      link.setAttribute('href', canonicalUrl);
    };

    setAlternate('tr');
    setAlternate('x-default');
  }, [currentPage]);

  return null;
};
