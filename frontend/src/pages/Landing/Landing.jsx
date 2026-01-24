import React from 'react'
import { Link } from "react-router-dom";
import { GraduationCap, ChartNoAxesCombined, Lock } from 'lucide-react';

const Landing = () => {
    return (
        <div>
            {/* Hero Section */}
            <div className="page-container page-container--full">
                <div className="container container--md">
                    <div className="text-center animate-fade-in">
                        {/* Logo/Brand */}
                        <div className="mb-6">
                            <h2 style={{
                                fontSize: '1.5rem',
                                fontWeight: '700',
                                color: 'var(--primary-purple)',
                                letterSpacing: '-0.02em'
                            }}>
                                <GraduationCap size={28} strokeWidth={2} className="inline-block mr-2" />
                                EduMaths
                            </h2>
                        </div>

                        {/* Hero Title */}
                        <h1 className="hero-title">
                            Your Gateway to Excellence
                        </h1>

                        {/* Hero Description */}
                        <p className="hero-description">
                            Empower your teaching journey with our comprehensive exam management platform. Create, manage, and assess with ease.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex gap-3 justify-center" style={{ flexWrap: 'wrap' }}>
                            <Link to="/signup" className="btn btn-primary btn-lg">
                                Get Started Free
                            </Link>
                            <Link to="/login" className="btn btn-secondary btn-lg">
                                Teacher Login
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="py-6" style={{ backgroundColor: 'var(--bg-primary)' }}>
                <div className="container">
                    <div className="text-center mb-6">
                        <h2 className="section-title">Why Choose EduMaths?</h2>
                        <p className="section-subtitle">
                            Everything you need to manage online assessments effectively
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        {/* Feature Card 1 */}
                        <div className="card card--interactive stagger-item">
                            <div className="text-center">
                                <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)', color: 'var(--primary-purple)' }}>
                                    <GraduationCap size={60} strokeWidth={1.5} />
                                </div>
                                <h3 style={{
                                    fontSize: '1.25rem',
                                    fontWeight: '600',
                                    marginBottom: 'var(--spacing-sm)',
                                    color: 'var(--text-primary)'
                                }}>
                                    Easy Exam Creation
                                </h3>
                                <p style={{
                                    color: 'var(--text-secondary)',
                                    fontSize: '0.95rem',
                                    lineHeight: '1.6'
                                }}>
                                    Create and customize exams in minutes with our intuitive interface
                                </p>
                            </div>
                        </div>

                        {/* Feature Card 2 */}
                        <div className="card card--interactive stagger-item">
                            <div className="text-center">
                                <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)', color: 'var(--accent-teal)' }}>
                                    <ChartNoAxesCombined size={60} strokeWidth={1.5} />
                                </div>
                                <h3 style={{
                                    fontSize: '1.25rem',
                                    fontWeight: '600',
                                    marginBottom: 'var(--spacing-sm)',
                                    color: 'var(--text-primary)'
                                }}>
                                    Real-time Analytics
                                </h3>
                                <p style={{
                                    color: 'var(--text-secondary)',
                                    fontSize: '0.95rem',
                                    lineHeight: '1.6'
                                }}>
                                    Track student performance and gain insights instantly
                                </p>
                            </div>
                        </div>

                        {/* Feature Card 3 */}
                        <div className="card card--interactive stagger-item">
                            <div className="text-center">
                                <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)', color: 'var(--success)' }}>
                                    <Lock size={60} strokeWidth={1.5} />
                                </div>
                                <h3 style={{
                                    fontSize: '1.25rem',
                                    fontWeight: '600',
                                    marginBottom: 'var(--spacing-sm)',
                                    color: 'var(--text-primary)'
                                }}>
                                    Secure & Reliable
                                </h3>
                                <p style={{
                                    color: 'var(--text-secondary)',
                                    fontSize: '0.95rem',
                                    lineHeight: '1.6'
                                }}>
                                    Your data is safe with enterprise-grade security
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Landing
