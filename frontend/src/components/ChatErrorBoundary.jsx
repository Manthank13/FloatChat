import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default class ChatErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[FloatChat ErrorBoundary caught an error]:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          background: 'rgba(30, 15, 20, 0.85)',
          border: '1px solid rgba(244, 63, 94, 0.4)',
          borderRadius: '12px',
          margin: '16px 0',
          color: '#F8FAFC',
          maxWidth: '720px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontWeight: 'bold', marginBottom: '8px', fontSize: '13px' }}>
            <AlertTriangle size={16} />
            <span>Response Display Notice</span>
          </div>
          <p style={{ fontSize: '14px', lineHeight: '1.5', margin: '0 0 12px 0', color: '#e2e8f0' }}>
            Unable to render this response card directly. Please retry your inquiry.
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            style={{
              padding: '6px 14px',
              background: 'rgba(0, 229, 255, 0.15)',
              border: '1px solid rgba(0, 229, 255, 0.4)',
              color: '#00e5ff',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px'
            }}
          >
            <RotateCcw size={13} />
            <span>Dismiss</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}