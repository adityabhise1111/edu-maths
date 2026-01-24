import React from 'react';
import { GraduationCap, Mail, Phone, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer style={{
      backgroundColor: 'var(--bg-card)',
      color: 'var(--text-primary)',
      marginTop: 'auto',
      borderTop: '1px solid var(--border-color)'
    }}>
      <div className="container">
        <div className="py-6">
          <div className="grid grid-cols-3 gap-5">
            {/* Brand Section */}
            <div>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                marginBottom: 'var(--spacing-md)',
                color: 'var(--text-primary)'
              }}>
                <GraduationCap size={24} strokeWidth={2} className="inline-block mr-2" />
                EduMaths
              </h3>
              <p style={{
                fontSize: '0.95rem',
                color: 'var(--text-secondary)',
                lineHeight: '1.6'
              }}>
                Educational platform for mathematics learning and assessment.
                Empowering teachers and students worldwide.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 style={{
                fontSize: '1rem',
                fontWeight: '600',
                marginBottom: 'var(--spacing-md)',
                color: 'var(--text-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Quick Links
              </h4>
              <ul style={{
                listStyle: 'none',
                padding: '0',
                margin: '0'
              }}>
                <li style={{ marginBottom: 'var(--spacing-sm)' }}>
                  <a
                    href="/"
                    style={{
                      color: 'var(--text-secondary)',
                      textDecoration: 'none',
                      fontSize: '0.95rem',
                      transition: 'color var(--transition-fast)'
                    }}
                    onMouseEnter={(e) => e.target.style.color = 'var(--primary-purple)'}
                    onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
                  >
                    Home
                  </a>
                </li>
                <li style={{ marginBottom: 'var(--spacing-sm)' }}>
                  <a
                    href="/login"
                    style={{
                      color: 'var(--text-secondary)',
                      textDecoration: 'none',
                      fontSize: '0.95rem',
                      transition: 'color var(--transition-fast)'
                    }}
                    onMouseEnter={(e) => e.target.style.color = 'var(--primary-purple)'}
                    onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
                  >
                    Teacher Login
                  </a>
                </li>
                <li style={{ marginBottom: 'var(--spacing-sm)' }}>
                  <a
                    href="/signup"
                    style={{
                      color: 'var(--text-secondary)',
                      textDecoration: 'none',
                      fontSize: '0.95rem',
                      transition: 'color var(--transition-fast)'
                    }}
                    onMouseEnter={(e) => e.target.style.color = 'var(--primary-purple)'}
                    onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
                  >
                    Get Started
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 style={{
                fontSize: '1rem',
                fontWeight: '600',
                marginBottom: 'var(--spacing-md)',
                color: 'var(--text-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Contact
              </h4>
              <ul style={{
                listStyle: 'none',
                padding: '0',
                margin: '0'
              }}>
                <li style={{
                  marginBottom: 'var(--spacing-sm)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.95rem'
                }}>
                  <Mail size={16} strokeWidth={2} className="inline-block mr-2" />
                  info@edumaths.com
                </li>
                <li style={{
                  marginBottom: 'var(--spacing-sm)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.95rem'
                }}>
                  <Phone size={16} strokeWidth={2} className="inline-block mr-2" />
                  +1234567890
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div style={{
          borderTop: '1px solid var(--border-color)',
          paddingTop: 'var(--spacing-lg)',
          paddingBottom: 'var(--spacing-lg)',
          textAlign: 'center'
        }}>
          <p style={{
            margin: '0',
            color: 'var(--text-muted)',
            fontSize: '0.875rem'
          }}>
            © 2026 EduMaths. All rights reserved. Made with <Heart size={14} strokeWidth={2} className="inline-block text-red-500" fill="currentColor" /> for education.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

