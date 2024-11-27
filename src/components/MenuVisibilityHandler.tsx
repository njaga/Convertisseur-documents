import { useEffect } from 'react';

const MenuVisibilityHandler = () => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const header = document.querySelector('header'); // Assurez-vous que votre menu est dans un élément header
          if (header) {
            if (entry.isIntersecting) {
              header.style.opacity = '0';
              header.style.pointerEvents = 'none';
            } else {
              header.style.opacity = '1';
              header.style.pointerEvents = 'auto';
            }
          }
        });
      },
      { threshold: 0.1 } // Le seuil de déclenchement
    );

    const conditionsSection = document.querySelector('#conditions');
    if (conditionsSection) {
      observer.observe(conditionsSection);
    }

    return () => {
      if (conditionsSection) {
        observer.unobserve(conditionsSection);
      }
    };
  }, []);

  return null;
};

export default MenuVisibilityHandler;
