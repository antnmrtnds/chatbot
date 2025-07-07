# Enhanced Visitor Tracking System

## Overview

The enhanced visitor tracking system provides comprehensive analytics and lead scoring capabilities for the Viriato real estate platform. It uses multiple identification methods to ensure visitors are consistently tracked across sessions and devices.

## Key Features

### 🔍 Multi-Layer Visitor Identification
- **Primary**: localStorage visitor ID
- **Backup**: sessionStorage, IndexedDB, cookies
- **Device Fingerprinting**: Canvas, WebGL, hardware specs
- **Database Matching**: Fingerprint-based visitor recovery

### 📊 Comprehensive Analytics
- Page views and navigation patterns
- Time spent on each page
- Scroll depth tracking (25%, 50%, 75%, 100%)
- Click tracking (buttons, links, forms)
- Session duration and engagement metrics
- UTM parameter tracking
- Referrer information

### 🎯 Lead Scoring System
- Automatic point assignment based on interactions
- Behavioral scoring (time on site, pages viewed)
- Qualification data integration
- Hot/warm/cold lead classification

### 🔒 Privacy & Compliance
- GDPR consent tracking
- Anonymous visitor identification
- Secure data handling
- Configurable data retention

## Architecture

### Core Components

#### 1. VisitorTracker (`/src/lib/visitorTracker.ts`)
The main tracking class that handles:
- Visitor identification and persistence
- Device fingerprinting
- Event tracking and data collection
- Supabase integration

#### 2. AppTracker (`/src/components/AppTracker.tsx`)
React component that provides:
- Page view tracking
- Time on page measurement
- Scroll depth tracking
- Click event monitoring
- Session management

#### 3. Database Functions (`/supabase/tracking_function.sql`)
PostgreSQL functions for:
- Page view tracking with enhanced metadata
- Interaction tracking with dynamic scoring
- Time tracking with engagement metrics
- Lead score calculation

### Database Schema

#### leads_tracking table
```sql
- id: UUID (Primary Key)
- visitor_id: UUID (Unique visitor identifier)
- fingerprint_id: TEXT (Device fingerprint hash)
- contact_email: TEXT (Email when provided)
- contact_name: TEXT (Name when provided)
- contact_phone: TEXT (Phone when provided)
- pages_visited: TEXT[] (Array of visited URLs)
- time_on_site: INTEGER (Total time in seconds)
- session_count: INTEGER (Number of sessions)
- flat_pages_viewed: TEXT[] (Property pages viewed)
- lead_score: INTEGER (Calculated score 0-100)
- lead_status: TEXT (hot/warm/cold)
- lead_source: TEXT (traffic source)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- last_activity_at: TIMESTAMP
```

#### visitor_interactions table
```sql
- id: BIGINT (Primary Key)
- lead_id: UUID (Foreign Key to leads_tracking)
- interaction_type: TEXT (Type of interaction)
- points_awarded: INTEGER (Points for this interaction)
- details: JSONB (Additional interaction data)
- created_at: TIMESTAMP
```

## Usage

### Basic Implementation

The tracking system is automatically initialized when the application loads:

```typescript
import visitorTracker from '@/lib/visitorTracker';

// Track custom interactions
await visitorTracker.trackInteraction('button_click', {
  buttonText: 'Contact Us',
  page: '/contact'
});

// Track page views (handled automatically by AppTracker)
await visitorTracker.trackPageView('/custom-page');

// Link visitor with email when they provide contact info
await visitorTracker.linkVisitorWithEmail('user@example.com');
```

### Integration with Forms

When collecting lead information:

```typescript
// After successful form submission
await visitorTracker.linkVisitorWithEmail(email);
```

### Custom Event Tracking

Track specific business events:

```typescript
// Property interest
await visitorTracker.trackInteraction('property_interest', {
  propertyId: 'evergreen-pure-t2-01',
  priceRange: '300k-400k'
});

// Calculator usage
await visitorTracker.trackInteraction('calculator_use', {
  calculatorType: 'mortgage',
  result: 1200
});
```

## Interaction Types & Point Values

### Automatic Tracking
- `page_view`: 1 point
- `time_on_page`: 1-10 points (based on duration)
- `scroll_depth_25/50/75/100`: 2-5 points
- `button_click`: 3 points
- `form_interaction`: 10 points

### High-Value Interactions
- `phone_click`: 20 points
- `email_click`: 15 points
- `contact_form_view`: 12 points
- `calculator_use`: 12 points
- `download`: 15 points
- `lead_submission`: 50 points

### Engagement Tracking
- `long_session`: 15 points (5+ minutes)
- `property_favorite`: 10 points
- `property_share`: 8 points
- `video_play`: 8 points

## Lead Scoring Algorithm

### Score Calculation
- **Interaction Points**: Sum of all interaction points
- **Behavioral Bonus**: Additional points for high engagement
- **Qualification Data**: BANT/CHAMP scoring integration

### Lead Status Classification
- **Hot** (80+ points): High intent, immediate follow-up
- **Warm** (40-79 points): Moderate interest, nurture campaign
- **Cold** (0-39 points): Early stage, educational content

## Data Privacy & Security

### Anonymous Tracking
- No personal data collected without consent
- Visitor IDs are randomly generated UUIDs
- Device fingerprinting uses technical data only

### GDPR Compliance
- Consent tracking and timestamps
- Data retention policies
- Right to be forgotten support

### Data Security
- Encrypted data transmission
- Secure database storage
- Access control and audit logs

## Performance Considerations

### Client-Side Optimization
- Lazy loading of tracking scripts
- Debounced event handlers
- Efficient storage mechanisms
- Minimal performance impact

### Server-Side Efficiency
- Optimized database queries
- Batch processing for analytics
- Caching strategies
- Connection pooling

## Analytics Dashboard

### Key Metrics
- Total visitors and sessions
- Page views and popular content
- Conversion funnel analysis
- Lead score distribution
- Traffic source analysis

### Real-Time Monitoring
- Active visitor count
- Hot lead alerts
- Engagement metrics
- Performance indicators

## Troubleshooting

### Common Issues

#### Visitor Not Tracked
- Check browser compatibility
- Verify localStorage availability
- Ensure JavaScript is enabled
- Check network connectivity

#### Duplicate Visitors
- Clear browser storage for testing
- Verify fingerprinting accuracy
- Check database constraints
- Review conflict resolution logic

#### Missing Interactions
- Verify event handlers are attached
- Check console for errors
- Ensure proper component mounting
- Validate tracking function calls

### Debug Mode
Enable debug logging:
```typescript
// Set in browser console
localStorage.setItem('viriato_debug', 'true');
```

## Future Enhancements

### Planned Features
- Cross-device visitor linking
- Advanced behavioral segmentation
- Predictive lead scoring
- A/B testing integration
- Real-time personalization

### Integration Opportunities
- CRM system synchronization
- Email marketing automation
- Retargeting pixel integration
- Social media tracking
- Call tracking integration

## Support

For technical support or questions about the visitor tracking system:
- Review the code documentation
- Check the database schema
- Examine the tracking functions
- Test with debug mode enabled

## Version History

### v2.0.0 (Current)
- Multi-layer visitor identification
- Enhanced device fingerprinting
- Comprehensive interaction tracking
- Advanced lead scoring
- Privacy compliance features

### v1.0.0 (Previous)
- Basic visitor tracking
- Simple page view analytics
- localStorage-only persistence
- Basic lead scoring 