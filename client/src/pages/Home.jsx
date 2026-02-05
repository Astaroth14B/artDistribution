import React from 'react';
import { Link } from 'react-router-dom';
import { useUI } from '../context/UIContext';
import './Home.css';

const Home = () => {
    const { openUploadModal } = useUI();

    return (
        <section className="pinterest-hero">
            {/* Floating masonry images */}
            {/* Floating masonry images */}
            <div className="masonry-container">
                <div className="masonry-column col-1">
                    {[1, 2, 3, 4, 1, 2, 3, 4].map((n, i) => (
                        <div key={i} className={`pin item-${n}`}></div>
                    ))}
                </div>
                <div className="masonry-column col-2">
                    {[5, 6, 7, 8, 5, 6, 7, 8].map((n, i) => (
                        <div key={i} className={`pin item-${n}`}></div>
                    ))}
                </div>
                <div className="masonry-column col-3">
                    {[9, 10, 11, 12, 9, 10, 11, 12].map((n, i) => (
                        <div key={i} className={`pin item-${n}`}></div>
                    ))}
                </div>
                <div className="masonry-column col-4">
                    {[13, 14, 15, 16, 13, 14, 15, 16].map((n, i) => (
                        <div key={i} className={`pin item-${n}`}></div>
                    ))}
                </div>
                <div className="masonry-column col-5">
                    {[17, 18, 19, 20, 17, 18, 19, 20].map((n, i) => (
                        <div key={i} className={`pin item-${n}`}></div>
                    ))}
                </div>
            </div>

            {/* Center headline */}
            <div className="hero-center">
                <h1>
                    Get your next <br />
                    <span>art inspiration</span>
                </h1>
                <p>You draw, we share.</p>

                <div className="hero-actions">
                    <Link to="/gallery" className="primary-btn">Explore Gallery</Link>
                    <button onClick={openUploadModal} className="secondary-btn">
                        Upload Art
                    </button>
                </div>
            </div>
        </section>
    );
};

export default Home;
