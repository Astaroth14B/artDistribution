import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config';

const ArtistProfile = () => {
    const { serialNumber } = useParams();
    const [artist, setArtist] = useState(null);
    const [artworks, setArtworks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedImg, setSelectedImg] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch artist info
                const artistRes = await axios.get(`${API_URL}/api/v1/auth/user/${serialNumber}`);
                setArtist(artistRes.data);

                // Fetch artist's art
                const artRes = await axios.get(`${API_URL}/api/v1/art/user/${serialNumber}`);
                setArtworks(artRes.data);
            } catch (err) {
                console.error("Failed to fetch artist profile:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [serialNumber]);

    if (loading) {
        return (
            <div className="page-content" style={{ textAlign: 'center', paddingTop: '150px' }}>
                <h2 style={{ fontFamily: 'var(--font-header)', color: 'var(--accent-gold)' }}>OPENING THE ARTIST'S ARCHIVE...</h2>
            </div>
        );
    }

    if (!artist) {
        return (
            <div className="page-content" style={{ textAlign: 'center', paddingTop: '150px' }}>
                <h2 style={{ color: 'var(--accent-burgundy)' }}>THIS ARTIST HAS VANISHED INTO THE SHADOWS.</h2>
                <Link to="/gallery" className="cyber-btn" style={{ marginTop: '20px' }}>RETURN TO MAIN CAVE</Link>
            </div>
        );
    }

    return (
        <div className="page-content">
            <div className="artist-profile-header" style={{
                padding: '60px 40px',
                background: 'rgba(255, 255, 255, 0.4)',
                borderBottom: '1px solid var(--accent-gold-glow)',
                marginBottom: '40px',
                textAlign: 'center'
            }}>
                <img
                    src={artist.profilePic || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23c5a059'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E"}
                    alt={artist.username}
                    style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        border: '3px solid var(--accent-gold)',
                        objectFit: 'cover',
                        marginBottom: '20px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                    }}
                />
                <h1 style={{ fontFamily: 'var(--font-header)', fontSize: '2.5rem', marginBottom: '10px' }}>{artist.username}</h1>

                <div className="artist-reputation" style={{ marginBottom: '20px' }}>
                    <div style={{ color: 'var(--accent-gold)', fontSize: '1.5rem', marginBottom: '5px' }}>
                        {'★'.repeat(Math.round(artist.avgRating || 0))}{'☆'.repeat(5 - Math.round(artist.avgRating || 0))}
                    </div>
                    <p style={{ margin: 0, fontWeight: 'bold', letterSpacing: '1px', color: 'var(--accent-gold)' }}>
                        REPUTATION: {artist.avgRating} / 5.0
                    </p>
                </div>

                <div className="artist-stats" style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginBottom: '20px' }}>
                    <div>
                        <span style={{ display: 'block', fontSize: '1.2rem', fontWeight: 'bold' }}>{artist.totalArt || 0}</span>
                        <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-dim)' }}>Scrolls Shared</span>
                    </div>
                    <div>
                        <span style={{ display: 'block', fontSize: '1.2rem', fontWeight: 'bold' }}>{artist.reviewCount || 0}</span>
                        <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-dim)' }}>Inscriptions Received</span>
                    </div>
                </div>

                <p style={{ fontFamily: 'monospace', color: 'var(--text-dim)', fontSize: '0.8rem' }}>SERIAL: {artist.serialNumber}</p>
                <div style={{ maxWidth: '600px', margin: '20px auto', color: 'var(--text-sepia)' }}>
                    <p>Welcome to the personal collection of {artist.username}. Every scroll below tells a unique story from the depths of imagination.</p>
                </div>
            </div>

            <h2 className="section-title" style={{ fontSize: '2rem' }}>PERSONAL <span className="highlight">COLLECTION</span></h2>

            <div className="gallery-full-grid">
                {artworks.length > 0 ? artworks.map((art) => (
                    <div
                        key={art.id}
                        className="gallery-item"
                        onClick={() => setSelectedImg(art)}
                    >
                        <img src={art.imageUrl} alt={art.title} loading="lazy" />
                        <div className="art-hover-info">
                            <span>{art.title}</span>
                        </div>
                    </div>
                )) : (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px 0', color: 'var(--text-dim)' }}>
                        <p>This artist has not yet shared any scrolls in this realm.</p>
                    </div>
                )}
            </div>

            {/* Reuse the split-view modal logic if needed, or simplified version */}
            {selectedImg && (
                <div className="modal show" onClick={(e) => e.target.className === 'modal show' && setSelectedImg(null)} role="dialog" aria-modal="true" aria-labelledby="artist-modal-title">
                    <div className="modalContent split-view" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-left">
                            <img src={selectedImg.imageUrl} alt={selectedImg.title} className="art-preview-main" />
                        </div>
                        <div className="modal-right">
                            <div className="art-info">
                                <h3 id="artist-modal-title">{selectedImg.title}</h3>
                                <p className="art-desc">{selectedImg.description || "No description provided."}</p>
                                <button
                                    onClick={async () => {
                                        try {
                                            const response = await fetch(selectedImg.imageUrl);
                                            const blob = await response.blob();
                                            const url = window.URL.createObjectURL(blob);
                                            const link = document.createElement('a');
                                            link.href = url;
                                            link.download = `${selectedImg.title || 'art'}.webp`;
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                            window.URL.revokeObjectURL(url);
                                        } catch (err) {
                                            window.open(selectedImg.imageUrl, '_blank');
                                        }
                                    }}
                                    className="view-btn"
                                    style={{ marginTop: '10px' }}
                                >
                                    GET THIS SCROLL
                                </button>
                            </div>
                        </div>
                        <button className="close-corner" onClick={() => setSelectedImg(null)}>&times;</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ArtistProfile;
