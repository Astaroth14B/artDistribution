import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import API_URL from '../config';

const AuthModal = () => {
    const { isAuthModalOpen, authView, closeAuthModal, setAuthView } = useUI();
    const { login, resendCode } = useAuth();

    // Login State
    const [loginData, setLoginData] = useState({ username: '', password: '', masterKey: '' });
    const [loginError, setLoginError] = useState('');
    const [showAdminKey, setShowAdminKey] = useState(false);

    // Register State
    const [registerStep, setRegisterStep] = useState(1);
    const [verificationCode, setVerificationCode] = useState('');
    const [registerData, setRegisterData] = useState({ email: '', username: '', password: '', profilePic: null });
    const [preview, setPreview] = useState(null);
    const [registerError, setRegisterError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleLoginChange = (e) => setLoginData({ ...loginData, [e.target.name]: e.target.value });

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoginError('');
        try {
            const res = await login(loginData);
            if (res.success) {
                closeAuthModal();
            } else {
                if (res.isAdmin) {
                    setShowAdminKey(true);
                    setLoginError('MASTER SEAL REQUIRED TO ENTER THE ARCHIVE.');
                } else if (res.needsVerification) {
                    setAuthView('register');
                    setRegisterStep(4);
                    setRegisterData({ ...registerData, username: loginData.username });
                    setRegisterError('ACCOUNT PENDING. PLEASE PRESENT THE SEAL.');
                } else {
                    setLoginError(res.msg);
                }
            }
        } catch (err) {
            setLoginError('Access Denied');
        }
    };

    const handleRegisterChange = (e) => setRegisterData({ ...registerData, [e.target.name]: e.target.value });

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setRegisterData({ ...registerData, profilePic: file });
        if (file) setPreview(URL.createObjectURL(file));
    };

    const handleRegisterSubmit = async (e) => {
        if (e) e.preventDefault();
        setIsSubmitting(true);
        setRegisterError('');

        const data = new FormData();
        data.append('username', registerData.username);
        data.append('email', registerData.email);
        data.append('password', registerData.password);
        if (registerData.profilePic) data.append('profilePic', registerData.profilePic);

        try {
            const res = await axios.post(`${API_URL}/api/v1/auth/register`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            // Move to verification step
            setRegisterStep(4);
            setRegisterError('');
        } catch (err) {
            setRegisterError(err.response?.data?.msg || 'Registration failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVerifySubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await axios.post(`${API_URL}/api/v1/auth/verify-email`, {
                username: registerData.username,
                code: verificationCode
            });
            setAuthView('login');
            setLoginError('ACCOUNT ACTIVATED. YOU MAY NOW ENTER.');
            setLoginData({ ...loginData, username: registerData.username });
        } catch (err) {
            setRegisterError(err.response?.data?.msg || 'Verification failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResendCode = async () => {
        setIsSubmitting(true);
        const res = await resendCode(registerData.email);
        if (res.success) {
            setRegisterError('A NEW SEAL HAS BEEN CAST.');
        } else {
            setRegisterError(res.msg);
        }
        setIsSubmitting(false);
    };

    if (!isAuthModalOpen) return null;

    return (
        <div className="modal" style={{ display: 'flex' }} onClick={(e) => e.target.className === 'modal' && closeAuthModal()}>
            <div className="contact-content" style={{ position: 'relative', zIndex: 2001, width: '100%', maxWidth: '450px' }}>
                <div className="cyber-form" style={{ width: '100%', boxSizing: 'border-box' }}>
                    <button onClick={closeAuthModal} style={{ position: 'absolute', top: '15px', right: '20px', background: 'transparent', border: 'none', color: 'var(--text-sepia)', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>

                    {authView === 'login' ? (
                        <>
                            <h3>SYSTEM <span className="highlight">ACCESS</span></h3>
                            <p style={{ textAlign: 'center', marginBottom: '25px', fontFamily: 'var(--font-alt)' }}>Enter the Secret Archive.</p>
                            {loginError && <p style={{ color: loginError.includes('ACTIVATED') || loginError.includes('SUCCESS') ? 'green' : 'red', textAlign: 'center', fontSize: '0.9rem' }}>{loginError}</p>}
                            <form onSubmit={handleLoginSubmit}>
                                <div className="sec">
                                    <input type="text" name="username" placeholder="USERNAME" onChange={handleLoginChange} required />
                                </div>
                                <div className="sec">
                                    <input type="password" name="password" placeholder="PASSWORD" onChange={handleLoginChange} required />
                                </div>
                                {showAdminKey && (
                                    <div className="sec" style={{ animation: 'shiver 0.3s' }}>
                                        <label style={{ fontSize: '0.7rem', color: 'var(--accent-gold)' }}>MASTER SEAL REQUIRED</label>
                                        <input type="password" name="masterKey" placeholder="GRANDMASTER KEY" onChange={handleLoginChange} required autoFocus />
                                    </div>
                                )}
                                <button className="cyber-btn" style={{ width: '100%' }}>INITIATE LOGIN</button>
                            </form>
                            <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem' }}>
                                New artist? <span onClick={() => { setAuthView('register'); setRegisterStep(1); }} style={{ color: 'var(--accent-gold)', cursor: 'pointer', fontWeight: 'bold' }}>Register Here</span>
                            </p>
                        </>
                    ) : (
                        <>
                            <h3>NEW <span className="highlight">ARTIST</span></h3>
                            <p style={{ textAlign: 'center', marginBottom: '15px', fontFamily: 'var(--font-alt)' }}>
                                {registerStep === 4 ? 'AWAITING THE SEAL' : `Step ${registerStep} of 3`}
                            </p>
                            {registerError && <p style={{ color: 'red', textAlign: 'center', fontSize: '0.9rem' }}>{registerError}</p>}

                            <form onSubmit={(e) => e.preventDefault()}>
                                {registerStep === 1 && (
                                    <div className="sec">
                                        <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '5px' }}>EMAIL ADDRESS</label>
                                        <input type="email" name="email" value={registerData.email} placeholder="artist@example.com" onChange={handleRegisterChange} required />
                                        <button className="cyber-btn" onClick={() => setRegisterStep(2)} style={{ width: '100%', marginTop: '15px' }}>NEXT STEP</button>
                                    </div>
                                )}
                                {registerStep === 2 && (
                                    <>
                                        <div className="sec">
                                            <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '5px' }}>CHOOSE USERNAME</label>
                                            <input type="text" name="username" value={registerData.username} placeholder="USERNAME" onChange={handleRegisterChange} required />
                                        </div>
                                        <div className="sec">
                                            <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '5px' }}>SET PASSWORD</label>
                                            <input type="password" name="password" value={registerData.password} placeholder="PASSWORD" onChange={handleRegisterChange} required />
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button className="cyber-btn" onClick={() => setRegisterStep(1)} style={{ flex: 1, background: '#888', borderColor: '#888' }}>BACK</button>
                                            <button className="cyber-btn" onClick={() => setRegisterStep(3)} style={{ flex: 1 }}>NEXT</button>
                                        </div>
                                    </>
                                )}
                                {registerStep === 3 && (
                                    <>
                                        <div className="sec" style={{ textAlign: 'center' }}>
                                            <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '10px' }}>PROFILE REPRESENTATION</label>
                                            <div style={{ margin: '15px 0' }}>
                                                {preview ? (
                                                    <img src={preview} alt="Preview" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-gold)' }} />
                                                ) : (
                                                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: '2px dashed #ccc', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}>SVG</div>
                                                )}
                                            </div>
                                            <input type="file" id="reg-file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                                            <label htmlFor="reg-file" className="cyber-btn" style={{ display: 'block', width: '100%', cursor: 'pointer', textAlign: 'center', boxSizing: 'border-box', fontSize: '0.8rem' }}>CHOOSE IMAGE</label>
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                            <button className="cyber-btn" onClick={() => setRegisterStep(2)} style={{ flex: 1, background: '#888', borderColor: '#888' }}>BACK</button>
                                            <button className="cyber-btn" onClick={handleRegisterSubmit} style={{ flex: 1 }}>{isSubmitting ? 'SENDING SEAL...' : 'FINISH'}</button>
                                        </div>
                                    </>
                                )}
                                {registerStep === 4 && (
                                    <div className="sec">
                                        <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '10px', textAlign: 'center' }}>PRESENT THE 6-DIGIT SEAL SENT TO YOUR EMAIL</label>
                                        <input
                                            type="text"
                                            placeholder="XXXXXX"
                                            value={verificationCode}
                                            onChange={(e) => setVerificationCode(e.target.value)}
                                            maxLength="6"
                                            style={{ textAlign: 'center', fontSize: '2rem', letterSpacing: '8px', fontFamily: 'var(--font-header)' }}
                                            required
                                        />
                                        <button className="cyber-btn" onClick={handleVerifySubmit} style={{ width: '100%', marginTop: '15px' }}>{isSubmitting ? 'ACTIVATING...' : 'ACTIVATE ACCOUNT'}</button>
                                        <div style={{ textAlign: 'center', marginTop: '15px' }}>
                                            <span onClick={handleResendCode} style={{ color: 'var(--accent-gold)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', textDecoration: 'underline' }}>
                                                {isSubmitting ? 'CASTING...' : 'RESEND THE SEAL'}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textAlign: 'center', marginTop: '10px' }}>Check your mail for the Grand Archive's message.</p>
                                    </div>
                                )}
                            </form>
                            <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem' }}>
                                Already an artist? <span onClick={() => setAuthView('login')} style={{ color: 'var(--accent-gold)', cursor: 'pointer', fontWeight: 'bold' }}>Login Here</span>
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
