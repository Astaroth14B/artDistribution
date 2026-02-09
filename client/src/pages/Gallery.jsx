import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config';

const Gallery = () => {
    const { user } = useAuth();
    const [artworks, setArtworks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    const [selectedImg, setSelectedImg] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [reviewContent, setReviewContent] = useState('');
    const [rating, setRating] = useState(5);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const observer = useRef();

    // Cleanup observer on unmount
    useEffect(() => {
        return () => {
            if (observer.current) observer.current.disconnect();
        };
    }, []);

    const lastArtElementRef = useCallback(node => {
        if (loading || loadingMore) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries && entries[0] && entries[0].isIntersecting && hasMore) {
                console.log("Gallery: Triggering load for next page");
                setPage(prev => prev + 1);
            }
        });

        if (node) observer.current.observe(node);
    }, [loading, loadingMore, hasMore]);

    const fetchArt = async (pageNumber) => {
        console.log(`Gallery: Fetching art for page ${pageNumber}`);
        if (pageNumber === 1) setLoading(true);
        else setLoadingMore(true);

        try {
            const res = await axios.get(`${API_URL}/api/v1/art?page=${pageNumber}&limit=12`);
            console.log("Gallery: Received API response", res.data);

            let newItems = [];
            let moreAvailable = false;

            // Robust check for different potential response formats
            if (res.data && res.data.artworks && Array.isArray(res.data.artworks)) {
                // Paginated format
                newItems = res.data.artworks;
                moreAvailable = res.data.hasMore ?? false;
            } else if (Array.isArray(res.data)) {
                // Legacy array format
                newItems = res.data;
                moreAvailable = false; // Legacy format doesn't provide hasMore
            } else if (res.data && typeof res.data === 'object' && Array.isArray(Object.values(res.data)[0])) {
                // Unexpected object wrapping an array
                const firstArray = Object.values(res.data).find(val => Array.isArray(val));
                if (firstArray) {
                    newItems = firstArray;
                    moreAvailable = res.data.hasMore ?? false;
                }
            }

            if (newItems.length > 0) {
                setArtworks(prev => pageNumber === 1 ? newItems : [...prev, ...newItems]);
                setHasMore(moreAvailable);
            } else {
                console.log("Gallery: No items returned from API");
                if (pageNumber === 1) setArtworks([]);
                setHasMore(false);
            }
        } catch (err) {
            console.error("Gallery: Failed to fetch art", err);
            if (pageNumber === 1) setArtworks([]);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const fetchReviews = async (artId) => {
        if (!artId) return;
        try {
            const res = await axios.get(`${API_URL}/api/v1/reviews/${artId}`);
            setReviews(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("Gallery: Failed to fetch reviews", err);
            setReviews([]);
        }
    };

    useEffect(() => {
        fetchArt(page);
    }, [page]);

    useEffect(() => {
        if (selectedImg) {
            fetchReviews(selectedImg.id);
        }
    }, [selectedImg]);

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!reviewContent.trim() || !selectedImg) return;

        setIsSubmitting(true);
        try {
            await axios.post(`${API_URL}/api/v1/reviews/${selectedImg.id}`, {
                content: reviewContent,
                rating
            }, {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            setReviewContent('');
            setRating(5);
            fetchReviews(selectedImg.id);
        } catch (err) {
            console.error("Gallery: Failed to submit review", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Helper for profile picture fallback
    const getProfilePic = (uploader) => {
        if (uploader && uploader.profilePic && !uploader.profilePic.includes('placeholder')) {
            return uploader.profilePic;
        }
        // Return a stable data-uri for a generic profile icon (Fantasy colored)
        return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23c5a059'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";
    };

    return (
        <div className="page-content">
            <h1 className="section-title">ARTIST'S <span className="highlight">CAVE</span></h1>

            <div className="gallery-full-grid">
                {artworks.map((art, index) => {
                    const isLast = artworks.length === index + 1;
                    return (
                        <div
                            ref={isLast ? lastArtElementRef : null}
                            key={art.id || index}
                            className="gallery-item"
                            onClick={() => setSelectedImg(art)}
                        >
                            <img src={art.imageUrl} alt={art.title} loading="lazy" />
                            <div className="art-hover-info">
                                <span>{art.title}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {(loading || loadingMore) && (
                <div style={{ textAlign: 'center', fontFamily: 'var(--font-header)', color: 'var(--accent-gold)', margin: '40px 0' }}>
                    <p>{loading ? 'ENTERING THE CAVE...' : 'UNROLLING MORE SCROLLS...'}</p>
                </div>
            )}

            {!hasMore && artworks.length > 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-dim)', margin: '60px 0', fontStyle: 'italic', fontFamily: 'var(--font-body)' }}>
                    <p>You have reached the deepest depths of the cave.</p>
                </div>
            )}

            {/* Gallery Modal */}
            {selectedImg && (
                <div className="modal show" onClick={(e) => e.target.className === 'modal show' && setSelectedImg(null)} role="dialog" aria-modal="true" aria-labelledby="gallery-modal-title">
                    <div className="modalContent split-view" onClick={(e) => e.stopPropagation()}>

                        <div className="modal-left">
                            <img src={selectedImg.imageUrl} alt={selectedImg.title} className="art-preview-main" />
                        </div>

                        <div className="modal-right">
                            <div className="uploader-header">
                                <Link to={`/profile/${selectedImg.uploader?.serialNumber}`} onClick={() => setSelectedImg(null)}>
                                    <img
                                        src={getProfilePic(selectedImg.uploader)}
                                        alt="uploader"
                                        className="uploader-pic"
                                        style={{ cursor: 'pointer' }}
                                    />
                                </Link>
                                <div className="uploader-meta">
                                    <Link to={`/profile/${selectedImg.uploader?.serialNumber}`} onClick={() => setSelectedImg(null)} style={{ textDecoration: 'none' }}>
                                        <h4>{selectedImg.uploader?.username || "Unknown Master"}</h4>
                                    </Link>
                                    <p>SERIAL: {selectedImg.uploader?.serialNumber || "000000000000"}</p>
                                </div>
                            </div>

                            <div className="art-info">
                                <h3 id="gallery-modal-title">{selectedImg.title}</h3>
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

                            <hr style={{ border: 'none', borderTop: '1px solid var(--accent-gold-glow)', margin: '20px 0' }} />

                            <div className="reviews-section">
                                <h5 style={{ fontFamily: 'var(--font-header)', color: 'var(--accent-gold)', marginBottom: '15px' }}>THE SCRIBES SAY:</h5>
                                <div className="reviews-list">
                                    {Array.isArray(reviews) && reviews.length > 0 ? reviews.map(rev => (
                                        <div key={rev.id} className="review-entry">
                                            <strong>{rev.author || 'Anonymous'}</strong>: {rev.content}
                                            <div style={{ color: 'var(--accent-gold)', fontSize: '0.8rem', marginTop: '5px' }}>
                                                {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                                            </div>
                                        </div>
                                    )) : (
                                        <p style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>No inscriptions yet.</p>
                                    )}
                                </div>

                                {user ? (
                                    (() => {
                                        const isBanned = user.bannedState && (!user.banUntil || new Date(user.banUntil) > new Date());
                                        if (isBanned) {
                                            return (
                                                <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(139, 0, 0, 0.1)', border: '1px solid var(--accent-burgundy)', borderRadius: '4px', marginTop: '20px' }}>
                                                    <p style={{ color: 'var(--accent-burgundy)', fontWeight: 'bold', fontFamily: 'var(--font-header)' }}>TIMEOUT DECREE IN EFFECT</p>
                                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-sepia)', marginTop: '5px' }}>
                                                        You cannot leave inscriptions until {user.banUntil ? new Date(user.banUntil).toLocaleString() : 'the decree is lifted'}.
                                                    </p>
                                                    {user.bannedReason && <p style={{ fontSize: '0.8rem', fontStyle: 'italic', marginTop: '5px' }}>Reason: {user.bannedReason}</p>}
                                                </div>
                                            );
                                        }
                                        return (
                                            <form className="gallery-comment-form" onSubmit={handleReviewSubmit}>
                                                <div className="rating-select" style={{ marginBottom: '10px' }}>
                                                    {[1, 2, 3, 4, 5].map(s => (
                                                        <span
                                                            key={s}
                                                            onClick={() => setRating(s)}
                                                            style={{
                                                                cursor: 'pointer',
                                                                color: rating >= s ? 'var(--accent-gold)' : '#ccc',
                                                                fontSize: '1.5rem',
                                                                marginRight: '5px'
                                                            }}
                                                        >
                                                            ★
                                                        </span>
                                                    ))}
                                                </div>
                                                <textarea
                                                    placeholder="Write your review..."
                                                    value={reviewContent}
                                                    onChange={(e) => setReviewContent(e.target.value)}
                                                    required
                                                />
                                                <button type="submit" className="view-btn" disabled={isSubmitting}>
                                                    {isSubmitting ? 'SCRIBING...' : 'LEAVE INSCRIPTION'}
                                                </button>
                                            </form>
                                        );
                                    })()
                                ) : (
                                    <p style={{ textAlign: 'center', color: 'var(--accent-gold)', fontFamily: 'var(--font-header)', marginTop: '20px' }}>
                                        Login to leave a review
                                    </p>
                                )}
                            </div>
                        </div>
                        <button className="close-corner" onClick={() => setSelectedImg(null)}>&times;</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Gallery;
