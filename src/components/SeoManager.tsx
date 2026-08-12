import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import routeMetadata from '../../content/route-metadata.json';
import { absoluteUrl, siteMetadata } from '../utils/metadata';

type RouteMetadata = {
  path: string;
  title: string;
  description: string;
  index: boolean;
};

const routes = routeMetadata as RouteMetadata[];
const homeMetadata = routes.find(route => route.path === '/')!;

const normalizePath = (pathname: string) => pathname.replace(/\/$/, '') || '/';

function setNamedMeta(name: string, content: string) {
  let node = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!node) {
    node = document.createElement('meta');
    node.name = name;
    document.head.appendChild(node);
  }
  node.content = content;
}

function setPropertyMeta(property: string, content: string) {
  let node = document.head.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!node) {
    node = document.createElement('meta');
    node.setAttribute('property', property);
    document.head.appendChild(node);
  }
  node.content = content;
}

function setCanonical(url: string) {
  let node = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!node) {
    node = document.createElement('link');
    node.rel = 'canonical';
    document.head.appendChild(node);
  }
  node.href = url;
}

export default function SeoManager() {
  const { pathname } = useLocation();

  useEffect(() => {
    const path = normalizePath(pathname);
    const metadata = routes.find(route => route.path === path);
    const current = metadata ?? {
      ...homeMetadata,
      title: 'Page introuvable | Doxali',
      description: 'Cette page n’existe pas ou a été déplacée.',
      index: false,
    };
    const canonical = absoluteUrl(path);
    const image = absoluteUrl(siteMetadata.ogImage);
    const socialTitle = current.title.replace(' | Doxali', ' — Doxali');

    document.title = current.title;
    setNamedMeta('description', current.description);
    setNamedMeta(
      'robots',
      current.index
        ? 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'
        : 'noindex,follow'
    );
    setCanonical(canonical);

    setPropertyMeta('og:title', socialTitle);
    setPropertyMeta('og:description', current.description);
    setPropertyMeta('og:url', canonical);
    setPropertyMeta('og:image', image);
    setPropertyMeta('og:image:secure_url', image);

    setNamedMeta('twitter:title', current.title);
    setNamedMeta('twitter:description', current.description);
    setNamedMeta('twitter:image', image);
  }, [pathname]);

  return null;
}
