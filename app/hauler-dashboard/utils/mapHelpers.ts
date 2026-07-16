import mapboxgl from 'mapbox-gl';

export const createTruckMarkerElement = (heading: number = 0): HTMLDivElement => {
  const el = document.createElement('div');
  el.className = 'truck-marker';
  el.innerHTML = `
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" 
         style="transform: rotate(${heading}deg); transition: transform 0.3s ease;">
      <circle cx="20" cy="20" r="18" fill="#16A34A" opacity="0.3"/>
      <circle cx="20" cy="20" r="14" fill="#16A34A"/>
      <path d="M20 12 L24 24 L20 20 L16 24 Z" fill="white"/>
    </svg>
  `;
  el.style.cssText = `
    width: 40px;
    height: 40px;
    filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
    animation: pulse-green 2s infinite;
  `;
  return el;
};

export const addMapStyles = () => {
  if (typeof window === 'undefined') return;
  
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes pulse-green {
      0% { transform: scale(1); filter: drop-shadow(0 0 0 rgba(22, 163, 74, 0.7)); }
      50% { transform: scale(1.05); filter: drop-shadow(0 0 10px rgba(22, 163, 74, 0.4)); }
      100% { transform: scale(1); filter: drop-shadow(0 0 0 rgba(22, 163, 74, 0)); }
    }
    .mapboxgl-ctrl-bottom-right { display: none; }
  `;
  document.head.appendChild(style);
};