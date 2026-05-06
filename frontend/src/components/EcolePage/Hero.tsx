import React from 'react';

export const Hero: React.FC = () => {
  return (
    <header className="hero">
      <h1 className="hero__title">
        Guide <span>ENSAM</span>
      </h1>
      <p className="hero__subtitle">
        Tout ce que vous devrez savoir sur l'école
      </p>

      {/* Media placeholder grid */}
      <div className="media-grid">
        <div className="media-grid__item"></div>
        <div className="media-grid__item"></div>
        <div className="media-grid__item media-grid__item--wide"></div>
      </div>
    </header>
  );
};