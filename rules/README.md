# Service Marketplace Application

A comprehensive service marketplace application that connects service seekers with providers through a transparent, competitive bidding system with AI-powered features.

## Project Overview

This application aims to boost competitiveness between service providers and seekers by ensuring full transparency of pricing, service details, deadlines, and quality. Users can post service requests, and multiple providers can bid on these requests in real time, resulting in better offers for the end users.

## Key Features

- **Map Interface**: Interactive map displaying service ads in the user's vicinity
- **Ad Posting with "I NEED" Button**: Quick and intuitive service request creation
- **AI Question Handler System**: Intelligent follow-up questions to refine service requests
- **Bidding System**: Real-time competitive offers from service providers
- **Social Feed**: Activity timeline showing connections and interactions between users
- **Review & Rating System**: Quality assurance through user feedback

## Technology Stack

- **Frontend**: React.js with Material UI
- **Backend**: Node.js with Express
- **Database**: Firebase Firestore
- **Authentication**: Firebase Authentication
- **Storage**: Firebase Storage
- **Real-time Features**: Firebase Realtime Database
- **Maps**: Leaflet.js
- **AI Integration**: OpenAI API

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)
- Firebase account
- OpenAI API key

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd service-marketplace
   ```

2. Install server dependencies:
   ```bash
   cd server
   npm install
   ```

3. Set up server environment variables:
   - Create a `.env` file in the server directory
   - Add the following variables:
     ```
     OPENAI_API_KEY=your_openai_api_key
     FIREBASE_PROJECT_ID=your_firebase_project_id
     PORT=5000
     ```

4. Install client dependencies:
   ```bash
   cd ../client
   npm install
   ```

5. Set up client environment variables:
   - Create a `.env.local` file in the client directory
   - Add the following variables:
     ```
     REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
     REACT_APP_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
     REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id
     REACT_APP_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
     REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
     REACT_APP_FIREBASE_APP_ID=your_firebase_app_id
     REACT_APP_API_URL=http://localhost:5000/api
     ```

### Running the Application

1. Start the backend server:
   ```bash
   cd server
   npm run dev
   ```

2. Start the frontend application:
   ```bash
   cd client
   npm start
   ```

3. Open your browser and visit: `http://localhost:3000`

## Project Structure

```
service-marketplace/
├── client/                   # React frontend
│   ├── public/               # Public assets
│   └── src/
│       ├── assets/           # Images, icons, etc.
│       ├── components/       # Reusable React components
│       │   ├── ad/           # Ad posting components
│       │   ├── auth/         # Authentication components
│       │   ├── bidding/      # Bidding system components
│       │   ├── feed/         # Social feed components
│       │   ├── map/          # Map interface components
│       │   ├── profile/      # User profile components
│       │   └── ui/           # UI components (buttons, cards, etc.)
│       ├── context/          # React context providers
│       ├── firebase/         # Firebase configuration
│       ├── hooks/            # Custom React hooks
│       ├── pages/            # Main application pages
│       ├── services/         # API services
│       ├── styles/           # Global styles
│       └── utils/            # Utility functions
├── docs/                     # Documentation
│   └── design_system.md      # UI design system guidelines
└── server/                   # Node.js backend
    ├── controllers/          # Route controllers
    ├── middleware/           # Express middleware
    ├── models/               # Data models
    ├── routes/               # API routes
    ├── services/             # Business logic services
    └── utils/                # Utility functions
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [React.js](https://reactjs.org/)
- [Node.js](https://nodejs.org/)
- [Firebase](https://firebase.google.com/)
- [Material UI](https://mui.com/)
- [Leaflet.js](https://leafletjs.com/)
- [OpenAI](https://openai.com/) 